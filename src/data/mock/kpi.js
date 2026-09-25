import { monthsAgoKey } from './seedRandom'

export const KPI_MONTHS = 6

/**
 * Monthly KPI + coins per employee. The newest month equals the employee's
 * current `kpi` value so the employee card, the KPI page and the analytics
 * distribution can never disagree.
 */
export const generateKpi = (rng, { employees }) => {
  const records = []
  const months = Array.from({ length: KPI_MONTHS }, (_, i) => monthsAgoKey(i))

  employees.forEach((emp) => {
    let previous = null
    // walk from the oldest month to the newest so the trend is monotonic-ish
    for (let i = months.length - 1; i >= 0; i--) {
      const month = months[i]
      const drift = i === 0 ? 0 : rng.float(-7, 5)
      const value = i === 0 ? emp.kpi : Math.round(Math.min(99, Math.max(40, emp.kpi + drift)))
      const coins = Math.round((value * rng.float(8, 15)) / 5) * 5
      records.push({
        id: `kpi-${month}-${emp.id}`,
        month,
        employeeId: emp.id,
        employeeCode: emp.code,
        fullName: emp.fullName,
        avatarTone: emp.avatarTone,
        position: emp.position,
        department: emp.department,
        branch: emp.branch,
        kpi: value,
        coins,
        tasksPlanned: rng.int(12, 34),
        tasksCompleted: 0, // filled below
        qualityScore: Math.round(Math.min(100, Math.max(45, value + rng.float(-8, 8)))),
        attendanceScore: emp.attendanceRate,
        disciplineScore: Math.max(40, 100 - emp.lateCount * 4 - emp.absentCount * 9),
        trend: previous === null ? 0 : Number((value - previous).toFixed(1)),
        isCurrent: i === 0,
      })
      previous = value
    }
  })

  records.forEach((r) => {
    r.tasksCompleted = Math.min(r.tasksPlanned, Math.round(r.tasksPlanned * (r.kpi / 100)))
  })

  return records
}

export const KPI_BANDS = [
  { key: 'excellent', label: '90–100%', min: 90, max: 100, tone: 'success', color: 'var(--color-success)' },
  { key: 'good', label: '80–89%', min: 80, max: 89, tone: 'brand', color: 'var(--color-brand)' },
  { key: 'normal', label: '70–79%', min: 70, max: 79, tone: 'info', color: 'var(--color-info)' },
  { key: 'weak', label: '60–69%', min: 60, max: 69, tone: 'warning', color: 'var(--color-warning)' },
  { key: 'risk', label: '< 60%', min: 0, max: 59, tone: 'danger', color: 'var(--color-danger)' },
]

export const kpiBand = (value) => KPI_BANDS.find((b) => value >= b.min && value <= b.max) ?? KPI_BANDS[4]
