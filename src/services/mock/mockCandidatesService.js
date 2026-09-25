import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { countBy, uid } from '@/lib/utils'
import { ACTIVE_CANDIDATE_STATUSES, RECRUITMENT_PIPELINE } from '@/config/dictionaries'

const searchFields = (c) => [
  c.fullName,
  c.phone,
  c.profession,
  c.vacancyTitle,
  c.recruiterName,
  c.source,
  c.city,
  c.level,
  c.status,
  c.department,
  // numeric fields as text so "driver 3 years" style queries work
  String(c.experienceYears),
  `${c.experienceYears} yil`,
]

const queryConfig = {
  search: searchFields,
  dateField: 'createdAt',
  defaultSort: 'createdAt',
  defaultSortDir: 'desc',
  filters: {
    status: (row, value) => (value === 'active' ? ACTIVE_CANDIDATE_STATUSES.includes(row.status) : row.status === value),
    profession: (row, value) => row.profession === value,
    department: (row, value) => row.department === value,
    level: (row, value) => row.level === value,
    vacancyId: (row, value) => row.vacancyId === value,
    recruiterId: (row, value) => row.recruiterId === value,
    source: (row, value) => row.source === value,
    branch: (row, value) => row.branch === value,
    experience: (row, value) => {
      if (value === '0') return row.experienceYears === 0
      if (value === '1-2') return row.experienceYears >= 1 && row.experienceYears <= 2
      if (value === '3-5') return row.experienceYears >= 3 && row.experienceYears <= 5
      if (value === '6+') return row.experienceYears >= 6
      return true
    },
    hasInterview: (row, value) => (String(value) === 'true' ? Boolean(row.interviewAt) : true),
  },
}

export const getCandidates = async (params = {}) => {
  await latency()
  return applyQuery(db.get('candidates'), params, queryConfig)
}

export const getCandidateFacets = async () => {
  await latency(0.4)
  const rows = db.get('candidates')
  return {
    professions: facet(rows, 'profession'),
    departments: facet(rows, 'department'),
    sources: facet(rows, 'source'),
    levels: facet(rows, 'level'),
    branches: facet(rows, 'branch'),
    recruiters: db.get('recruiters').map((r) => ({ value: r.id, label: r.fullName })),
    vacancies: db
      .get('vacancies')
      .filter((v) => v.status === 'active')
      .map((v) => ({ value: v.id, label: `${v.title} · ${v.branch}` })),
    statusCounts: countBy(rows, (r) => r.status),
  }
}

export const getCandidateById = async (id) => {
  await latency()
  const candidate = db.find('candidates', id)
  if (!candidate) throw new Error('Nomzod topilmadi')
  const vacancy = candidate.vacancyId ? db.find('vacancies', candidate.vacancyId) : null
  const recruiter = db.find('recruiters', candidate.recruiterId)
  const interviews = db
    .get('interviews')
    .filter((i) => i.candidateId === id)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
  const onboarding = db.get('onboarding').find((o) => o.candidateId === id) ?? null
  const employee = candidate.employeeId ? db.find('employees', candidate.employeeId) : null
  const external = candidate.externalId ? db.find('externalCandidates', candidate.externalId) : null
  return { ...candidate, vacancy, recruiter, interviews, onboarding, employee, external }
}

export const getPipeline = async () => {
  await latency(0.4)
  const rows = db.get('candidates')
  const counts = countBy(rows, (r) => r.status)
  return RECRUITMENT_PIPELINE.map((stage) => ({
    ...stage,
    value: counts[stage.key] ?? 0,
  }))
}

export const getCandidateStats = async () => {
  await latency(0.35)
  const rows = db.get('candidates')
  const counts = countBy(rows, (r) => r.status)
  const active = rows.filter((r) => ACTIVE_CANDIDATE_STATUSES.includes(r.status))
  const sevenDaysAgo = Date.now() - 7 * 86400000
  const hired = counts.hired ?? 0
  const rejected = counts.rejected ?? 0
  return {
    total: rows.length,
    active: active.length,
    new: counts.new ?? 0,
    screening: counts.screening ?? 0,
    interview: counts.interview ?? 0,
    accepted: counts.accepted ?? 0,
    onboarding: counts.onboarding ?? 0,
    hired,
    rejected,
    thisWeek: rows.filter((r) => new Date(r.createdAt).getTime() >= sevenDaysAgo).length,
    conversion: rows.length ? Math.round((hired / rows.length) * 100) : 0,
    bySource: countBy(rows, (r) => r.source),
    byProfession: countBy(rows, (r) => r.profession),
  }
}

export const createCandidate = async (payload) => {
  await latency()
  const vacancy = payload.vacancyId ? db.find('vacancies', payload.vacancyId) : null
  const recruiter = db.find('recruiters', payload.recruiterId) ?? db.get('recruiters')[0]
  const now = new Date().toISOString()
  const record = {
    id: db.nextId('candidates', 'cnd'),
    fullName: payload.fullName,
    firstName: payload.fullName?.split(' ')[1] ?? payload.fullName,
    lastName: payload.fullName?.split(' ')[0] ?? '',
    gender: payload.gender ?? 'male',
    avatarTone: payload.avatarTone ?? 'var(--color-brand)',
    phone: payload.phone ?? '',
    email: payload.email ?? '',
    profession: payload.profession ?? vacancy?.title ?? '—',
    department: payload.department ?? vacancy?.department ?? 'Savdo',
    experienceYears: Number(payload.experienceYears) || 0,
    level: payload.level ?? 'junior',
    vacancyId: vacancy?.id ?? null,
    vacancyTitle: vacancy?.title ?? payload.profession ?? '—',
    branch: payload.branch ?? vacancy?.branch ?? 'Bosh ofis',
    recruiterId: recruiter?.id ?? 'rec-001',
    recruiterName: recruiter?.fullName ?? '—',
    status: payload.status ?? 'new',
    source: payload.source ?? 'Korporativ sayt',
    city: payload.city ?? 'Toshkent',
    education: payload.education ?? '—',
    expectedSalary: Number(payload.expectedSalary) || 0,
    rating: Number(payload.rating) || 0,
    createdAt: now,
    updatedAt: now,
    interviewAt: null,
    interviewResult: null,
    rejectReason: null,
    onboardingId: null,
    employeeId: null,
    cv: payload.cv ?? null,
    languages: payload.languages ?? ['O‘zbek'],
    notes: payload.notes ?? [],
    timeline: [{ stage: 'new', at: now, by: payload.createdBy ?? 'HR Panel', note: 'Nomzod bazaga qo‘shildi' }],
    externalId: payload.externalId ?? null,
  }
  db.insert('candidates', record)
  invalidate([QK.candidates, QK.vacancies, QK.recruiters, ...AGGREGATE_KEYS])
  return record
}

export const updateCandidate = async (id, patch) => {
  await latency()
  const updated = db.update('candidates', id, { ...patch, updatedAt: new Date().toISOString() })
  invalidate([QK.candidates, QK.vacancies, ...AGGREGATE_KEYS])
  return updated
}

/** Plain status change — cross-domain effects live in `services/workflow`. */
export const setCandidateStatus = async (id, status, { note, by = 'HR Panel' } = {}) => {
  await latency()
  const now = new Date().toISOString()
  const updated = db.update('candidates', id, (row) => ({
    status,
    updatedAt: now,
    rejectReason: status === 'rejected' ? (note ?? row.rejectReason ?? 'Sabab ko‘rsatilmagan') : null,
    timeline: [...(row.timeline ?? []), { stage: status, at: now, by, note: note ?? null }],
  }))
  invalidate([QK.candidates, QK.vacancies, QK.interviews, ...AGGREGATE_KEYS])
  return updated
}

export const addCandidateNote = async (id, text, author = 'Super Admin') => {
  await latency(0.6)
  const updated = db.update('candidates', id, (row) => ({
    notes: [...(row.notes ?? []), { id: uid('note'), author, text, createdAt: new Date().toISOString() }],
  }))
  invalidate([QK.candidates])
  return updated
}

export const deleteCandidate = async (id) => {
  await latency()
  db.remove('candidates', id)
  db.replace(
    'interviews',
    db.get('interviews').filter((i) => i.candidateId !== id),
  )
  invalidate([QK.candidates, QK.interviews, ...AGGREGATE_KEYS])
  return true
}
