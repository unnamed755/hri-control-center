import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { sum, unique } from '@/lib/utils'
import { monthKey } from '@/lib/format'

const queryConfig = {
  search: (r) => [r.fullName, r.employeeCode, r.position, r.department, r.branch, r.status, r.method],
  dateField: 'paidAt',
  defaultSort: 'net',
  defaultSortDir: 'desc',
  filters: {
    month: (row, value) => row.month === value,
    status: (row, value) => row.status === value,
    department: (row, value) => row.department === value,
    branch: (row, value) => row.branch === value,
    method: (row, value) => row.method === value,
    employeeId: (row, value) => row.employeeId === value,
  },
}

export const getPayrollMonths = async () => {
  await latency(0.25)
  return unique(db.get('payroll').map((p) => p.month)).sort((a, b) => b.localeCompare(a))
}

export const getPayroll = async (params = {}) => {
  await latency()
  const month = params.filters?.month ?? monthKey()
  const rows = db.get('payroll')
  return applyQuery(rows, { ...params, filters: { ...params.filters, month } }, queryConfig)
}

export const getPayrollById = async (id) => {
  await latency(0.5)
  const record = db.find('payroll', id)
  if (!record) throw new Error('Payroll yozuvi topilmadi')
  const employee = db.find('employees', record.employeeId)
  const history = db
    .get('payroll')
    .filter((p) => p.employeeId === record.employeeId)
    .sort((a, b) => b.month.localeCompare(a.month))
  return { ...record, employee, history }
}

export const getPayrollSummary = async (month = monthKey()) => {
  await latency(0.4)
  const all = db.get('payroll')
  const rows = all.filter((p) => p.month === month)
  const months = unique(all.map((p) => p.month)).sort()
  const prevMonth = months[months.indexOf(month) - 1]
  const prevRows = prevMonth ? all.filter((p) => p.month === prevMonth) : []

  const total = sum(rows, (r) => r.net)
  const prevTotal = sum(prevRows, (r) => r.net)

  return {
    month,
    total,
    gross: sum(rows, (r) => r.gross),
    base: sum(rows, (r) => r.baseSalary),
    bonus: sum(rows, (r) => r.bonus) + sum(rows, (r) => r.coinsBonus),
    overtime: sum(rows, (r) => r.overtime),
    deductions: sum(rows, (r) => r.deductions),
    tax: sum(rows, (r) => r.tax) + sum(rows, (r) => r.pension),
    paid: sum(
      rows.filter((r) => r.status === 'paid'),
      (r) => r.net,
    ),
    pending: sum(
      rows.filter((r) => r.status === 'pending' || r.status === 'processing'),
      (r) => r.net,
    ),
    hold: sum(
      rows.filter((r) => r.status === 'hold'),
      (r) => r.net,
    ),
    paidCount: rows.filter((r) => r.status === 'paid').length,
    pendingCount: rows.filter((r) => r.status === 'pending' || r.status === 'processing').length,
    holdCount: rows.filter((r) => r.status === 'hold').length,
    employees: rows.length,
    avgSalary: rows.length ? Math.round(total / rows.length) : 0,
    changePercent: prevTotal ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(1)) : 0,
    byDepartment: Object.entries(
      rows.reduce((acc, r) => {
        acc[r.department] = (acc[r.department] ?? 0) + r.net
        return acc
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    trend: months.map((m) => ({
      month: m,
      value: sum(
        all.filter((p) => p.month === m),
        (r) => r.net,
      ),
      paid: sum(
        all.filter((p) => p.month === m && p.status === 'paid'),
        (r) => r.net,
      ),
    })),
  }
}

export const getPayrollFacets = async () => {
  await latency(0.25)
  const rows = db.get('payroll')
  return {
    departments: facet(rows, 'department'),
    branches: facet(rows, 'branch'),
    methods: facet(rows, 'method'),
    months: unique(rows.map((r) => r.month)).sort((a, b) => b.localeCompare(a)),
  }
}

export const setPayrollStatus = async (id, status) => {
  await latency(0.5)
  const updated = db.update('payroll', id, {
    status,
    paidAt: status === 'paid' ? new Date().toISOString() : null,
  })
  invalidate([QK.payroll, ...AGGREGATE_KEYS])
  return updated
}

export const payAll = async (month = monthKey()) => {
  await latency(1.2)
  const touched = db.updateWhere(
    'payroll',
    (r) => r.month === month && (r.status === 'pending' || r.status === 'processing'),
    { status: 'paid', paidAt: new Date().toISOString() },
  )
  invalidate([QK.payroll, ...AGGREGATE_KEYS])
  return touched.length
}

export const updatePayroll = async (id, patch) => {
  await latency(0.5)
  const updated = db.update('payroll', id, (row) => {
    const next = { ...row, ...patch }
    const gross = Number(next.baseSalary) + Number(next.bonus) + Number(next.coinsBonus) + Number(next.overtime)
    const tax = Math.round((gross * 0.12) / 1000) * 1000
    const pension = Math.round(gross * 0.001)
    return {
      ...patch,
      gross,
      tax,
      pension,
      net: gross - Number(next.deductions) - tax - pension,
    }
  })
  invalidate([QK.payroll, ...AGGREGATE_KEYS])
  return updated
}

/** Called when a new employee starts — makes them visible in Payroll at once. */
export const ensurePayrollForEmployee = async (employee, month = monthKey()) => {
  const exists = db.get('payroll').some((p) => p.employeeId === employee.id && p.month === month)
  if (exists) return null
  const baseSalary = employee.salary
  const gross = baseSalary
  const tax = Math.round((gross * 0.12) / 1000) * 1000
  const pension = Math.round(gross * 0.001)
  const record = {
    id: `pay-${month}-${employee.id}`,
    month,
    employeeId: employee.id,
    employeeCode: employee.code,
    fullName: employee.fullName,
    avatarTone: employee.avatarTone,
    position: employee.position,
    department: employee.department,
    branch: employee.branch,
    baseSalary,
    bonus: 0,
    coinsBonus: 0,
    overtime: 0,
    lateDeduction: 0,
    absenceDeduction: 0,
    deductions: 0,
    tax,
    pension,
    gross,
    net: gross - tax - pension,
    status: 'pending',
    paidAt: null,
    method: 'Plastik karta',
    workedDays: 0,
    note: 'Yangi xodim — birinchi oy',
    index: db.get('payroll').length,
  }
  db.insert('payroll', record)
  invalidate([QK.payroll, ...AGGREGATE_KEYS])
  return record
}
