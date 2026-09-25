import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { countBy } from '@/lib/utils'
import { ACTIVE_CANDIDATE_STATUSES } from '@/config/dictionaries'

const searchFields = (v) => [v.title, v.code, v.department, v.branch, v.level, v.status, v.priority]

const queryConfig = {
  search: searchFields,
  dateField: 'createdAt',
  defaultSort: 'createdAt',
  defaultSortDir: 'desc',
  filters: {
    status: (row, value) => (value === 'open' ? row.status === 'active' : row.status === value),
    department: (row, value) => row.department === value,
    branch: (row, value) => row.branch === value,
    level: (row, value) => row.level === value,
    priority: (row, value) => row.priority === value,
    recruiterId: (row, value) => row.recruiterId === value,
  },
}

/** Every vacancy carries its live candidate counters. */
const decorate = (vacancy, candidates, recruiters) => {
  const mine = candidates.filter((c) => c.vacancyId === vacancy.id)
  const recruiter = recruiters.find((r) => r.id === vacancy.recruiterId)
  return {
    ...vacancy,
    candidateCount: mine.length,
    activeCandidates: mine.filter((c) => ACTIVE_CANDIDATE_STATUSES.includes(c.status)).length,
    hiredCount: mine.filter((c) => c.status === 'hired').length,
    interviewCount: mine.filter((c) => c.status === 'interview').length,
    recruiterName: recruiter?.fullName ?? '—',
    recruiterTone: recruiter?.avatarTone ?? 'var(--color-brand)',
    fillRate: vacancy.openings ? Math.round((mine.filter((c) => c.status === 'hired').length / vacancy.openings) * 100) : 0,
    daysLeft: Math.ceil((new Date(vacancy.deadline).getTime() - Date.now()) / 86400000),
  }
}

export const getVacancies = async (params = {}) => {
  await latency()
  const candidates = db.get('candidates')
  const recruiters = db.get('recruiters')
  const rows = db.get('vacancies').map((v) => decorate(v, candidates, recruiters))
  return applyQuery(rows, params, queryConfig)
}

export const getVacancyById = async (id) => {
  await latency()
  const vacancy = db.find('vacancies', id)
  if (!vacancy) throw new Error('Vakansiya topilmadi')
  const candidates = db.get('candidates').filter((c) => c.vacancyId === id)
  const decorated = decorate(vacancy, db.get('candidates'), db.get('recruiters'))
  return {
    ...decorated,
    candidates: candidates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    pipeline: countBy(candidates, (c) => c.status),
    interviews: db.get('interviews').filter((i) => i.vacancyId === id),
  }
}

export const getVacancyFacets = async () => {
  await latency(0.3)
  const rows = db.get('vacancies')
  return {
    departments: facet(rows, 'department'),
    branches: facet(rows, 'branch'),
    levels: facet(rows, 'level'),
    priorities: facet(rows, 'priority'),
    recruiters: db.get('recruiters').map((r) => ({ value: r.id, label: r.fullName })),
    titles: facet(rows, 'title'),
  }
}

export const getVacancyStats = async () => {
  await latency(0.3)
  const rows = db.get('vacancies')
  const candidates = db.get('candidates')
  const active = rows.filter((v) => v.status === 'active')
  return {
    total: rows.length,
    active: active.length,
    paused: rows.filter((v) => v.status === 'paused').length,
    closed: rows.filter((v) => v.status === 'closed' || v.status === 'archived').length,
    openings: active.reduce((a, v) => a + v.openings, 0),
    urgent: active.filter((v) => v.priority === 'urgent' || v.priority === 'high').length,
    expiringSoon: active.filter((v) => new Date(v.deadline).getTime() - Date.now() < 7 * 86400000).length,
    candidatesPerVacancy: active.length
      ? Math.round((candidates.filter((c) => active.some((v) => v.id === c.vacancyId)).length / active.length) * 10) / 10
      : 0,
  }
}

export const createVacancy = async (payload) => {
  await latency()
  const record = {
    id: db.nextId('vacancies', 'vac'),
    code: `VAC-2026-${String(db.get('vacancies').length + 1).padStart(3, '0')}`,
    title: payload.title,
    department: payload.department ?? 'Savdo',
    branch: payload.branch ?? 'Bosh ofis',
    level: payload.level ?? 'junior',
    openings: Number(payload.openings) || 1,
    filled: 0,
    salaryFrom: Number(payload.salaryFrom) || 0,
    salaryTo: Number(payload.salaryTo) || 0,
    status: payload.status ?? 'active',
    priority: payload.priority ?? 'medium',
    recruiterId: payload.recruiterId ?? 'rec-001',
    hiringManagerId: payload.hiringManagerId ?? 'emp-011',
    createdAt: new Date().toISOString(),
    deadline: payload.deadline ?? new Date(Date.now() + 30 * 86400000).toISOString(),
    closedAt: null,
    employmentType: payload.employmentType ?? 'full',
    schedule: payload.schedule ?? '09:00 – 18:00',
    description: payload.description ?? '',
    responsibilities: payload.responsibilities ?? [],
    requirements: payload.requirements ?? [],
    benefits: payload.benefits ?? [],
    views: 0,
  }
  db.insert('vacancies', record)
  invalidate([QK.vacancies, QK.recruiters, ...AGGREGATE_KEYS])
  return record
}

export const updateVacancy = async (id, patch) => {
  await latency()
  const updated = db.update('vacancies', id, patch)
  invalidate([QK.vacancies, QK.candidates, ...AGGREGATE_KEYS])
  return updated
}

export const setVacancyStatus = async (id, status) => {
  await latency()
  const updated = db.update('vacancies', id, {
    status,
    closedAt: status === 'closed' || status === 'archived' ? new Date().toISOString() : null,
  })
  invalidate([QK.vacancies, ...AGGREGATE_KEYS])
  return updated
}

export const assignRecruiter = async (id, recruiterId) => {
  await latency(0.6)
  const recruiter = db.find('recruiters', recruiterId)
  const updated = db.update('vacancies', id, { recruiterId })
  // candidates of this vacancy follow the new owner
  db.updateWhere('candidates', (c) => c.vacancyId === id, {
    recruiterId,
    recruiterName: recruiter?.fullName ?? '—',
  })
  invalidate([QK.vacancies, QK.candidates, QK.recruiters, ...AGGREGATE_KEYS])
  return updated
}

export const deleteVacancy = async (id) => {
  await latency()
  db.remove('vacancies', id)
  invalidate([QK.vacancies, ...AGGREGATE_KEYS])
  return true
}
