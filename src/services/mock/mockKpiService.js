import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { avg, sum, unique } from '@/lib/utils'
import { monthKey } from '@/lib/format'
import { KPI_BANDS, kpiBand } from '@/data/mock/kpi'

const queryConfig = {
  search: (r) => [r.fullName, r.employeeCode, r.position, r.department, r.branch],
  defaultSort: 'kpi',
  defaultSortDir: 'desc',
  filters: {
    month: (row, value) => row.month === value,
    department: (row, value) => row.department === value,
    branch: (row, value) => row.branch === value,
    band: (row, value) => kpiBand(row.kpi).key === value,
    employeeId: (row, value) => row.employeeId === value,
  },
}

const activeIds = () => new Set(db.get('employees').filter((e) => e.status !== 'terminated').map((e) => e.id))

export const getKpiMonths = async () => {
  await latency(0.2)
  return unique(db.get('kpi').map((k) => k.month)).sort((a, b) => b.localeCompare(a))
}

export const getKpiRecords = async (params = {}) => {
  await latency()
  const ids = activeIds()
  const month = params.filters?.month ?? monthKey()
  const rows = db.get('kpi').filter((k) => ids.has(k.employeeId))
  return applyQuery(rows, { ...params, filters: { ...params.filters, month } }, queryConfig)
}

export const getKpiSummary = async (month = monthKey()) => {
  await latency(0.35)
  const ids = activeIds()
  const all = db.get('kpi').filter((k) => ids.has(k.employeeId))
  const rows = all.filter((k) => k.month === month)
  const months = unique(all.map((k) => k.month)).sort()
  const prev = months[months.indexOf(month) - 1]
  const prevRows = prev ? all.filter((k) => k.month === prev) : []

  const average = Math.round(avg(rows, (r) => r.kpi))
  const prevAverage = Math.round(avg(prevRows, (r) => r.kpi))

  return {
    month,
    average,
    prevAverage,
    change: prevAverage ? Number((average - prevAverage).toFixed(1)) : 0,
    coins: sum(rows, (r) => r.coins),
    coinsPrev: sum(prevRows, (r) => r.coins),
    employees: rows.length,
    topScore: rows.length ? Math.max(...rows.map((r) => r.kpi)) : 0,
    lowScore: rows.length ? Math.min(...rows.map((r) => r.kpi)) : 0,
    above90: rows.filter((r) => r.kpi >= 90).length,
    below70: rows.filter((r) => r.kpi < 70).length,
    avgQuality: Math.round(avg(rows, (r) => r.qualityScore)),
    avgDiscipline: Math.round(avg(rows, (r) => r.disciplineScore)),
    tasksCompleted: sum(rows, (r) => r.tasksCompleted),
    tasksPlanned: sum(rows, (r) => r.tasksPlanned),
    distribution: KPI_BANDS.map((band) => ({
      ...band,
      value: rows.filter((r) => r.kpi >= band.min && r.kpi <= band.max).length,
    })),
    trend: months.map((m) => {
      const monthRows = all.filter((k) => k.month === m)
      return {
        month: m,
        kpi: Math.round(avg(monthRows, (r) => r.kpi)),
        coins: sum(monthRows, (r) => r.coins),
        quality: Math.round(avg(monthRows, (r) => r.qualityScore)),
      }
    }),
  }
}

export const getDepartmentPerformance = async (month = monthKey()) => {
  await latency(0.35)
  const ids = activeIds()
  const rows = db.get('kpi').filter((k) => k.month === month && ids.has(k.employeeId))
  const departments = unique(rows.map((r) => r.department))
  return departments
    .map((department) => {
      const list = rows.filter((r) => r.department === department)
      return {
        department,
        kpi: Math.round(avg(list, (r) => r.kpi)),
        coins: sum(list, (r) => r.coins),
        headcount: list.length,
        quality: Math.round(avg(list, (r) => r.qualityScore)),
        discipline: Math.round(avg(list, (r) => r.disciplineScore)),
        attendance: Math.round(avg(list, (r) => r.attendanceScore)),
        tasksRate: Math.round((sum(list, (r) => r.tasksCompleted) / Math.max(1, sum(list, (r) => r.tasksPlanned))) * 100),
      }
    })
    .sort((a, b) => b.kpi - a.kpi)
}

export const getTopPerformers = async ({ month = monthKey(), limit = 8 } = {}) => {
  await latency(0.3)
  const ids = activeIds()
  return db
    .get('kpi')
    .filter((k) => k.month === month && ids.has(k.employeeId))
    .sort((a, b) => b.kpi - a.kpi || b.coins - a.coins)
    .slice(0, limit)
}

export const getAttentionList = async ({ month = monthKey(), limit = 8 } = {}) => {
  await latency(0.3)
  const ids = activeIds()
  const employees = db.get('employees')
  return db
    .get('kpi')
    .filter((k) => k.month === month && ids.has(k.employeeId))
    .sort((a, b) => a.kpi - b.kpi)
    .slice(0, limit)
    .map((row) => {
      const emp = employees.find((e) => e.id === row.employeeId)
      const reasons = []
      if (row.kpi < 70) reasons.push('KPI 70% dan past')
      if ((emp?.lateCount ?? 0) >= 4) reasons.push(`${emp.lateCount} marta kechikish`)
      if ((emp?.absentCount ?? 0) >= 2) reasons.push(`${emp.absentCount} kun kelmagan`)
      if (row.tasksCompleted / Math.max(1, row.tasksPlanned) < 0.7) reasons.push('Vazifalar bajarilishi past')
      if (!reasons.length) reasons.push('KPI o‘rtachadan past')
      return { ...row, status: emp?.status, lateCount: emp?.lateCount ?? 0, reasons }
    })
}

export const getEmployeeKpiHistory = async (employeeId) => {
  await latency(0.3)
  return db
    .get('kpi')
    .filter((k) => k.employeeId === employeeId)
    .sort((a, b) => a.month.localeCompare(b.month))
}

export const getKpiFacets = async () => {
  await latency(0.2)
  const rows = db.get('kpi')
  return {
    departments: facet(rows, 'department'),
    branches: facet(rows, 'branch'),
    months: unique(rows.map((r) => r.month)).sort((a, b) => b.localeCompare(a)),
    bands: KPI_BANDS.map((b) => ({ value: b.key, label: b.label })),
  }
}

export const updateKpi = async (id, patch) => {
  await latency(0.4)
  const updated = db.update('kpi', id, patch)
  if (updated?.isCurrent) {
    db.update('employees', updated.employeeId, { kpi: updated.kpi, coins: updated.coins })
  }
  invalidate([QK.kpi, QK.employees, ...AGGREGATE_KEYS])
  return updated
}

/** New employee → current-month KPI row so the performance pages stay complete. */
export const ensureKpiForEmployee = async (employee, month = monthKey()) => {
  const exists = db.get('kpi').some((k) => k.employeeId === employee.id && k.month === month)
  if (exists) return null
  const record = {
    id: `kpi-${month}-${employee.id}`,
    month,
    employeeId: employee.id,
    employeeCode: employee.code,
    fullName: employee.fullName,
    avatarTone: employee.avatarTone,
    position: employee.position,
    department: employee.department,
    branch: employee.branch,
    kpi: employee.kpi,
    coins: employee.coins,
    tasksPlanned: 10,
    tasksCompleted: 0,
    qualityScore: employee.kpi,
    attendanceScore: employee.attendanceRate,
    disciplineScore: 100,
    trend: 0,
    isCurrent: true,
  }
  db.insert('kpi', record)
  invalidate([QK.kpi, ...AGGREGATE_KEYS])
  return record
}

export { KPI_BANDS, kpiBand }
