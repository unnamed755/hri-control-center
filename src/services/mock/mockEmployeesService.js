import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { avg, countBy, sum } from '@/lib/utils'
import { monthKey } from '@/lib/format'
import { AVATAR_TONES, DOCUMENT_TYPES } from '@/data/mock/constants'

const searchFields = (e) => [
  e.fullName,
  e.code,
  e.position,
  e.department,
  e.branch,
  e.phone,
  e.email,
  e.level,
  e.status,
]

const queryConfig = {
  search: searchFields,
  dateField: 'hiredAt',
  defaultSort: 'fullName',
  filters: {
    status: (row, value) => row.status === value,
    department: (row, value) => row.department === value,
    branch: (row, value) => row.branch === value,
    position: (row, value) => row.position === value,
    level: (row, value) => row.level === value,
    employmentType: (row, value) => row.employmentType === value,
    isCashier: (row, value) => String(row.isCashier) === String(value),
    kpiBand: (row, value) => {
      if (value === 'high') return row.kpi >= 85
      if (value === 'mid') return row.kpi >= 70 && row.kpi < 85
      return row.kpi < 70
    },
    activeOnly: (row, value) => (String(value) === 'true' ? row.status !== 'terminated' : true),
  },
}

/** Adds the cross-module columns the employee table shows (payroll + onboarding). */
const withRelations = (rows) => {
  const month = monthKey()
  const payrollByEmployee = new Map(
    db
      .get('payroll')
      .filter((p) => p.month === month)
      .map((p) => [p.employeeId, p]),
  )
  const onboardingByEmployee = new Map(
    db.get('onboarding').map((o) => [o.employeeId ?? o.candidateId, o]),
  )
  return rows.map((row) => ({
    ...row,
    payrollStatus: payrollByEmployee.get(row.id)?.status ?? null,
    payrollNet: payrollByEmployee.get(row.id)?.net ?? null,
    onboardingStage: onboardingByEmployee.get(row.id)?.stage ?? (row.onboardingStatus === 'completed' ? 'started' : null),
  }))
}

export const getEmployees = async (params = {}) => {
  await latency()
  return applyQuery(withRelations(db.get('employees')), params, queryConfig)
}

export const getEmployeeOptions = async () => {
  await latency(0.3)
  return db
    .get('employees')
    .filter((e) => e.status !== 'terminated')
    .map((e) => ({ value: e.id, label: `${e.fullName} · ${e.position}` }))
}

export const getEmployeeFacets = async () => {
  await latency(0.4)
  const rows = db.get('employees')
  return {
    departments: facet(rows, 'department'),
    branches: facet(rows, 'branch'),
    positions: facet(rows, 'position'),
    levels: facet(rows, 'level'),
    statuses: facet(rows, 'status'),
    employmentTypes: facet(rows, 'employmentType'),
  }
}

export const getEmployeeById = async (id) => {
  await latency()
  const employee = db.find('employees', id)
  if (!employee) throw new Error('Xodim topilmadi')

  const employees = db.get('employees')
  const manager = employees.find((e) => e.id === employee.managerId) ?? null
  const team = employees.filter((e) => e.managerId === employee.id && e.status !== 'terminated')

  const kpiHistory = db
    .get('kpi')
    .filter((k) => k.employeeId === id)
    .sort((a, b) => a.month.localeCompare(b.month))

  const attendance = db
    .get('attendance')
    .filter((a) => a.employeeId === id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const attendanceSummary = countBy(attendance, (a) => a.status)

  const payroll = db
    .get('payroll')
    .filter((p) => p.employeeId === id)
    .sort((a, b) => b.month.localeCompare(a.month))

  const onboarding = db.get('onboarding').find((o) => o.employeeId === id || o.candidateId === employee.candidateId)
  const candidate = employee.candidateId ? db.find('candidates', employee.candidateId) : null
  const cashier = db.get('cashiers').find((c) => c.employeeId === id) ?? null

  return {
    ...employee,
    manager,
    team,
    kpiHistory,
    attendance: attendance.slice(0, 30),
    attendanceSummary,
    attendanceHours: Number(sum(attendance, (a) => a.hours).toFixed(1)),
    payroll,
    currentPayroll: payroll.find((p) => p.month === monthKey()) ?? payroll[0] ?? null,
    onboarding: onboarding ?? null,
    candidate,
    cashier,
  }
}

export const getEmployeeStats = async () => {
  await latency(0.4)
  const rows = db.get('employees')
  const active = rows.filter((e) => e.status !== 'terminated')
  const thirtyDaysAgo = Date.now() - 30 * 86400000
  return {
    total: active.length,
    newThisMonth: active.filter((e) => new Date(e.hiredAt).getTime() >= thirtyDaysAgo).length,
    probation: active.filter((e) => e.status === 'probation').length,
    onLeave: active.filter((e) => e.status === 'leave').length,
    terminated: rows.filter((e) => e.status === 'terminated').length,
    cashiers: active.filter((e) => e.isCashier).length,
    avgKpi: Math.round(avg(active, (e) => e.kpi)),
    avgAttendance: Math.round(avg(active, (e) => e.attendanceRate)),
    payrollMonthly: sum(active, (e) => e.salary),
    byDepartment: countBy(active, (e) => e.department),
    byBranch: countBy(active, (e) => e.branch),
  }
}

const buildDocuments = () =>
  DOCUMENT_TYPES.slice(0, 4).map((name, i) => ({
    id: `doc-${i}`,
    name,
    status: i === 0 ? 'verified' : 'pending',
    updatedAt: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  }))

export const createEmployee = async (payload) => {
  await latency()
  const id = db.nextId('employees', 'emp')
  const index = db.get('employees').length
  const record = {
    id,
    code: `HRI-${1000 + index}`,
    fullName: payload.fullName,
    firstName: payload.fullName?.split(' ')[1] ?? payload.fullName,
    lastName: payload.fullName?.split(' ')[0] ?? '',
    gender: payload.gender ?? 'male',
    avatarTone: payload.avatarTone ?? AVATAR_TONES[index % AVATAR_TONES.length],
    birthDate: payload.birthDate ?? null,
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    position: payload.position ?? '—',
    department: payload.department ?? 'Savdo',
    branch: payload.branch ?? 'Bosh ofis',
    level: payload.level ?? 'junior',
    employmentType: payload.employmentType ?? 'full',
    status: payload.status ?? 'probation',
    hiredAt: payload.hiredAt ?? new Date().toISOString(),
    tenureDays: 0,
    terminatedAt: null,
    managerId: payload.managerId ?? 'emp-011',
    salary: Number(payload.salary) || 4000000,
    kpi: Number(payload.kpi) || 70,
    coins: 0,
    attendanceRate: 100,
    lateCount: 0,
    absentCount: 0,
    remoteDays: 0,
    isCashier: payload.position === 'Kassir',
    onboardingStatus: payload.onboardingStatus ?? 'completed',
    onboardingCompletedAt: payload.onboardingCompletedAt ?? new Date().toISOString(),
    candidateId: payload.candidateId ?? null,
    education: payload.education ?? '—',
    address: payload.address ?? '—',
    passport: payload.passport ?? '—',
    bankCard: '8600 **** **** ****',
    contractNo: `SH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(index).padStart(3, '0')}`,
    emergencyContact: '',
    role: null,
    documents: payload.documents ?? buildDocuments(),
    skills: payload.skills ?? [],
  }
  db.insert('employees', record)

  if (record.isCashier) {
    db.insert('cashiers', {
      id: db.nextId('cashiers', 'csh'),
      employeeId: record.id,
      employeeCode: record.code,
      fullName: record.fullName,
      avatarTone: record.avatarTone,
      phone: record.phone,
      branch: record.branch,
      department: record.department,
      position: record.position,
      level: record.level,
      status: record.status,
      terminalId: `POS-${record.branch.slice(0, 3).toUpperCase()}-NEW`,
      shift: '09:00 – 18:00',
      sales: 0,
      transactions: 0,
      avgTicket: 0,
      refunds: 0,
      cashDiscrepancy: 0,
      kpi: record.kpi,
      coins: 0,
      attendanceRate: 100,
      lastShiftAt: null,
      hiredAt: record.hiredAt,
      salary: record.salary,
    })
  }

  invalidate([QK.employees, QK.cashiers, QK.org, ...AGGREGATE_KEYS])
  return record
}

export const updateEmployee = async (id, patch) => {
  await latency()
  const updated = db.update('employees', id, patch)
  if (updated?.isCashier) {
    db.updateWhere(
      'cashiers',
      (c) => c.employeeId === id,
      { fullName: updated.fullName, branch: updated.branch, kpi: updated.kpi, status: updated.status },
    )
  }
  invalidate([QK.employees, QK.cashiers, QK.org, QK.payroll, ...AGGREGATE_KEYS])
  return updated
}

export const terminateEmployee = async (id, { reason = 'Shaxsiy sababga ko‘ra', date } = {}) => {
  await latency()
  const updated = db.update('employees', id, {
    status: 'terminated',
    terminatedAt: date ?? new Date().toISOString(),
    terminationReason: reason,
  })
  db.updateWhere('cashiers', (c) => c.employeeId === id, { status: 'terminated' })
  invalidate([QK.employees, QK.cashiers, QK.org, QK.payroll, QK.attendance, ...AGGREGATE_KEYS])
  return updated
}

export const restoreEmployee = async (id) => {
  await latency()
  const updated = db.update('employees', id, { status: 'active', terminatedAt: null, terminationReason: null })
  invalidate([QK.employees, QK.cashiers, QK.org, ...AGGREGATE_KEYS])
  return updated
}

export const deleteEmployee = async (id) => {
  await latency()
  db.remove('employees', id)
  db.replace(
    'cashiers',
    db.get('cashiers').filter((c) => c.employeeId !== id),
  )
  invalidate([QK.employees, QK.cashiers, QK.org, ...AGGREGATE_KEYS])
  return true
}
