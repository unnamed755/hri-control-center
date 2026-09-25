import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { countBy } from '@/lib/utils'

const isOverdue = (task) => task.status !== 'completed' && new Date(task.dueDate).getTime() < Date.now()

/** `overdue` is derived, never stored — the same rule a backend would apply. */
const decorate = (task) => ({
  ...task,
  overdue: isOverdue(task),
  effectiveStatus: isOverdue(task) ? 'overdue' : task.status,
  daysLeft: Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000),
})

const queryConfig = {
  search: (t) => [t.title, t.code, t.description, t.assigneeName, t.assigneeRole, t.module, t.priority, t.status],
  dateField: 'dueDate',
  defaultSort: 'dueDate',
  filters: {
    status: (row, value) => {
      if (value === 'overdue') return row.overdue
      if (value === 'open') return row.status !== 'completed'
      return row.status === value
    },
    priority: (row, value) => row.priority === value,
    module: (row, value) => row.module === value,
    assigneeId: (row, value) => row.assigneeId === value,
  },
}

export const getTasks = async (params = {}) => {
  await latency()
  return applyQuery(db.get('tasks').map(decorate), params, queryConfig)
}

export const getTaskById = async (id) => {
  await latency(0.4)
  const task = db.find('tasks', id)
  if (!task) throw new Error('Vazifa topilmadi')
  return decorate(task)
}

export const getTaskFacets = async () => {
  await latency(0.25)
  const rows = db.get('tasks')
  return {
    assignees: facet(rows, 'assigneeName').map((f) => ({
      value: rows.find((r) => r.assigneeName === f.value)?.assigneeId,
      label: f.value,
      count: f.count,
    })),
    modules: facet(rows, 'module'),
    priorities: facet(rows, 'priority'),
  }
}

export const getTaskStats = async () => {
  await latency(0.3)
  const rows = db.get('tasks').map(decorate)
  const counts = countBy(rows, (r) => r.effectiveStatus)
  return {
    total: rows.length,
    pending: counts.pending ?? 0,
    inProgress: counts.in_progress ?? 0,
    completed: counts.completed ?? 0,
    overdue: counts.overdue ?? 0,
    open: rows.filter((r) => r.status !== 'completed').length,
    urgent: rows.filter((r) => r.priority === 'urgent' && r.status !== 'completed').length,
    completionRate: rows.length ? Math.round(((counts.completed ?? 0) / rows.length) * 100) : 0,
    byModule: countBy(rows, (r) => r.module),
    byAssignee: Object.entries(
      rows.reduce((acc, r) => {
        acc[r.assigneeName] ??= { name: r.assigneeName, total: 0, done: 0, open: 0, overdue: 0 }
        acc[r.assigneeName].total += 1
        if (r.status === 'completed') acc[r.assigneeName].done += 1
        else acc[r.assigneeName].open += 1
        if (r.overdue) acc[r.assigneeName].overdue += 1
        return acc
      }, {}),
    ).map(([, v]) => v),
  }
}

const HR_TEAM = {
  'emp-003': { name: 'Nazarova Nilufar', role: 'HR bo‘lim boshlig‘i' },
  'emp-004': { name: 'Nazarov Rauf', role: 'Yetakchi rekruter' },
  'emp-005': { name: 'Abdullayeva Madina', role: 'Onboarding mutaxassisi' },
  'emp-006': { name: 'Yusupova Kamola', role: 'HR mutaxassis' },
  'emp-007': { name: 'Ergashev Otabek', role: 'Ta’lim mutaxassisi' },
  'emp-008': { name: 'Islomova Sabina', role: 'Rekruter' },
  'emp-009': { name: 'Tursunov Bekzod', role: 'Junior rekruter' },
  'emp-010': { name: 'Rahimov Anvar', role: 'Bosh buxgalter' },
}

export const createTask = async (payload) => {
  await latency()
  const assignee = HR_TEAM[payload.assigneeId] ?? HR_TEAM['emp-003']
  const record = {
    id: db.nextId('tasks', 'tsk'),
    code: `HRT-${String(db.get('tasks').length + 1).padStart(3, '0')}`,
    title: payload.title,
    description: payload.description ?? '',
    module: payload.module ?? 'employees',
    priority: payload.priority ?? 'medium',
    status: payload.status ?? 'pending',
    assigneeId: payload.assigneeId ?? 'emp-003',
    assigneeName: assignee.name,
    assigneeRole: assignee.role,
    department: 'HR',
    createdBy: payload.createdBy ?? 'Nazarova Nilufar',
    createdById: 'emp-003',
    createdAt: new Date().toISOString(),
    dueDate: payload.dueDate ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    completedAt: null,
    progress: 0,
    commentsCount: 0,
    attachments: 0,
  }
  db.insert('tasks', record)
  invalidate([QK.tasks, ...AGGREGATE_KEYS])
  return decorate(record)
}

export const updateTask = async (id, patch) => {
  await latency(0.5)
  const next = { ...patch }
  if (patch.assigneeId && HR_TEAM[patch.assigneeId]) {
    next.assigneeName = HR_TEAM[patch.assigneeId].name
    next.assigneeRole = HR_TEAM[patch.assigneeId].role
  }
  const updated = db.update('tasks', id, next)
  invalidate([QK.tasks, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const setTaskStatus = async (id, status) => {
  await latency(0.4)
  const updated = db.update('tasks', id, {
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : null,
    progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
  })
  invalidate([QK.tasks, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const deleteTask = async (id) => {
  await latency(0.4)
  db.remove('tasks', id)
  invalidate([QK.tasks, ...AGGREGATE_KEYS])
  return true
}
