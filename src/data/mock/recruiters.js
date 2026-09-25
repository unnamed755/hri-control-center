import { daysAgo } from './seedRandom'

/**
 * Recruiters are HR employees with a recruitment scorecard.
 * `emp-004` (Nazarov Rauf) is the lead recruiter shown in the sidebar.
 */
export const generateRecruiters = (rng, { employees }) => {
  const byId = (id) => employees.find((e) => e.id === id)

  const defs = [
    {
      id: 'rec-001',
      employeeId: 'emp-004',
      displayName: 'Rauf — Rekruter',
      role: 'Yetakchi rekruter',
      monthlyPlan: 14,
      specialisation: ['Savdo', 'Logistika', 'Xizmat ko‘rsatish'],
    },
    {
      id: 'rec-002',
      employeeId: 'emp-008',
      displayName: 'Sabina — Rekruter',
      role: 'Rekruter',
      monthlyPlan: 10,
      specialisation: ['IT', 'Marketing', 'Moliya'],
    },
    {
      id: 'rec-003',
      employeeId: 'emp-009',
      displayName: 'Bekzod — Rekruter',
      role: 'Junior rekruter',
      monthlyPlan: 8,
      specialisation: ['Savdo', 'Xavfsizlik'],
    },
  ]

  return defs.map((def) => {
    const emp = byId(def.employeeId) ?? {}
    return {
      ...def,
      fullName: emp.fullName ?? def.displayName,
      phone: emp.phone ?? '',
      email: emp.email ?? '',
      branch: emp.branch ?? 'Bosh ofis',
      avatarTone: emp.avatarTone ?? 'var(--color-brand)',
      kpi: emp.kpi ?? 80,
      joinedAt: emp.hiredAt ?? daysAgo(400),
      monthlyDone: rng.int(4, def.monthlyPlan),
      hiresTotal: rng.int(18, 64),
      avgTimeToHireDays: rng.int(8, 21),
      avgScreeningPerDay: rng.int(6, 18),
      rating: Number(rng.float(4.1, 4.9).toFixed(1)),
    }
  })
}
