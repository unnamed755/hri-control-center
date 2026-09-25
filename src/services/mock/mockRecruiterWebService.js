import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { countBy } from '@/lib/utils'
import { ACTIVE_CANDIDATE_STATUSES } from '@/config/dictionaries'

/**
 * Recruiter Web = the external application feed.
 *
 * DEMO ONLY: rows are seeded locally. Tomorrow this module is the single place
 * to swap in real job-board integrations (OLX / hh.uz / Telegram bot) — the
 * page and the import flow stay untouched.
 */
const queryConfig = {
  search: (r) => [
    r.fullName,
    r.phone,
    r.profession,
    r.department,
    r.source,
    r.city,
    r.level,
    String(r.experienceYears),
    `${r.experienceYears} yil`,
  ],
  dateField: 'importedAt',
  defaultSort: 'importedAt',
  defaultSortDir: 'desc',
  filters: {
    status: (row, value) => row.status === value,
    source: (row, value) => row.source === value,
    profession: (row, value) => row.profession === value,
    department: (row, value) => row.department === value,
    level: (row, value) => row.level === value,
    city: (row, value) => row.city === value,
    experience: (row, value) => {
      if (value === '0') return row.experienceYears === 0
      if (value === '1-2') return row.experienceYears >= 1 && row.experienceYears <= 2
      if (value === '3-5') return row.experienceYears >= 3 && row.experienceYears <= 5
      if (value === '6+') return row.experienceYears >= 6
      return true
    },
    minMatch: (row, value) => row.matchScore >= Number(value),
  },
}

export const getExternalCandidates = async (params = {}) => {
  await latency()
  return applyQuery(db.get('externalCandidates'), params, queryConfig)
}

export const getExternalById = async (id) => {
  await latency(0.3)
  const row = db.find('externalCandidates', id)
  if (!row) throw new Error('Ariza topilmadi')
  const candidate = row.candidateId ? db.find('candidates', row.candidateId) : null
  return { ...row, candidate }
}

export const getExternalFacets = async () => {
  await latency(0.2)
  const rows = db.get('externalCandidates')
  return {
    sources: facet(rows, 'source'),
    professions: facet(rows, 'profession'),
    departments: facet(rows, 'department'),
    cities: facet(rows, 'city'),
    levels: facet(rows, 'level'),
  }
}

export const getExternalStats = async () => {
  await latency(0.25)
  const rows = db.get('externalCandidates')
  const counts = countBy(rows, (r) => r.status)
  return {
    total: rows.length,
    new: counts.new ?? 0,
    reviewed: counts.reviewed ?? 0,
    imported: counts.imported ?? 0,
    rejected: counts.rejected ?? 0,
    duplicates: rows.filter((r) => r.duplicate).length,
    withCv: rows.filter((r) => r.hasCv).length,
    conversion: rows.length ? Math.round(((counts.imported ?? 0) / rows.length) * 100) : 0,
    bySource: Object.entries(countBy(rows, (r) => r.source))
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    avgMatch: rows.length ? Math.round(rows.reduce((a, b) => a + b.matchScore, 0) / rows.length) : 0,
  }
}

export const markReviewed = async (id) => {
  await latency(0.35)
  const updated = db.update('externalCandidates', id, { status: 'reviewed' })
  invalidate([QK.externalCandidates, ...AGGREGATE_KEYS])
  return updated
}

export const rejectExternal = async (id, note) => {
  await latency(0.35)
  const updated = db.update('externalCandidates', id, { status: 'rejected', note: note ?? 'Mos emas' })
  invalidate([QK.externalCandidates, ...AGGREGATE_KEYS])
  return updated
}

export const linkImported = async (id, candidateId) => {
  const updated = db.update('externalCandidates', id, { status: 'imported', candidateId })
  invalidate([QK.externalCandidates])
  return updated
}

/* ------------------------------------------------------------------ */
/* Recruiters                                                          */
/* ------------------------------------------------------------------ */

const decorateRecruiter = (recruiter) => {
  const candidates = db.get('candidates').filter((c) => c.recruiterId === recruiter.id)
  const vacancies = db.get('vacancies').filter((v) => v.recruiterId === recruiter.id)
  const hired = candidates.filter((c) => c.status === 'hired').length
  return {
    ...recruiter,
    candidatesTotal: candidates.length,
    candidatesActive: candidates.filter((c) => ACTIVE_CANDIDATE_STATUSES.includes(c.status)).length,
    hired,
    rejected: candidates.filter((c) => c.status === 'rejected').length,
    interviews: db.get('interviews').filter((i) => i.interviewerId === recruiter.employeeId).length,
    vacanciesActive: vacancies.filter((v) => v.status === 'active').length,
    vacanciesTotal: vacancies.length,
    openings: vacancies.filter((v) => v.status === 'active').reduce((a, v) => a + v.openings, 0),
    conversion: candidates.length ? Math.round((hired / candidates.length) * 100) : 0,
    planProgress: recruiter.monthlyPlan ? Math.round((recruiter.monthlyDone / recruiter.monthlyPlan) * 100) : 0,
    funnel: countBy(candidates, (c) => c.status),
  }
}

export const getRecruiters = async () => {
  await latency(0.35)
  return db.get('recruiters').map(decorateRecruiter)
}

export const getRecruiterById = async (id) => {
  await latency(0.4)
  const recruiter = db.get('recruiters').find((r) => r.id === id)
  if (!recruiter) throw new Error('Rekruter topilmadi')
  const decorated = decorateRecruiter(recruiter)
  const candidates = db
    .get('candidates')
    .filter((c) => c.recruiterId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const vacancies = db.get('vacancies').filter((v) => v.recruiterId === id)
  const interviews = db
    .get('interviews')
    .filter((i) => i.interviewerId === recruiter.employeeId)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
  return { ...decorated, candidates, vacancies, interviews }
}
