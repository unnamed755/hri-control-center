import { daysAgo, daysAhead } from './seedRandom'

export const CHECKLIST_TEMPLATE = [
  { id: 'doc-passport', label: 'Passport nusxasi qabul qilindi', stage: 'documents' },
  { id: 'doc-inps', label: 'INPS / STIR raqami olindi', stage: 'documents' },
  { id: 'doc-diploma', label: 'Diplom yoki sertifikat nusxasi', stage: 'documents' },
  { id: 'doc-medical', label: 'Tibbiy ma’lumotnoma', stage: 'documents' },
  { id: 'hr-check', label: 'Ma’lumotlar HR tomonidan tekshirildi', stage: 'hr_verification' },
  { id: 'hr-reference', label: 'Oldingi ish joyidan tavsiya olindi', stage: 'hr_verification' },
  { id: 'hr-contract', label: 'Mehnat shartnomasi tayyorlandi', stage: 'hr_verification' },
  { id: 'or-company', label: 'Kompaniya bilan tanishtiruv', stage: 'orientation' },
  { id: 'or-workplace', label: 'Ish joyi va jihozlar taqdim etildi', stage: 'orientation' },
  { id: 'or-rules', label: 'Ichki tartib qoidalari bilan tanishtirildi', stage: 'orientation' },
  { id: 'tr-product', label: 'Mahsulot/ xizmat treningi', stage: 'training' },
  { id: 'tr-system', label: 'Ichki tizim (1C / CRM) treningi', stage: 'training' },
  { id: 'tr-safety', label: 'Xavfsizlik va sanitariya treningi', stage: 'training' },
  { id: 'rd-mentor', label: 'Mentor tayinlandi', stage: 'ready' },
  { id: 'rd-plan', label: 'Birinchi hafta rejasi tasdiqlandi', stage: 'ready' },
  { id: 'rd-access', label: 'Turniket kartasi va kirish huquqi', stage: 'ready' },
]

export const STAGE_SEQUENCE = ['accepted', 'documents', 'hr_verification', 'orientation', 'training', 'ready', 'started']

export const buildChecklist = (stage, { rng, completedAt = null } = {}) => {
  const reachedIndex = STAGE_SEQUENCE.indexOf(stage)
  return CHECKLIST_TEMPLATE.map((item) => {
    const itemIndex = STAGE_SEQUENCE.indexOf(item.stage)
    const done = itemIndex < reachedIndex || (itemIndex === reachedIndex && (rng ? rng.bool(0.55) : false))
    return {
      ...item,
      done,
      doneAt: done ? (completedAt ?? daysAgo(rng ? rng.int(1, 18) : 3)) : null,
    }
  })
}

export const checklistProgress = (record) => {
  const total = record.checklist?.length || 1
  const done = record.checklist?.filter((c) => c.done).length ?? 0
  return Math.round((done / total) * 100)
}

const HR_TEAM = [
  { id: 'emp-005', name: 'Abdullayeva Madina' },
  { id: 'emp-006', name: 'Yusupova Kamola' },
  { id: 'emp-007', name: 'Ergashev Otabek' },
]

const NOTES = [
  'Hujjatlar to‘liq, faqat tibbiy ma’lumotnoma kutilmoqda.',
  'Orientatsiya kuni filial boshqaruvchisi bilan kelishildi.',
  'Mentor sifatida tajribali xodim tayinlandi.',
  'Trening natijasi yaxshi, testdan 88% oldi.',
  'Birinchi ish kuni dushanba kuni belgilandi.',
]

export const generateOnboarding = (rng, { candidates, employees }) => {
  const records = []
  let index = 0

  const active = candidates.filter((c) => c.status === 'onboarding')
  const done = candidates.filter((c) => c.status === 'hired')

  const push = (candidate, stage, { completed = false } = {}) => {
    index += 1
    const hr = rng.pick(HR_TEAM)
    const startedAt = daysAgo(completed ? rng.int(25, 70) : rng.int(3, 22))
    const completedAt = completed ? daysAgo(rng.int(1, 20)) : null
    const employee = completed ? employees.find((e) => e.candidateId === candidate.id) : null
    const mentorPool = employees.filter(
      (e) => e.department === candidate.department && e.level !== 'intern' && e.status !== 'terminated',
    )
    const mentor = mentorPool.length ? rng.pick(mentorPool) : employees[10]

    const record = {
      id: `onb-${String(index).padStart(3, '0')}`,
      candidateId: candidate.id,
      employeeId: employee?.id ?? null,
      fullName: candidate.fullName,
      avatarTone: candidate.avatarTone,
      phone: candidate.phone,
      position: candidate.profession,
      department: candidate.department,
      branch: candidate.branch,
      vacancyId: candidate.vacancyId,
      vacancyTitle: candidate.vacancyTitle,
      level: candidate.level,
      stage,
      hrResponsibleId: hr.id,
      hrResponsibleName: hr.name,
      mentorId: mentor?.id ?? null,
      mentorName: mentor?.fullName ?? '—',
      createdAt: startedAt,
      updatedAt: daysAgo(rng.int(0, 3)),
      targetStartDate: completed ? completedAt : daysAhead(rng.int(1, 14)),
      completedAt,
      salaryOffer: candidate.expectedSalary,
      checklist: buildChecklist(stage, { rng, completedAt: completed ? completedAt : null }),
      notes: rng.bool(0.7)
        ? [
            {
              id: 'onote-1',
              author: hr.name,
              text: rng.pick(NOTES),
              createdAt: daysAgo(rng.int(1, 8)),
            },
          ]
        : [],
      history: STAGE_SEQUENCE.slice(0, STAGE_SEQUENCE.indexOf(stage) + 1).map((s, i) => ({
        stage: s,
        at: daysAgo(Math.max(0, (completed ? 60 : 20) - i * 3)),
        by: hr.name,
      })),
    }
    records.push(record)
  }

  active.forEach((candidate) => {
    const stage = rng.pick(['documents', 'documents', 'hr_verification', 'orientation', 'training', 'ready'])
    push(candidate, stage)
  })

  done.forEach((candidate) => push(candidate, 'started', { completed: true }))

  return records
}
