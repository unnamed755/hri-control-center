import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'
import { countBy } from '@/lib/utils'

const decorate = (row) => {
  const time = new Date(row.scheduledAt).getTime()
  return {
    ...row,
    isUpcoming: row.status === 'scheduled' && time >= Date.now(),
    isToday: new Date(row.scheduledAt).toDateString() === new Date().toDateString(),
    hoursUntil: Math.round((time - Date.now()) / 3600000),
  }
}

const queryConfig = {
  search: (r) => [r.candidateName, r.vacancyTitle, r.interviewerName, r.department, r.branch, r.type, r.status, r.phone],
  dateField: 'scheduledAt',
  defaultSort: 'scheduledAt',
  defaultSortDir: 'desc',
  filters: {
    status: (row, value) => {
      if (value === 'upcoming') return row.isUpcoming
      if (value === 'today') return row.isToday
      return row.status === value
    },
    result: (row, value) => row.result === value,
    type: (row, value) => row.type === value,
    mode: (row, value) => row.mode === value,
    interviewerId: (row, value) => row.interviewerId === value,
    department: (row, value) => row.department === value,
    vacancyId: (row, value) => row.vacancyId === value,
    candidateId: (row, value) => row.candidateId === value,
  },
}

export const getInterviews = async (params = {}) => {
  await latency()
  return applyQuery(db.get('interviews').map(decorate), params, queryConfig)
}

export const getInterviewById = async (id) => {
  await latency(0.4)
  const row = db.find('interviews', id)
  if (!row) throw new Error('Suhbat topilmadi')
  const candidate = db.find('candidates', row.candidateId)
  return { ...decorate(row), candidate }
}

export const getInterviewStats = async () => {
  await latency(0.3)
  const rows = db.get('interviews').map(decorate)
  const counts = countBy(rows, (r) => r.status)
  const completed = rows.filter((r) => r.status === 'completed')
  return {
    total: rows.length,
    upcoming: rows.filter((r) => r.isUpcoming).length,
    today: rows.filter((r) => r.isToday && r.status === 'scheduled').length,
    completed: counts.completed ?? 0,
    cancelled: (counts.cancelled ?? 0) + (counts.no_show ?? 0),
    passed: completed.filter((r) => r.result === 'passed').length,
    failed: completed.filter((r) => r.result === 'failed').length,
    passRate: completed.length
      ? Math.round((completed.filter((r) => r.result === 'passed').length / completed.length) * 100)
      : 0,
    avgScore: completed.length
      ? Math.round(completed.reduce((a, b) => a + (b.score ?? 0), 0) / completed.length)
      : 0,
    byType: countBy(rows, (r) => r.type),
  }
}

export const getInterviewFacets = async () => {
  await latency(0.2)
  const rows = db.get('interviews')
  return {
    interviewers: facet(rows, 'interviewerName').map((f) => ({
      value: rows.find((r) => r.interviewerName === f.value)?.interviewerId,
      label: f.value,
      count: f.count,
    })),
    departments: facet(rows, 'department'),
    types: facet(rows, 'type'),
    modes: facet(rows, 'mode'),
  }
}

const INTERVIEWERS = {
  'emp-004': { name: 'Nazarov Rauf', role: 'Yetakchi rekruter' },
  'emp-008': { name: 'Islomova Sabina', role: 'Rekruter' },
  'emp-009': { name: 'Tursunov Bekzod', role: 'Junior rekruter' },
  'emp-003': { name: 'Nazarova Nilufar', role: 'HR bo‘lim boshlig‘i' },
  'emp-011': { name: 'Yo‘ldoshev Sardor', role: 'Operatsion direktor' },
  'emp-012': { name: 'Mirzayev Javohir', role: 'IT rahbari' },
}

export const scheduleInterview = async (payload) => {
  await latency(0.7)
  const candidate = db.find('candidates', payload.candidateId)
  if (!candidate) throw new Error('Nomzod topilmadi')
  const interviewer = INTERVIEWERS[payload.interviewerId] ?? INTERVIEWERS['emp-004']
  const mode = payload.mode ?? 'office'
  const record = {
    id: db.nextId('interviews', 'int'),
    candidateId: candidate.id,
    candidateName: candidate.fullName,
    avatarTone: candidate.avatarTone,
    phone: candidate.phone,
    vacancyId: candidate.vacancyId,
    vacancyTitle: candidate.vacancyTitle,
    department: candidate.department,
    branch: candidate.branch,
    interviewerId: payload.interviewerId ?? 'emp-004',
    interviewerName: interviewer.name,
    interviewerRole: interviewer.role,
    type: payload.type ?? 'hr',
    mode,
    location: mode === 'office' ? 'Bosh ofis · 3-qavat, suhbat xonasi' : 'Online · Telegram video',
    scheduledAt: payload.scheduledAt ?? new Date(Date.now() + 86400000).toISOString(),
    durationMin: Number(payload.durationMin) || 45,
    status: 'scheduled',
    result: 'pending',
    score: null,
    feedback: null,
    createdAt: new Date().toISOString(),
    reminderSent: false,
  }
  db.insert('interviews', record)
  db.update('candidates', candidate.id, (row) => ({
    status: row.status === 'new' || row.status === 'screening' ? 'interview' : row.status,
    interviewAt: record.scheduledAt,
    interviewResult: 'pending',
    updatedAt: new Date().toISOString(),
    timeline: [
      ...(row.timeline ?? []),
      { stage: 'interview', at: new Date().toISOString(), by: interviewer.name, note: 'Suhbat belgilandi' },
    ],
  }))
  invalidate([QK.interviews, QK.candidates, ...AGGREGATE_KEYS])
  return decorate(record)
}

export const rescheduleInterview = async (id, scheduledAt, { reason } = {}) => {
  await latency(0.5)
  const updated = db.update('interviews', id, {
    scheduledAt,
    status: 'rescheduled',
    feedback: reason ?? null,
  })
  if (updated) db.update('candidates', updated.candidateId, { interviewAt: scheduledAt })
  invalidate([QK.interviews, QK.candidates, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const completeInterview = async (id, { result = 'passed', score, feedback } = {}) => {
  await latency(0.7)
  const updated = db.update('interviews', id, {
    status: 'completed',
    result,
    score: Number(score) || (result === 'passed' ? 85 : 50),
    feedback: feedback ?? null,
  })
  if (updated) {
    db.update('candidates', updated.candidateId, (row) => ({
      interviewResult: result,
      updatedAt: new Date().toISOString(),
      status: result === 'failed' ? 'rejected' : row.status,
      rejectReason: result === 'failed' ? (feedback ?? 'Suhbatdan o‘tmadi') : row.rejectReason,
      timeline: [
        ...(row.timeline ?? []),
        {
          stage: result === 'failed' ? 'rejected' : 'interview',
          at: new Date().toISOString(),
          by: updated.interviewerName,
          note: `Suhbat yakunlandi — ${result === 'passed' ? 'o‘tdi' : result === 'failed' ? 'o‘tmadi' : 'zaxira'}`,
        },
      ],
    }))
  }
  invalidate([QK.interviews, QK.candidates, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const cancelInterview = async (id, reason) => {
  await latency(0.4)
  const updated = db.update('interviews', id, { status: 'cancelled', feedback: reason ?? null })
  invalidate([QK.interviews, QK.candidates, ...AGGREGATE_KEYS])
  return decorate(updated)
}

export const deleteInterview = async (id) => {
  await latency(0.4)
  db.remove('interviews', id)
  invalidate([QK.interviews, ...AGGREGATE_KEYS])
  return true
}
