import { daysAgo, daysAhead } from './seedRandom'
import { makePerson, makePhone } from './factory'
import { EDUCATION, PROFESSIONS, SOURCE_NAMES } from './constants'
import { groupBy } from '@/lib/utils'

const CITIES = ['Toshkent', 'Toshkent viloyati', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg‘ona', 'Jizzax']

const REJECT_REASONS = [
  'Tajriba talabga mos emas',
  'Kutilgan oylik byudjetdan yuqori',
  'Suhbatga kelmadi',
  'Boshqa kompaniyani tanladi',
  'Hujjatlari to‘liq emas',
  'Ish grafigi mos kelmadi',
]

const STAGE_ORDER = ['new', 'screening', 'interview', 'accepted', 'onboarding', 'hired']

const STAGE_NOTE = {
  new: 'Ariza qabul qilindi',
  screening: 'Telefon orqali saralash o‘tkazildi',
  interview: 'Suhbat belgilandi',
  accepted: 'Nomzod tasdiqlandi — taklif yuborildi',
  onboarding: 'Onboarding jarayoni boshlandi',
  hired: 'Xodim sifatida ishga qabul qilindi',
}

const buildTimeline = (rng, status, createdAt, recruiterName) => {
  const timeline = []
  const targetIndex = status === 'rejected' ? rng.int(0, 2) : STAGE_ORDER.indexOf(status)
  let cursor = new Date(createdAt).getTime()
  for (let i = 0; i <= targetIndex; i++) {
    timeline.push({
      stage: STAGE_ORDER[i],
      at: new Date(cursor).toISOString(),
      by: i === 0 ? 'Recruiter Web' : recruiterName,
      note: STAGE_NOTE[STAGE_ORDER[i]],
    })
    cursor += rng.int(1, 4) * 86400000
  }
  if (status === 'rejected') {
    timeline.push({
      stage: 'rejected',
      at: new Date(cursor).toISOString(),
      by: recruiterName,
      note: rng.pick(REJECT_REASONS),
    })
  }
  return timeline
}

/** Distribution keeps the funnel realistic and the dashboard numbers stable. */
const DISTRIBUTION = [
  ['new', 17],
  ['screening', 12],
  ['interview', 9],
  ['accepted', 5],
  ['onboarding', 6],
  ['hired', 8],
  ['rejected', 15],
]

export const generateCandidates = (rng, { vacancies, recruiters }) => {
  const candidates = []
  const active = vacancies.filter((v) => v.status === 'active')
  /** vacancies with more openings attract proportionally more applicants */
  const openVacancies = active.flatMap((v) => Array.from({ length: Math.max(1, v.openings) }, () => v))
  const closedVacancies = vacancies.filter((v) => v.status !== 'active')
  let index = 0

  DISTRIBUTION.forEach(([status, count]) => {
    for (let i = 0; i < count; i++) {
      const vacancy =
        status === 'hired' && closedVacancies.length && rng.bool(0.4)
          ? rng.pick(closedVacancies)
          : rng.pick(openVacancies)
      const profession = PROFESSIONS.find((p) => p.title === vacancy.title) ?? PROFESSIONS[0]
      const person = makePerson(rng)
      const recruiter = recruiters.find((r) => r.id === vacancy.recruiterId) ?? recruiters[0]
      const ageDays =
        status === 'new'
          ? rng.int(0, 6)
          : status === 'screening'
            ? rng.int(3, 14)
            : status === 'interview'
              ? rng.int(6, 22)
              : status === 'rejected'
                ? rng.int(4, 60)
                : rng.int(14, 75)
      const createdAt = daysAgo(ageDays)
      const level = rng.weighted({ intern: 1, junior: 5, middle: 5, senior: 2 })
      const experienceYears =
        level === 'intern' ? 0 : level === 'junior' ? rng.int(1, 2) : level === 'middle' ? rng.int(3, 5) : rng.int(6, 11)

      const hasInterview = ['interview', 'accepted', 'onboarding', 'hired'].includes(status)
      index += 1

      candidates.push({
        id: `cnd-${String(index).padStart(3, '0')}`,
        fullName: person.fullName,
        firstName: person.firstName,
        lastName: person.lastName,
        gender: person.gender,
        avatarTone: person.avatarTone,
        phone: makePhone(rng),
        email: `${person.firstName.toLowerCase().replace(/[‘’']/g, '')}${rng.int(10, 99)}@mail.uz`,
        profession: vacancy.title,
        department: profession.department,
        experienceYears,
        level,
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        branch: vacancy.branch,
        recruiterId: recruiter.id,
        recruiterName: recruiter.fullName,
        status,
        source: rng.pick(SOURCE_NAMES),
        city: rng.pick(CITIES),
        education: rng.pick(EDUCATION),
        expectedSalary: rng.step(profession.band[0], profession.band[1] + 500000, 100000),
        rating: Number(rng.float(2.8, 5).toFixed(1)),
        createdAt,
        updatedAt: daysAgo(Math.max(0, ageDays - rng.int(0, 3))),
        interviewAt: hasInterview
          ? status === 'interview'
            ? daysAhead(rng.int(-3, 6))
            : daysAgo(rng.int(5, 30))
          : null,
        interviewResult: hasInterview ? (status === 'interview' ? 'pending' : 'passed') : null,
        rejectReason: status === 'rejected' ? rng.pick(REJECT_REASONS) : null,
        onboardingId: null,
        employeeId: null,
        cv: {
          fileName: `${person.lastName}_${person.firstName}_CV.pdf`,
          sizeKb: rng.int(120, 780),
          uploadedAt: createdAt,
        },
        languages: rng.sample(['O‘zbek', 'Rus', 'Ingliz', 'Qozoq'], rng.int(1, 3)),
        notes:
          rng.bool(0.5)
            ? [
                {
                  id: 'note-1',
                  author: recruiter.fullName,
                  text: rng.pick([
                    'Muloqoti yaxshi, mijozlar bilan ishlashga tayyor.',
                    'Smenali grafikka roziligini bildirdi.',
                    'Oylik bo‘yicha muzokara talab qiladi.',
                    'Tajribasi mos, hujjatlari tayyor.',
                  ]),
                  createdAt: daysAgo(Math.max(0, ageDays - 1)),
                },
              ]
            : [],
        timeline: buildTimeline(rng, status, createdAt, recruiter.fullName),
        externalId: null,
      })
    }
  })

  spreadExperience(candidates)
  return candidates
}

/**
 * Guarantees a full 1–5 year spread for every profession that has enough
 * applicants, so a combined search such as "haydovchi 3" always finds a real
 * record instead of an empty table.
 */
const spreadExperience = (candidates) => {
  const byProfession = groupBy(candidates, (c) => c.profession)
  Object.values(byProfession).forEach((list) => {
    if (list.length < 4) return
    list.slice(0, 5).forEach((candidate, index) => {
      const years = index + 1
      candidate.experienceYears = years
      candidate.level = years <= 2 ? 'junior' : 'middle'
    })
  })
}
