import { daysAgo } from './seedRandom'
import { makePerson, makePhone } from './factory'
import { PROFESSIONS, SOURCES } from './constants'

const CITIES = ['Toshkent', 'Toshkent viloyati', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Farg‘ona']

const NOTES = [
  'Telefon orqali bog‘lanishga tayyor.',
  'Rezyume to‘liq emas, tajriba aniqlanishi kerak.',
  'Smenali grafikda ishlashga rozi.',
  'Ilgari shu sohada ishlagan.',
  'Filialga yaqin joyda yashaydi.',
  'Faqat yarim stavka qidiryapti.',
]

/**
 * Recruiter Web feed: raw applications arriving from external sources.
 * Importing one creates a real candidate in the pool — the first link of the
 * business chain (External source → Recruiter Web → Recruiter → Candidate).
 */
export const generateExternalCandidates = (rng) => {
  const rows = []
  const statuses = [
    ['new', 11],
    ['reviewed', 6],
    ['imported', 5],
    ['rejected', 4],
  ]
  let index = 0

  statuses.forEach(([status, count]) => {
    for (let i = 0; i < count; i++) {
      index += 1
      const person = makePerson(rng)
      const profession = rng.pick(PROFESSIONS)
      const source = rng.pick(SOURCES)
      const level = rng.weighted({ intern: 1, junior: 6, middle: 4, senior: 1 })
      const experienceYears =
        level === 'intern' ? 0 : level === 'junior' ? rng.int(1, 2) : level === 'middle' ? rng.int(3, 5) : rng.int(6, 10)

      rows.push({
        id: `ext-${String(index).padStart(3, '0')}`,
        fullName: person.fullName,
        avatarTone: person.avatarTone,
        gender: person.gender,
        phone: makePhone(rng),
        profession: profession.title,
        department: profession.department,
        experienceYears,
        level,
        city: rng.pick(CITIES),
        source: source.name,
        sourceKind: source.kind,
        sourceRef: `${source.name.replace(/\W/g, '').toLowerCase()}-${rng.int(100000, 999999)}`,
        expectedSalary: rng.step(profession.band[0] - 200000, profession.band[1], 100000),
        importedAt: daysAgo(rng.int(0, 21)),
        status,
        matchScore: rng.int(42, 97),
        note: rng.pick(NOTES),
        candidateId: null,
        hasCv: rng.bool(0.62),
        duplicate: rng.bool(0.08),
      })
    }
  })

  return rows.sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt))
}
