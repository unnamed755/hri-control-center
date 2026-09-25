import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { avg, countBy, uid } from '@/lib/utils'
import { ONBOARDING_STAGES } from '@/config/dictionaries'
import { CHECKLIST_TEMPLATE, STAGE_SEQUENCE } from '@/data/mock/onboarding'

const HR_TEAM = [
  { id: 'emp-005', name: 'Abdullayeva Madina' },
  { id: 'emp-006', name: 'Yusupova Kamola' },
  { id: 'emp-007', name: 'Ergashev Otabek' },
]

const progressOf = (record) => {
  const total = record.checklist?.length || 1
  const done = record.checklist?.filter((c) => c.done).length ?? 0
  return Math.round((done / total) * 100)
}

const decorate = (record) => ({
  ...record,
  progress: progressOf(record),
  stageIndex: ONBOARDING_STAGES.indexOf(record.stage),
  checklistDone: record.checklist?.filter((c) => c.done).length ?? 0,
  checklistTotal: record.checklist?.length ?? 0,
  daysInProcess: Math.max(0, Math.round((Date.now() - new Date(record.createdAt).getTime()) / 86400000)),
  isCompleted: record.stage === 'started',
})

const queryConfig = {
  search: (r) => [r.fullName, r.position, r.department, r.branch, r.hrResponsibleName, r.mentorName, r.stage, r.phone],
  dateField: 'createdAt',
  defaultSort: 'createdAt',
  defaultSortDir: 'desc',
  filters: {
    stage: (row, value) => (value === 'active' ? row.stage !== 'started' : row.stage === value),
    department: (row, value) => row.department === value,
    branch: (row, value) => row.branch === value,
    hrResponsibleId: (row, value) => row.hrResponsibleId === value,
    level: (row, value) => row.level === value,
  },
}

export const getOnboardingRecords = async (params = {}) => {
  await latency()
  const rows = db.get('onboarding').map(decorate)
  return applyQuery(rows, params, queryConfig)
}

export const getOnboardingById = async (id) => {
  await latency()
  const record = db.find('onboarding', id)
  if (!record) throw new Error('Onboarding yozuvi topilmadi')
  const candidate = db.find('candidates', record.candidateId)
  const employee = record.employeeId ? db.find('employees', record.employeeId) : null
  const vacancy = record.vacancyId ? db.find('vacancies', record.vacancyId) : null
  return { ...decorate(record), candidate, employee, vacancy }
}

export const getOnboardingFacets = async () => {
  await latency(0.3)
  const rows = db.get('onboarding')
  return {
    departments: facet(rows, 'department'),
    branches: facet(rows, 'branch'),
    hrResponsibles: HR_TEAM.map((h) => ({ value: h.id, label: h.name })),
    stageCounts: countBy(rows, (r) => r.stage),
  }
}

export const getOnboardingStats = async () => {
  await latency(0.35)
  const rows = db.get('onboarding').map(decorate)
  const active = rows.filter((r) => r.stage !== 'started')
  const completed = rows.filter((r) => r.stage === 'started')
  return {
    total: rows.length,
    active: active.length,
    completed: completed.length,
    avgProgress: Math.round(avg(active, (r) => r.progress)),
    avgDays: Math.round(avg(completed, (r) => r.daysInProcess)) || 0,
    completionRate: rows.length ? Math.round((completed.length / rows.length) * 100) : 0,
    byStage: ONBOARDING_STAGES.map((stage) => ({
      stage,
      value: rows.filter((r) => r.stage === stage).length,
    })),
    readyToStart: active.filter((r) => r.stage === 'ready').length,
    startingThisWeek: active.filter(
      (r) => new Date(r.targetStartDate).getTime() - Date.now() < 7 * 86400000,
    ).length,
  }
}

/** Creates the onboarding record for an accepted candidate. */
export const createFromCandidate = async (candidate, { hrResponsibleId, targetStartDate } = {}) => {
  await latency(0.7)
  const existing = db.get('onboarding').find((o) => o.candidateId === candidate.id)
  if (existing) return decorate(existing)

  const hr = HR_TEAM.find((h) => h.id === hrResponsibleId) ?? HR_TEAM[0]
  const mentorPool = db
    .get('employees')
    .filter((e) => e.department === candidate.department && e.status !== 'terminated' && e.level !== 'intern')
  const mentor = mentorPool[0] ?? null
  const now = new Date().toISOString()

  const record = {
    id: db.nextId('onboarding', 'onb'),
    candidateId: candidate.id,
    employeeId: null,
    fullName: candidate.fullName,
    avatarTone: candidate.avatarTone,
    phone: candidate.phone,
    position: candidate.profession,
    department: candidate.department,
    branch: candidate.branch,
    vacancyId: candidate.vacancyId,
    vacancyTitle: candidate.vacancyTitle,
    level: candidate.level,
    stage: 'accepted',
    hrResponsibleId: hr.id,
    hrResponsibleName: hr.name,
    mentorId: mentor?.id ?? null,
    mentorName: mentor?.fullName ?? '—',
    createdAt: now,
    updatedAt: now,
    targetStartDate: targetStartDate ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    completedAt: null,
    salaryOffer: candidate.expectedSalary,
    checklist: CHECKLIST_TEMPLATE.map((item) => ({ ...item, done: false, doneAt: null })),
    notes: [],
    history: [{ stage: 'accepted', at: now, by: hr.name }],
  }
  db.insert('onboarding', record)
  invalidate([QK.onboarding, QK.candidates, ...AGGREGATE_KEYS])
  return decorate(record)
}

export const setStage = async (id, stage, { by = 'Super Admin' } = {}) => {
  await latency(0.7)
  const now = new Date().toISOString()
  const targetIndex = STAGE_SEQUENCE.indexOf(stage)
  const updated = db.update('onboarding', id, (row) => ({
    stage,
    updatedAt: now,
    completedAt: stage === 'started' ? now : null,
    // moving forward closes the checklist of every passed stage
    checklist: row.checklist.map((item) => {
      const itemIndex = STAGE_SEQUENCE.indexOf(item.stage)
      if (itemIndex < targetIndex && !item.done) return { ...item, done: true, doneAt: now }
      return item
    }),
    history: [...(row.history ?? []), { stage, at: now, by }],
  }))
  invalidate([QK.onboarding, QK.candidates, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const toggleChecklistItem = async (id, itemId) => {
  await latency(0.35)
  const now = new Date().toISOString()
  const updated = db.update('onboarding', id, (row) => ({
    updatedAt: now,
    checklist: row.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done, doneAt: item.done ? null : now } : item,
    ),
  }))
  invalidate([QK.onboarding, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const addNote = async (id, text, author = 'Super Admin') => {
  await latency(0.4)
  const updated = db.update('onboarding', id, (row) => ({
    notes: [...(row.notes ?? []), { id: uid('onote'), author, text, createdAt: new Date().toISOString() }],
  }))
  invalidate([QK.onboarding])
  return decorate(updated)
}

export const assignHrResponsible = async (id, hrResponsibleId) => {
  await latency(0.4)
  const hr = HR_TEAM.find((h) => h.id === hrResponsibleId) ?? HR_TEAM[0]
  const updated = db.update('onboarding', id, { hrResponsibleId: hr.id, hrResponsibleName: hr.name })
  invalidate([QK.onboarding])
  return decorate(updated)
}

export const updateOnboarding = async (id, patch) => {
  await latency(0.5)
  const updated = db.update('onboarding', id, { ...patch, updatedAt: new Date().toISOString() })
  invalidate([QK.onboarding, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const linkEmployee = async (id, employeeId) => {
  const updated = db.update('onboarding', id, { employeeId })
  invalidate([QK.onboarding, QK.employees])
  return decorate(updated)
}

export const deleteOnboarding = async (id) => {
  await latency()
  db.remove('onboarding', id)
  invalidate([QK.onboarding, ...AGGREGATE_KEYS])
  return true
}
