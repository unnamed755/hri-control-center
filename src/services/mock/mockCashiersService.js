import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { avg, groupBy, sum, unique } from '@/lib/utils'

const queryConfig = {
  search: (c) => [c.fullName, c.employeeCode, c.phone, c.branch, c.terminalId, c.shift, c.level],
  dateField: 'lastShiftAt',
  defaultSort: 'sales',
  defaultSortDir: 'desc',
  filters: {
    branch: (row, value) => row.branch === value,
    status: (row, value) => row.status === value,
    level: (row, value) => row.level === value,
    shift: (row, value) => row.shift === value,
    kpiBand: (row, value) => {
      if (value === 'high') return row.kpi >= 85
      if (value === 'mid') return row.kpi >= 70 && row.kpi < 85
      return row.kpi < 70
    },
  },
}

export const getCashiers = async (params = {}) => {
  await latency()
  return applyQuery(db.get('cashiers'), params, queryConfig)
}

/** The reference page groups cashiers under their branch card. */
export const getCashiersByBranch = async (params = {}) => {
  await latency()
  const { rows } = applyQuery(db.get('cashiers'), { ...params, perPage: undefined }, queryConfig)
  const grouped = groupBy(rows, (c) => c.branch)
  return Object.entries(grouped)
    .map(([branch, list]) => ({
      branch,
      cashiers: list.sort((a, b) => b.sales - a.sales),
      count: list.length,
      sales: sum(list, (c) => c.sales),
      transactions: sum(list, (c) => c.transactions),
      avgKpi: Math.round(avg(list, (c) => c.kpi)),
      coins: sum(list, (c) => c.coins),
      discrepancy: sum(list, (c) => c.cashDiscrepancy),
    }))
    .sort((a, b) => b.sales - a.sales)
}

export const getCashierById = async (id) => {
  await latency(0.4)
  const cashier = db.find('cashiers', id)
  if (!cashier) throw new Error('Kassir topilmadi')
  const employee = db.find('employees', cashier.employeeId)
  const attendance = db
    .get('attendance')
    .filter((a) => a.employeeId === cashier.employeeId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)
  const kpiHistory = db
    .get('kpi')
    .filter((k) => k.employeeId === cashier.employeeId)
    .sort((a, b) => a.month.localeCompare(b.month))
  return { ...cashier, employee, attendance, kpiHistory }
}

export const getCashierStats = async () => {
  await latency(0.3)
  const rows = db.get('cashiers')
  return {
    total: rows.length,
    branches: unique(rows.map((r) => r.branch)).length,
    sales: sum(rows, (r) => r.sales),
    transactions: sum(rows, (r) => r.transactions),
    avgTicket: rows.length ? Math.round(sum(rows, (r) => r.sales) / Math.max(1, sum(rows, (r) => r.transactions))) : 0,
    avgKpi: Math.round(avg(rows, (r) => r.kpi)),
    coins: sum(rows, (r) => r.coins),
    discrepancy: sum(rows, (r) => r.cashDiscrepancy),
    withDiscrepancy: rows.filter((r) => r.cashDiscrepancy !== 0).length,
    topBranch:
      Object.entries(
        rows.reduce((acc, r) => {
          acc[r.branch] = (acc[r.branch] ?? 0) + r.sales
          return acc
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
  }
}

export const getCashierFacets = async () => {
  await latency(0.2)
  const rows = db.get('cashiers')
  return {
    branches: facet(rows, 'branch'),
    shifts: facet(rows, 'shift'),
    levels: facet(rows, 'level'),
    statuses: facet(rows, 'status'),
  }
}

export const updateCashier = async (id, patch) => {
  await latency(0.4)
  const updated = db.update('cashiers', id, patch)
  invalidate([QK.cashiers, QK.employees, ...AGGREGATE_KEYS])
  return updated
}
