import { daysAgo, dateOnly } from './seedRandom'
import { makeBirthDate, makeCode, makeEmail, makePerson, makePhone } from './factory'
import {
  AVATAR_TONES,
  BRANCHES,
  DEPARTMENTS,
  DOCUMENT_TYPES,
  EDUCATION,
  POSITIONS,
  STORE_BRANCHES,
} from './constants'

const LEVEL_MULTIPLIER = { intern: 0.72, junior: 0.88, middle: 1, senior: 1.22, lead: 1.5 }

/** Leadership + HR core: referenced by org structure, tasks and onboarding. */
const LEADERSHIP = [
  {
    id: 'emp-001',
    fullName: 'Sultonov Rustam',
    gender: 'male',
    position: 'Bosh direktor',
    department: 'Boshqaruv',
    branch: 'Bosh ofis',
    level: 'lead',
    salary: 46000000,
    kpi: 94,
    hiredDaysAgo: 2190,
    role: 'CEO',
    managerId: null,
  },
  {
    id: 'emp-002',
    fullName: 'Karimova Zilola',
    gender: 'female',
    position: 'HR Owner',
    department: 'Boshqaruv',
    branch: 'Bosh ofis',
    level: 'lead',
    salary: 28500000,
    kpi: 92,
    hiredDaysAgo: 1825,
    role: 'HR Owner',
    managerId: 'emp-001',
  },
  {
    id: 'emp-003',
    fullName: 'Nazarova Nilufar',
    gender: 'female',
    position: 'HR bo‘lim boshlig‘i',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'lead',
    salary: 18500000,
    kpi: 91,
    hiredDaysAgo: 1460,
    role: 'HR Department Head',
    managerId: 'emp-002',
  },
  {
    id: 'emp-004',
    fullName: 'Nazarov Rauf',
    gender: 'male',
    position: 'Rekruter',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'senior',
    salary: 7800000,
    kpi: 88,
    hiredDaysAgo: 760,
    role: 'Lead Recruiter',
    managerId: 'emp-003',
  },
  {
    id: 'emp-005',
    fullName: 'Abdullayeva Madina',
    gender: 'female',
    position: 'Onboarding mutaxassisi',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'middle',
    salary: 6900000,
    kpi: 87,
    hiredDaysAgo: 540,
    role: 'Onboarding',
    managerId: 'emp-003',
  },
  {
    id: 'emp-006',
    fullName: 'Yusupova Kamola',
    gender: 'female',
    position: 'HR mutaxassis',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'middle',
    salary: 7200000,
    kpi: 85,
    hiredDaysAgo: 610,
    role: 'HR Operations',
    managerId: 'emp-003',
  },
  {
    id: 'emp-007',
    fullName: 'Ergashev Otabek',
    gender: 'male',
    position: 'Ta’lim va rivojlanish mutaxassisi',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'middle',
    salary: 7500000,
    kpi: 84,
    hiredDaysAgo: 420,
    role: 'Training',
    managerId: 'emp-003',
  },
  {
    id: 'emp-008',
    fullName: 'Islomova Sabina',
    gender: 'female',
    position: 'Rekruter',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'middle',
    salary: 6400000,
    kpi: 82,
    hiredDaysAgo: 330,
    role: 'Recruiter',
    managerId: 'emp-004',
  },
  {
    id: 'emp-009',
    fullName: 'Tursunov Bekzod',
    gender: 'male',
    position: 'Rekruter',
    department: 'HR',
    branch: 'Bosh ofis',
    level: 'junior',
    salary: 5400000,
    kpi: 76,
    hiredDaysAgo: 210,
    role: 'Recruiter',
    managerId: 'emp-004',
  },
  {
    id: 'emp-010',
    fullName: 'Rahimov Anvar',
    gender: 'male',
    position: 'Bosh buxgalter',
    department: 'Moliya',
    branch: 'Bosh ofis',
    level: 'lead',
    salary: 16500000,
    kpi: 90,
    hiredDaysAgo: 1520,
    role: 'Finance Head',
    managerId: 'emp-001',
  },
  {
    id: 'emp-011',
    fullName: 'Yo‘ldoshev Sardor',
    gender: 'male',
    position: 'Operatsion direktor',
    department: 'Boshqaruv',
    branch: 'Bosh ofis',
    level: 'lead',
    salary: 26500000,
    kpi: 89,
    hiredDaysAgo: 1680,
    role: 'COO',
    managerId: 'emp-001',
  },
  {
    id: 'emp-012',
    fullName: 'Mirzayev Javohir',
    gender: 'male',
    position: 'Tizim administratori',
    department: 'IT',
    branch: 'Bosh ofis',
    level: 'lead',
    salary: 13500000,
    kpi: 87,
    hiredDaysAgo: 980,
    role: 'IT Head',
    managerId: 'emp-011',
  },
]

const makeDocuments = (rng, hiredAt) => {
  const count = rng.int(4, DOCUMENT_TYPES.length)
  return DOCUMENT_TYPES.slice(0, count).map((name, i) => ({
    id: `doc-${i}`,
    name,
    status: i < count - 1 ? 'verified' : rng.weighted({ verified: 6, pending: 3, missing: 1 }),
    updatedAt: daysAgo(rng.int(1, 120)),
    uploadedAt: hiredAt,
  }))
}

const decorate = (rng, base, index) => {
  const hiredAt = base.hiredAt ?? daysAgo(base.hiredDaysAgo ?? rng.int(20, 1400))
  const tenureDays = Math.round((Date.now() - new Date(hiredAt).getTime()) / 86400000)
  const kpi = base.kpi ?? Math.round(rng.around(78, 9, 44, 99))
  const status =
    base.status ?? (tenureDays < 90 ? rng.weighted({ probation: 7, active: 3 }) : rng.weighted({ active: 24, leave: 1 }))

  return {
    id: base.id,
    code: makeCode(index),
    fullName: base.fullName,
    firstName: base.firstName ?? base.fullName.split(' ')[1] ?? base.fullName,
    lastName: base.lastName ?? base.fullName.split(' ')[0],
    gender: base.gender,
    avatarTone: base.avatarTone ?? AVATAR_TONES[index % AVATAR_TONES.length],
    birthDate: base.birthDate ?? makeBirthDate(rng),
    phone: base.phone ?? makePhone(rng),
    email: base.email ?? makeEmail({ firstName: base.firstName ?? base.fullName.split(' ')[1] ?? 'xodim', lastName: base.lastName ?? base.fullName.split(' ')[0] }, index),
    position: base.position,
    department: base.department,
    branch: base.branch,
    level: base.level,
    employmentType: base.employmentType ?? rng.weighted({ full: 16, part: 2, contract: 2, intern: 1 }),
    status,
    hiredAt,
    tenureDays,
    terminatedAt: base.terminatedAt ?? null,
    managerId: base.managerId ?? null,
    salary: base.salary,
    kpi,
    coins: base.coins ?? Math.round(kpi * rng.float(9, 15)),
    attendanceRate: base.attendanceRate ?? Math.round(rng.around(95, 4, 76, 100)),
    lateCount: base.lateCount ?? rng.int(0, 6),
    absentCount: base.absentCount ?? rng.int(0, 3),
    remoteDays: rng.int(0, 5),
    isCashier: base.position === 'Kassir',
    onboardingStatus: 'completed',
    onboardingCompletedAt: hiredAt,
    candidateId: base.candidateId ?? null,
    education: base.education ?? rng.pick(EDUCATION),
    address: `${base.branch === 'Bosh ofis' ? 'Toshkent' : BRANCHES.find((b) => b.name === base.branch)?.city ?? 'Toshkent'}, ${rng.int(1, 40)}-uy`,
    passport: `AA ${rng.int(1000000, 9999999)}`,
    bankCard: `8600 **** **** ${rng.int(1000, 9999)}`,
    contractNo: `SH-${dateOnly(hiredAt).replace(/-/g, '')}-${String(index).padStart(3, '0')}`,
    emergencyContact: makePhone(rng),
    role: base.role ?? null,
    documents: makeDocuments(rng, hiredAt),
    skills: base.skills ?? [],
  }
}

export const generateEmployees = (rng) => {
  const employees = []
  let index = 0

  LEADERSHIP.forEach((person) => {
    employees.push(decorate(rng, { ...person, status: 'active' }, index++))
  })

  // --- cashiers: every store branch runs its own cashier group -------------
  STORE_BRANCHES.forEach((branch) => {
    const count = rng.int(2, 4)
    for (let i = 0; i < count; i++) {
      const person = makePerson(rng)
      const level = rng.weighted({ junior: 5, middle: 4, senior: 1 })
      const band = POSITIONS.Savdo[0].band
      employees.push(
        decorate(
          rng,
          {
            id: `emp-${String(index + 1).padStart(3, '0')}`,
            ...person,
            position: 'Kassir',
            department: 'Savdo',
            branch,
            level,
            salary: Math.round((rng.step(band[0], band[1], 50000) * LEVEL_MULTIPLIER[level]) / 50000) * 50000,
            hiredDaysAgo: rng.int(25, 900),
          },
          index++,
        ),
      )
    }
  })

  // --- the rest of the organisation ---------------------------------------
  const pool = DEPARTMENTS.filter((d) => !['Boshqaruv'].includes(d.name)).map((d) => d.name)
  const targetTotal = 78
  let guard = 0
  let general = 0
  while (employees.length < targetTotal && guard++ < 400) {
    const department = rng.pick(pool)
    const positions = POSITIONS[department]
    if (!positions) continue
    const { title, band } = rng.pick(positions)
    if (title === 'Kassir') continue
    const level = rng.weighted({ intern: 1, junior: 5, middle: 6, senior: 3, lead: 1 })
    const person = makePerson(rng)
    const branch =
      department === 'Savdo' || department === 'Xavfsizlik'
        ? rng.pick(STORE_BRANCHES)
        : department === 'Logistika'
          ? rng.pick(['Markaziy ombor', 'Sergeli', 'Chilonzor', 'Bosh ofis'])
          : rng.weighted({ 'Bosh ofis': 8, boshqa: 2 }) === 'Bosh ofis'
            ? 'Bosh ofis'
            : rng.pick(STORE_BRANCHES)

    // the first hires of this loop are recent, so the growth chart and the
    // "new employees" KPI always have fresh months to show
    const hiredDaysAgo = general < 7 ? rng.int(2, 27) : general < 26 ? rng.int(31, 330) : rng.int(120, 1500)
    general += 1

    employees.push(
      decorate(
        rng,
        {
          id: `emp-${String(index + 1).padStart(3, '0')}`,
          ...person,
          position: title,
          department,
          branch,
          level,
          salary: Math.round((rng.step(band[0], band[1], 100000) * LEVEL_MULTIPLIER[level]) / 100000) * 100000,
          hiredDaysAgo,
        },
        index++,
      ),
    )
  }

  // --- a handful of leavers so turnover analytics is not empty -------------
  for (let i = 0; i < 6; i++) {
    const person = makePerson(rng)
    const department = rng.pick(['Savdo', 'Logistika', 'Xizmat ko‘rsatish', 'Marketing'])
    const { title, band } = rng.pick(POSITIONS[department])
    const hiredDaysAgo = rng.int(400, 1200)
    employees.push(
      decorate(
        rng,
        {
          id: `emp-${String(index + 1).padStart(3, '0')}`,
          ...person,
          position: title,
          department,
          branch: rng.pick(STORE_BRANCHES),
          level: rng.weighted({ junior: 5, middle: 4 }),
          salary: rng.step(band[0], band[1], 100000),
          hiredDaysAgo,
          status: 'terminated',
          terminatedAt: daysAgo(rng.int(10, 330)),
        },
        index++,
      ),
    )
  }

  // --- managers: department lead, HR reports to the HR head ---------------
  const leadByDepartment = {}
  employees.forEach((e) => {
    if (e.level === 'lead' && !leadByDepartment[e.department]) leadByDepartment[e.department] = e.id
  })
  employees.forEach((e) => {
    if (e.managerId) return
    if (e.department === 'HR') e.managerId = 'emp-003'
    else e.managerId = leadByDepartment[e.department] ?? 'emp-011'
    if (e.managerId === e.id) e.managerId = 'emp-011'
  })

  return employees
}
