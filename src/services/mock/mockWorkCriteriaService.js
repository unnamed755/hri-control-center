import { db } from './db'
import { latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { avg, groupBy, sum, unique } from '@/lib/utils'
import { monthKey } from '@/lib/format'

/** Live "actual" value for each criterion, read from the module it belongs to. */
const actualFor = (criterion) => {
  const employees = db.get('employees').filter((e) => e.status !== 'terminated')
  const attendance = db.get('attendance')
  const kpi = db.get('kpi').filter((k) => k.month === monthKey())
  const cashiers = db.get('cashiers')
  const onboarding = db.get('onboarding')
  const tasks = db.get('tasks')

  switch (criterion.metric) {
    case 'attendance':
      return Math.round(avg(employees, (e) => e.attendanceRate))
    case 'late':
      return Number(avg(employees, (e) => e.lateCount).toFixed(1))
    case 'tasks': {
      const done = tasks.filter((t) => t.status === 'completed').length
      return tasks.length ? Math.round((done / tasks.length) * 100) : 0
    }
    case 'sales': {
      const sales = sum(cashiers, (c) => c.sales)
      const plan = cashiers.length * 120_000_000
      return plan ? Math.round((sales / plan) * 100) : 0
    }
    case 'quality':
      return Math.round(avg(kpi, (k) => k.qualityScore))
    case 'discrepancy':
      return Math.round(avg(cashiers, (c) => Math.abs(c.cashDiscrepancy)))
    case 'onboarding':
      return onboarding.length
        ? Math.round((onboarding.filter((o) => o.stage === 'started').length / onboarding.length) * 100)
        : 0
    case 'training':
      return Math.round(avg(kpi, (k) => k.qualityScore) * 0.95)
    case 'experience':
      return Number((avg(employees, (e) => e.tenureDays) / 365).toFixed(1))
    case 'mentoring':
      return unique(employees.map((e) => e.managerId)).length
    case 'coins':
      return Math.round(avg(kpi, (k) => k.coins))
    case 'safety':
      return db.get('cameras').filter((c) => c.status !== 'online').length
    default:
      return 0
  }
}

const decorate = (criterion) => {
  const actual = actualFor(criterion)
  const target = Number(criterion.target) || 0
  const achieved =
    criterion.direction === 'lower'
      ? actual <= target
      : target
        ? actual >= target
        : actual > 0
  const ratio =
    criterion.direction === 'lower'
      ? target === 0
        ? actual === 0
          ? 100
          : Math.max(0, 100 - actual * 10)
        : Math.min(100, Math.round((target / Math.max(actual, 0.01)) * 100))
      : target
        ? Math.min(140, Math.round((actual / target) * 100))
        : 0
  return { ...criterion, actual, achieved, ratio }
}

export const getWorkCriteria = async () => {
  await latency(0.5)
  return db.get('workCriteria').map(decorate)
}

export const getWorkCriteriaGrouped = async () => {
  await latency(0.5)
  const rows = db.get('workCriteria').map(decorate)
  const grouped = groupBy(rows, (r) => r.group)
  return Object.entries(grouped).map(([group, list]) => ({
    group,
    criteria: list,
    weight: sum(list, (c) => (c.enabled ? c.weight : 0)),
    achieved: list.filter((c) => c.achieved && c.enabled).length,
    total: list.filter((c) => c.enabled).length,
    score: Math.round(avg(list.filter((c) => c.enabled), (c) => Math.min(100, c.ratio))),
  }))
}

export const getWorkCriteriaSummary = async () => {
  await latency(0.3)
  const rows = db.get('workCriteria').map(decorate)
  const enabled = rows.filter((r) => r.enabled)
  return {
    total: rows.length,
    enabled: enabled.length,
    disabled: rows.length - enabled.length,
    totalWeight: sum(enabled, (r) => r.weight),
    achieved: enabled.filter((r) => r.achieved).length,
    atRisk: enabled.filter((r) => !r.achieved).length,
    overallScore: Math.round(avg(enabled, (r) => Math.min(100, r.ratio))),
    groups: unique(rows.map((r) => r.group)).length,
  }
}

export const updateCriterion = async (id, patch) => {
  await latency(0.4)
  const updated = db.update('workCriteria', id, patch)
  invalidate([QK.workCriteria, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const toggleCriterion = async (id) => {
  await latency(0.3)
  const row = db.find('workCriteria', id)
  const updated = db.update('workCriteria', id, { enabled: !row?.enabled })
  invalidate([QK.workCriteria, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const createCriterion = async (payload) => {
  await latency(0.5)
  const record = {
    id: db.nextId('workCriteria', 'crt'),
    name: payload.name,
    group: payload.group ?? 'Samaradorlik',
    metric: payload.metric ?? 'tasks',
    weight: Number(payload.weight) || 10,
    target: Number(payload.target) || 100,
    unit: payload.unit ?? '%',
    direction: payload.direction ?? 'higher',
    appliesTo: payload.appliesTo ?? 'all',
    description: payload.description ?? '',
    enabled: payload.enabled ?? true,
    source: payload.source ?? 'Qo‘lda kiritilgan',
  }
  db.insert('workCriteria', record, { prepend: false })
  invalidate([QK.workCriteria, ...AGGREGATE_KEYS])
  return decorate(record)
}

export const deleteCriterion = async (id) => {
  await latency(0.4)
  db.remove('workCriteria', id)
  invalidate([QK.workCriteria, ...AGGREGATE_KEYS])
  return true
}
