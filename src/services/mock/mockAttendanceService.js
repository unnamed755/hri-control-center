import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { avg, countBy, sum, unique } from '@/lib/utils'
import { OFFICES } from '@/data/mock/constants'

const queryConfig = {
  search: (r) => [r.fullName, r.employeeCode, r.position, r.department, r.branch, r.status, r.office],
  dateField: 'date',
  defaultSort: 'date',
  defaultSortDir: 'desc',
  filters: {
    date: (row, value) => row.date === value,
    status: (row, value) => row.status === value,
    department: (row, value) => row.department === value,
    branch: (row, value) => row.branch === value,
    employeeId: (row, value) => row.employeeId === value,
    office: (row, value) => row.office === value,
    source: (row, value) => row.source === value,
    lateOnly: (row, value) => (String(value) === 'true' ? row.status === 'late' : true),
  },
}

export const getAttendanceDates = async () => {
  await latency(0.2)
  return unique(db.get('attendance').map((a) => a.date)).sort((a, b) => b.localeCompare(a))
}

export const getLatestAttendanceDate = () =>
  unique(db.get('attendance').map((a) => a.date)).sort((a, b) => b.localeCompare(a))[0] ?? null

export const getAttendance = async (params = {}) => {
  await latency()
  return applyQuery(db.get('attendance'), params, queryConfig)
}

export const getOfficeAttendance = async (params = {}) => {
  await latency()
  const rows = db.get('attendance').filter((a) => Boolean(a.office))
  return applyQuery(rows, params, queryConfig)
}

export const getAttendanceFacets = async () => {
  await latency(0.25)
  const rows = db.get('attendance')
  return {
    departments: facet(rows, 'department'),
    branches: facet(rows, 'branch'),
    offices: OFFICES.map((o) => ({ value: o.name, label: o.name })),
    dates: unique(rows.map((r) => r.date)).sort((a, b) => b.localeCompare(a)),
    sources: facet(rows, 'source'),
  }
}

const filterScope = (rows, { date, from, to, department, branch, office } = {}) =>
  rows.filter((r) => {
    if (date && r.date !== date) return false
    if (from && r.date < from) return false
    if (to && r.date > to) return false
    if (department && department !== 'all' && r.department !== department) return false
    if (branch && branch !== 'all' && r.branch !== branch) return false
    if (office && office !== 'all' && r.office !== office) return false
    return true
  })

export const getAttendanceSummary = async (scope = {}) => {
  await latency(0.35)
  const rows = filterScope(db.get('attendance'), scope)
  const counts = countBy(rows, (r) => r.status)
  const total = rows.length || 1
  const worked = rows.filter((r) => ['present', 'late', 'remote'].includes(r.status))
  return {
    total: rows.length,
    present: counts.present ?? 0,
    late: counts.late ?? 0,
    absent: counts.absent ?? 0,
    remote: counts.remote ?? 0,
    leave: counts.leave ?? 0,
    rate: Math.round(((counts.present ?? 0) + (counts.late ?? 0) + (counts.remote ?? 0)) / total * 100),
    punctuality: Math.round(((counts.present ?? 0) + (counts.remote ?? 0)) / total * 100),
    avgHours: Number(avg(worked, (r) => r.hours).toFixed(1)),
    totalHours: Math.round(sum(worked, (r) => r.hours)),
    overtimeHours: Number(sum(rows, (r) => r.overtimeHours).toFixed(1)),
    lateMinutes: sum(rows, (r) => r.lateMinutes),
    distribution: [
      { key: 'present', value: counts.present ?? 0 },
      { key: 'late', value: counts.late ?? 0 },
      { key: 'remote', value: counts.remote ?? 0 },
      { key: 'absent', value: counts.absent ?? 0 },
      { key: 'leave', value: counts.leave ?? 0 },
    ],
  }
}

export const getAttendanceTrend = async ({ days = 14, department, branch } = {}) => {
  await latency(0.4)
  const rows = filterScope(db.get('attendance'), { department, branch })
  const dates = unique(rows.map((r) => r.date))
    .sort()
    .slice(-days)
  return dates.map((date) => {
    const dayRows = rows.filter((r) => r.date === date)
    const counts = countBy(dayRows, (r) => r.status)
    const total = dayRows.length || 1
    return {
      date,
      present: counts.present ?? 0,
      late: counts.late ?? 0,
      absent: counts.absent ?? 0,
      remote: counts.remote ?? 0,
      leave: counts.leave ?? 0,
      rate: Math.round((((counts.present ?? 0) + (counts.late ?? 0) + (counts.remote ?? 0)) / total) * 100),
    }
  })
}

export const getDepartmentAttendance = async (scope = {}) => {
  await latency(0.35)
  const rows = filterScope(db.get('attendance'), scope)
  const departments = unique(rows.map((r) => r.department))
  return departments
    .map((department) => {
      const dep = rows.filter((r) => r.department === department)
      const counts = countBy(dep, (r) => r.status)
      const total = dep.length || 1
      return {
        department,
        present: counts.present ?? 0,
        late: counts.late ?? 0,
        absent: counts.absent ?? 0,
        remote: counts.remote ?? 0,
        rate: Math.round((((counts.present ?? 0) + (counts.late ?? 0) + (counts.remote ?? 0)) / total) * 100),
        headcount: unique(dep.map((r) => r.employeeId)).length,
      }
    })
    .sort((a, b) => b.rate - a.rate)
}

export const getOfficeSummary = async (date) => {
  await latency(0.3)
  const target = date ?? getLatestAttendanceDate()
  const rows = db.get('attendance').filter((a) => a.office && a.date === target)
  return OFFICES.map((office) => {
    const list = rows.filter((r) => r.office === office.name)
    const inside = list.filter((r) => ['present', 'late'].includes(r.status))
    return {
      ...office,
      date: target,
      total: list.length,
      inside: inside.length,
      remote: list.filter((r) => r.status === 'remote').length,
      absent: list.filter((r) => r.status === 'absent').length,
      leave: list.filter((r) => r.status === 'leave').length,
      occupancy: office.capacity ? Math.round((inside.length / office.capacity) * 100) : 0,
      avgHours: Number(avg(inside, (r) => r.hours).toFixed(1)),
      firstArrival: inside.map((r) => r.checkIn).filter(Boolean).sort()[0] ?? null,
      lastDeparture: inside.map((r) => r.checkOut).filter(Boolean).sort().at(-1) ?? null,
    }
  })
}

export const updateAttendance = async (id, patch) => {
  await latency(0.4)
  const updated = db.update('attendance', id, patch)
  invalidate([QK.attendance, QK.officeAttendance, ...AGGREGATE_KEYS])
  return updated
}

export const setAttendanceStatus = async (id, status) => updateAttendance(id, { status })
