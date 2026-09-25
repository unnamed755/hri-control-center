import { monthsAgoKey } from './seedRandom'

export const PAYROLL_MONTHS = 6

const TAX_RATE = 0.12 // NDFL
const PENSION_RATE = 0.001 // INPS

/**
 * Payroll is generated per employee per month for the last 6 months.
 * The current month is still being processed, earlier months are paid —
 * which is what the Payroll KPI cards and the analytics trend rely on.
 */
export const generatePayroll = (rng, { employees }) => {
  const records = []
  const months = Array.from({ length: PAYROLL_MONTHS }, (_, i) => monthsAgoKey(i))

  months.forEach((month, monthOffset) => {
    const monthStart = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)

    employees.forEach((emp, i) => {
      const hiredAt = new Date(emp.hiredAt)
      if (hiredAt > new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)) return
      if (emp.terminatedAt && new Date(emp.terminatedAt) < monthStart) return

      // salary grows slowly backwards in time (older months = slightly lower)
      const baseSalary = Math.round((emp.salary * (1 - monthOffset * 0.012)) / 1000) * 1000
      const kpiFactor = Math.max(0, (emp.kpi - 70) / 30)
      const bonus = Math.round((baseSalary * 0.18 * kpiFactor * rng.float(0.6, 1.2)) / 1000) * 1000
      const coinsBonus = Math.round((emp.coins * rng.float(80, 140)) / 1000) * 1000
      const overtime = rng.bool(0.25) ? Math.round((baseSalary * rng.float(0.02, 0.09)) / 1000) * 1000 : 0
      const lateDeduction = Math.round((baseSalary * 0.004 * emp.lateCount * rng.float(0.5, 1.4)) / 1000) * 1000
      const absenceDeduction = Math.round((baseSalary * 0.045 * emp.absentCount * rng.float(0.4, 1.1)) / 1000) * 1000
      const deductions = lateDeduction + absenceDeduction
      const gross = baseSalary + bonus + coinsBonus + overtime
      const tax = Math.round((gross * TAX_RATE) / 1000) * 1000
      const pension = Math.round((gross * PENSION_RATE) / 100) * 100
      const net = gross - deductions - tax - pension

      const status =
        monthOffset === 0
          ? rng.weighted({ pending: 5, processing: 3, paid: 6, hold: 1 })
          : monthOffset === 1
            ? rng.weighted({ paid: 22, hold: 1 })
            : 'paid'

      records.push({
        id: `pay-${month}-${emp.id}`,
        month,
        employeeId: emp.id,
        employeeCode: emp.code,
        fullName: emp.fullName,
        avatarTone: emp.avatarTone,
        position: emp.position,
        department: emp.department,
        branch: emp.branch,
        baseSalary,
        bonus,
        coinsBonus,
        overtime,
        lateDeduction,
        absenceDeduction,
        deductions,
        tax,
        pension,
        gross,
        net,
        status,
        paidAt:
          status === 'paid'
            ? new Date(monthStart.getFullYear(), monthStart.getMonth(), rng.int(5, 10), 12).toISOString()
            : null,
        method: emp.branch === 'Bosh ofis' ? 'Plastik karta' : rng.weighted({ 'Plastik karta': 8, Naqd: 2 }),
        workedDays: rng.int(20, 26),
        note: status === 'hold' ? 'Hujjatlar tekshirilmoqda' : null,
        index: i,
      })
    })
  })

  return records
}
