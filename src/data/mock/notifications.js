import { daysAgo } from './seedRandom'

/**
 * Seeded activity feed. Demo actions (accept candidate, complete onboarding,
 * pay payroll, …) push new entries on top through `mockNotificationsService`.
 */
export const generateNotifications = (rng, { candidates, onboarding, tasks, vacancies }) => {
  const rows = []
  const push = (entry) => rows.push({ id: `ntf-${String(rows.length + 1).padStart(3, '0')}`, read: false, ...entry })

  const newest = [...candidates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
  newest.forEach((c) =>
    push({
      type: 'candidate',
      severity: 'info',
      title: 'Yangi nomzod qo‘shildi',
      message: `${c.fullName} — ${c.profession} (${c.source})`,
      module: 'recruitment',
      entityId: c.id,
      link: '/candidates',
      createdAt: c.createdAt,
      read: rng.bool(0.4),
    }),
  )

  const ready = onboarding.filter((o) => o.stage === 'ready')[0]
  if (ready) {
    push({
      type: 'onboarding',
      severity: 'success',
      title: 'Onboarding yakunlanishga tayyor',
      message: `${ready.fullName} — ${ready.position}. START bosilishi kutilmoqda.`,
      module: 'onboarding',
      entityId: ready.id,
      link: '/onboarding',
      createdAt: daysAgo(0),
    })
  }

  const overdue = tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < new Date()).slice(0, 2)
  overdue.forEach((t) =>
    push({
      type: 'task',
      severity: 'danger',
      title: 'HR vazifa muddati o‘tdi',
      message: `${t.title} — mas’ul: ${t.assigneeName}`,
      module: 'tasks',
      entityId: t.id,
      link: '/hr-tasks',
      createdAt: t.dueDate,
    }),
  )

  push({
    type: 'payroll',
    severity: 'warning',
    title: 'Payroll tasdiqlash kutilmoqda',
    message: 'Sentabr oyi bo‘yicha bir qancha to‘lov "Kutilmoqda" holatida.',
    module: 'payroll',
    entityId: null,
    link: '/payroll',
    createdAt: daysAgo(1),
  })

  const deadlineSoon = vacancies
    .filter((v) => v.status === 'active' && new Date(v.deadline) - Date.now() < 7 * 86400000)
    .slice(0, 2)
  deadlineSoon.forEach((v) =>
    push({
      type: 'vacancy',
      severity: 'warning',
      title: 'Vakansiya muddati yaqin',
      message: `${v.title} · ${v.branch} — ${v.openings} o‘rin ochiq`,
      module: 'recruitment',
      entityId: v.id,
      link: '/vacancies',
      createdAt: daysAgo(rng.int(0, 2)),
    }),
  )

  push({
    type: 'kpi',
    severity: 'info',
    title: 'KPI natijalari yangilandi',
    message: 'Sentabr oyi bo‘yicha barcha bo‘limlar KPI ko‘rsatkichi qayta hisoblandi.',
    module: 'kpi',
    entityId: null,
    link: '/kpi-coins',
    createdAt: daysAgo(2),
    read: true,
  })

  push({
    type: 'camera',
    severity: 'danger',
    title: 'Kamera oflayn',
    message: 'Ikki qurilma tarmoqdan uzilgan — texnik xizmat kerak.',
    module: 'employees',
    entityId: null,
    link: '/camera',
    createdAt: daysAgo(1),
  })

  push({
    type: 'interview',
    severity: 'info',
    title: 'Bugun uchun suhbatlar belgilandi',
    message: 'Rekruterlar jadvalida bugungi suhbatlar mavjud.',
    module: 'recruitment',
    entityId: null,
    link: '/interviews',
    createdAt: daysAgo(0),
  })

  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
