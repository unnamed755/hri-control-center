import { atTime } from './seedRandom'

const SHIFTS = ['08:00 – 17:00', '09:00 – 18:00', '12:00 – 21:00', '2/2 smena']

/**
 * A cashier is an employee (position "Kassir") plus a till scorecard.
 * The Kassirlar page groups these rows by branch, exactly like the reference.
 */
export const generateCashiers = (rng, { employees }) =>
  employees
    .filter((e) => e.isCashier && e.status !== 'terminated')
    .map((emp, i) => {
      const transactions = rng.int(420, 1850)
      const avgTicket = rng.step(48000, 210000, 1000)
      return {
        id: `csh-${String(i + 1).padStart(3, '0')}`,
        employeeId: emp.id,
        employeeCode: emp.code,
        fullName: emp.fullName,
        avatarTone: emp.avatarTone,
        phone: emp.phone,
        branch: emp.branch,
        department: emp.department,
        position: emp.position,
        level: emp.level,
        status: emp.status,
        terminalId: `POS-${emp.branch.slice(0, 3).toUpperCase()}-${rng.int(10, 99)}`,
        shift: rng.pick(SHIFTS),
        sales: transactions * avgTicket,
        transactions,
        avgTicket,
        refunds: rng.int(0, 24),
        cashDiscrepancy: rng.bool(0.2) ? rng.step(-180000, 120000, 5000) : 0,
        kpi: emp.kpi,
        coins: emp.coins,
        attendanceRate: emp.attendanceRate,
        lastShiftAt: atTime(rng.int(0, 2), rng.int(17, 21), rng.pick([0, 15, 30])),
        hiredAt: emp.hiredAt,
        salary: emp.salary,
      }
    })
