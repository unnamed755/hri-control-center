import { db } from './db'
import { latency } from './tableUtils'
import { avg, countBy, sum, unique } from '@/lib/utils'
import { monthKey } from '@/lib/format'
import { ACTIVE_CANDIDATE_STATUSES, ONBOARDING_STAGES, RECRUITMENT_PIPELINE } from '@/config/dictionaries'
import { KPI_BANDS } from '@/data/mock/kpi'
import { departmentColor } from '@/data/mock/constants'

const MS_DAY = 86400000

const monthBounds = (offset) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59)
  return { start, end, key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}` }
}

const headcountAt = (employees, date) =>
  employees.filter(
    (e) => new Date(e.hiredAt) <= date && (!e.terminatedAt || new Date(e.terminatedAt) > date),
  ).length

/** Monthly headcount, hires and leavers for the last `months` months. */
const employeeGrowth = (employees, months = 12) =>
  Array.from({ length: months }, (_, i) => months - 1 - i).map((offset) => {
    const { start, end, key } = monthBounds(offset)
    return {
      month: key,
      total: headcountAt(employees, end),
      hired: employees.filter((e) => new Date(e.hiredAt) >= start && new Date(e.hiredAt) <= end).length,
      left: employees.filter((e) => e.terminatedAt && new Date(e.terminatedAt) >= start && new Date(e.terminatedAt) <= end)
        .length,
    }
  })

const payrollTrend = (payroll) => {
  const months = unique(payroll.map((p) => p.month)).sort()
  return months.map((month) => {
    const rows = payroll.filter((p) => p.month === month)
    return {
      month,
      total: sum(rows, (r) => r.net),
      base: sum(rows, (r) => r.baseSalary),
      bonus: sum(rows, (r) => r.bonus) + sum(rows, (r) => r.coinsBonus),
      paid: sum(
        rows.filter((r) => r.status === 'paid'),
        (r) => r.net,
      ),
      employees: rows.length,
    }
  })
}

const attendanceSplit = (attendance, days = 7) => {
  const dates = unique(attendance.map((a) => a.date)).sort().slice(-days)
  const scoped = attendance.filter((a) => dates.includes(a.date))
  const counts = countBy(scoped, (a) => a.status)
  const total = scoped.length || 1
  return {
    days,
    total: scoped.length,
    present: counts.present ?? 0,
    late: counts.late ?? 0,
    absent: counts.absent ?? 0,
    remote: counts.remote ?? 0,
    leave: counts.leave ?? 0,
    rate: Math.round((((counts.present ?? 0) + (counts.late ?? 0) + (counts.remote ?? 0)) / total) * 100),
    daily: dates.map((date) => {
      const day = attendance.filter((a) => a.date === date)
      const c = countBy(day, (a) => a.status)
      return {
        date,
        present: c.present ?? 0,
        late: c.late ?? 0,
        absent: c.absent ?? 0,
        remote: c.remote ?? 0,
        leave: c.leave ?? 0,
      }
    }),
  }
}

const delta = (current, previous) => {
  if (!previous) return 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

/**
 * One call feeds the whole Control Center — exactly what a `/dashboard`
 * endpoint would return. Every number is derived from the same collections the
 * module pages read, so the dashboard can never disagree with a page.
 */
export const getDashboard = async () => {
  await latency(0.8)
  const employees = db.get('employees')
  const candidates = db.get('candidates')
  const vacancies = db.get('vacancies')
  const onboarding = db.get('onboarding')
  const payroll = db.get('payroll')
  const attendance = db.get('attendance')
  const tasks = db.get('tasks')
  const kpi = db.get('kpi')
  const interviews = db.get('interviews')

  const active = employees.filter((e) => e.status !== 'terminated')
  const now = Date.now()
  const growth = employeeGrowth(employees, 12)
  const prevMonthTotal = growth.at(-2)?.total ?? active.length

  const newEmployees = active.filter((e) => now - new Date(e.hiredAt).getTime() <= 30 * MS_DAY)
  const prevNewEmployees = active.filter((e) => {
    const age = now - new Date(e.hiredAt).getTime()
    return age > 30 * MS_DAY && age <= 60 * MS_DAY
  })

  const weekAgo = now - 7 * MS_DAY

  const activeCandidates = candidates.filter((c) => ACTIVE_CANDIDATE_STATUSES.includes(c.status))
  const candidatesLast30 = candidates.filter((c) => now - new Date(c.createdAt).getTime() <= 30 * MS_DAY)
  /** a candidate was "active" a week ago if it existed and had no terminal event yet */
  const terminalAt = (c) =>
    [...(c.timeline ?? [])].reverse().find((t) => t.stage === 'hired' || t.stage === 'rejected')?.at
  const activeCandidatesWeekAgo = candidates.filter((c) => {
    if (new Date(c.createdAt).getTime() > weekAgo) return false
    const end = terminalAt(c)
    return !end || new Date(end).getTime() > weekAgo
  }).length

  const openVacancies = vacancies.filter((v) => v.status === 'active')
  const openVacanciesMonthAgo = vacancies.filter((v) => {
    if (new Date(v.createdAt).getTime() > now - 30 * MS_DAY) return false
    if (v.status === 'active') return true
    return v.closedAt ? new Date(v.closedAt).getTime() > now - 30 * MS_DAY : false
  }).length

  const onboardingActive = onboarding.filter((o) => o.stage !== 'started')
  const onboardingActiveWeekAgo = onboarding.filter((o) => {
    if (new Date(o.createdAt).getTime() > weekAgo) return false
    return !o.completedAt || new Date(o.completedAt).getTime() > weekAgo
  }).length

  const currentMonth = monthKey()
  const payrollCurrent = payroll.filter((p) => p.month === currentMonth)
  const trend = payrollTrend(payroll)
  const payrollPrev = trend.at(-2)?.total ?? 0

  const kpiCurrent = kpi.filter((k) => k.month === currentMonth && active.some((e) => e.id === k.employeeId))
  const kpiPrev = kpi.filter((k) => k.month === trend.at(-2)?.month)
  const avgKpi = Math.round(avg(kpiCurrent, (k) => k.kpi))
  const avgKpiPrev = Math.round(avg(kpiPrev, (k) => k.kpi))

  const openTasks = tasks.filter((t) => t.status !== 'completed')
  const overdueTasks = openTasks.filter((t) => new Date(t.dueDate).getTime() < now)
  const openTasksWeekAgo = tasks.filter((t) => {
    if (new Date(t.createdAt).getTime() > weekAgo) return false
    return !t.completedAt || new Date(t.completedAt).getTime() > weekAgo
  }).length

  const attendance7 = attendanceSplit(attendance, 7)

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalEmployees: {
        value: active.length,
        change: delta(active.length, prevMonthTotal),
        hint: `${employees.length - active.length} nafar bo‘shagan`,
      },
      newEmployees: {
        value: newEmployees.length,
        change: delta(newEmployees.length, prevNewEmployees.length),
        hint: 'Oxirgi 30 kun',
      },
      activeCandidates: {
        value: activeCandidates.length,
        change: delta(activeCandidates.length, activeCandidatesWeekAgo),
        hint: `${candidatesLast30.length} ta yangi ariza (30 kun)`,
      },
      openVacancies: {
        value: openVacancies.length,
        change: delta(openVacancies.length, openVacanciesMonthAgo),
        hint: `${openVacancies.reduce((a, v) => a + v.openings, 0)} ta bo‘sh o‘rin`,
      },
      onboarding: {
        value: onboardingActive.length,
        change: delta(onboardingActive.length, onboardingActiveWeekAgo),
        hint: `${onboardingActive.filter((o) => o.stage === 'ready').length} ta START kutmoqda`,
      },
      payrollTotal: {
        value: sum(payrollCurrent, (p) => p.net),
        change: delta(sum(payrollCurrent, (p) => p.net), payrollPrev),
        hint: `${payrollCurrent.filter((p) => p.status !== 'paid').length} ta to‘lov kutilmoqda`,
      },
      avgKpi: {
        value: avgKpi,
        change: delta(avgKpi, avgKpiPrev),
        hint: `${kpiCurrent.filter((k) => k.kpi >= 90).length} nafar 90%+`,
      },
      pendingTasks: {
        value: openTasks.length,
        change: delta(openTasks.length, openTasksWeekAgo),
        hint: `${overdueTasks.length} ta muddati o‘tgan`,
      },
    },
    pipeline: RECRUITMENT_PIPELINE.map((stage) => ({
      ...stage,
      value: candidates.filter((c) => c.status === stage.key).length,
    })),
    employeeGrowth: growth,
    attendance: attendance7,
    payrollTrend: trend,
    kpiDistribution: KPI_BANDS.map((band) => ({
      ...band,
      value: kpiCurrent.filter((k) => k.kpi >= band.min && k.kpi <= band.max).length,
    })),
    onboardingProgress: ONBOARDING_STAGES.map((stage) => ({
      stage,
      value: onboarding.filter((o) => o.stage === stage).length,
    })),
    departmentComparison: unique(active.map((e) => e.department))
      .map((department) => {
        const list = active.filter((e) => e.department === department)
        const depKpi = kpiCurrent.filter((k) => k.department === department)
        return {
          department,
          headcount: list.length,
          kpi: Math.round(avg(depKpi, (k) => k.kpi)) || Math.round(avg(list, (e) => e.kpi)),
          payroll: sum(
            payrollCurrent.filter((p) => p.department === department),
            (p) => p.net,
          ),
          attendance: Math.round(avg(list, (e) => e.attendanceRate)),
          color: departmentColor(department),
        }
      })
      .sort((a, b) => b.headcount - a.headcount),
    upcomingInterviews: interviews
      .filter((i) => i.status === 'scheduled' && new Date(i.scheduledAt).getTime() >= now - MS_DAY)
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 5),
    recentHires: active
      .slice()
      .sort((a, b) => new Date(b.hiredAt) - new Date(a.hiredAt))
      .slice(0, 5),
    urgentTasks: openTasks
      .slice()
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((t) => ({ ...t, overdue: new Date(t.dueDate).getTime() < now })),
    readyToStart: onboardingActive.filter((o) => o.stage === 'ready').slice(0, 5),
  }
}

/** Deeper aggregation for the dedicated HR Analytics page. */
export const getAnalytics = async ({ months = 12 } = {}) => {
  await latency(0.9)
  const employees = db.get('employees')
  const candidates = db.get('candidates')
  const onboarding = db.get('onboarding')
  const payroll = db.get('payroll')
  const attendance = db.get('attendance')
  const kpi = db.get('kpi')
  const vacancies = db.get('vacancies')
  const active = employees.filter((e) => e.status !== 'terminated')
  const currentMonth = monthKey()
  const growth = employeeGrowth(employees, months)

  const hiredCount = candidates.filter((c) => c.status === 'hired').length
  const funnel = [
    { key: 'applied', label: 'Arizalar', value: candidates.length },
    { key: 'screening', label: 'Saralash', value: candidates.filter((c) => c.status !== 'new').length },
    {
      key: 'interview',
      label: 'Suhbat',
      value: candidates.filter((c) => ['interview', 'accepted', 'onboarding', 'hired'].includes(c.status)).length,
    },
    {
      key: 'accepted',
      label: 'Qabul',
      value: candidates.filter((c) => ['accepted', 'onboarding', 'hired'].includes(c.status)).length,
    },
    { key: 'onboarding', label: 'Onboarding', value: candidates.filter((c) => ['onboarding', 'hired'].includes(c.status)).length },
    { key: 'hired', label: 'Ishga olindi', value: hiredCount },
  ]

  const turnover = growth.map((row) => ({
    month: row.month,
    hired: row.hired,
    left: row.left,
    rate: row.total ? Number(((row.left / row.total) * 100).toFixed(1)) : 0,
    net: row.hired - row.left,
  }))

  const sourceEffectiveness = Object.entries(countBy(candidates, (c) => c.source))
    .map(([source, total]) => {
      const list = candidates.filter((c) => c.source === source)
      const hired = list.filter((c) => c.status === 'hired').length
      return {
        source,
        total,
        hired,
        rejected: list.filter((c) => c.status === 'rejected').length,
        conversion: total ? Math.round((hired / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  const kpiCurrent = kpi.filter((k) => k.month === currentMonth && active.some((e) => e.id === k.employeeId))

  return {
    generatedAt: new Date().toISOString(),
    headline: {
      headcount: active.length,
      hiredThisYear: growth.reduce((a, b) => a + b.hired, 0),
      leftThisYear: growth.reduce((a, b) => a + b.left, 0),
      turnoverRate: active.length
        ? Number(((growth.reduce((a, b) => a + b.left, 0) / active.length) * 100).toFixed(1))
        : 0,
      avgTenureMonths: Math.round(avg(active, (e) => e.tenureDays) / 30),
      onboardingCompletion: onboarding.length
        ? Math.round((onboarding.filter((o) => o.stage === 'started').length / onboarding.length) * 100)
        : 0,
      hiringConversion: candidates.length ? Math.round((hiredCount / candidates.length) * 100) : 0,
      avgKpi: Math.round(avg(kpiCurrent, (k) => k.kpi)),
      payrollMonthly: sum(
        payroll.filter((p) => p.month === currentMonth),
        (p) => p.net,
      ),
      openVacancies: vacancies.filter((v) => v.status === 'active').length,
      attendanceRate: attendanceSplit(attendance, 30).rate,
      costPerHire: hiredCount
        ? Math.round(sum(payroll.filter((p) => p.department === 'HR' && p.month === currentMonth), (p) => p.net) / hiredCount)
        : 0,
    },
    employeeGrowth: growth,
    turnover,
    hiringFunnel: funnel,
    sourceEffectiveness,
    onboardingProgress: ONBOARDING_STAGES.map((stage) => ({
      stage,
      value: onboarding.filter((o) => o.stage === stage).length,
    })),
    attendance: attendanceSplit(attendance, 30),
    payrollTrend: payrollTrend(payroll),
    kpiDistribution: KPI_BANDS.map((band) => ({
      ...band,
      value: kpiCurrent.filter((k) => k.kpi >= band.min && k.kpi <= band.max).length,
    })),
    departmentComparison: unique(active.map((e) => e.department))
      .map((department) => {
        const list = active.filter((e) => e.department === department)
        const depKpi = kpiCurrent.filter((k) => k.department === department)
        const depAttendance = attendance.filter((a) => a.department === department)
        const counts = countBy(depAttendance, (a) => a.status)
        const total = depAttendance.length || 1
        return {
          department,
          headcount: list.length,
          kpi: Math.round(avg(depKpi, (k) => k.kpi)) || Math.round(avg(list, (e) => e.kpi)),
          payroll: sum(
            payroll.filter((p) => p.department === department && p.month === currentMonth),
            (p) => p.net,
          ),
          avgSalary: Math.round(avg(list, (e) => e.salary)),
          attendance: Math.round((((counts.present ?? 0) + (counts.late ?? 0) + (counts.remote ?? 0)) / total) * 100),
          candidates: candidates.filter((c) => c.department === department).length,
          color: departmentColor(department),
        }
      })
      .sort((a, b) => b.headcount - a.headcount),
    branchComparison: unique(active.map((e) => e.branch)).map((branch) => {
      const list = active.filter((e) => e.branch === branch)
      return {
        branch,
        headcount: list.length,
        kpi: Math.round(avg(list, (e) => e.kpi)),
        attendance: Math.round(avg(list, (e) => e.attendanceRate)),
        payroll: sum(
          payroll.filter((p) => p.branch === branch && p.month === currentMonth),
          (p) => p.net,
        ),
      }
    }),
  }
}
