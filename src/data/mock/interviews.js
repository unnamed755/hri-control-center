import { atTime } from './seedRandom'

const FEEDBACK_POSITIVE = [
  'Muloqoti ishonchli, mijoz bilan ishlashga tayyor.',
  'Texnik savollarga aniq javob berdi.',
  'Jamoada ishlash tajribasi yaxshi.',
  'Smenali grafikka roziligini tasdiqladi.',
]
const FEEDBACK_NEGATIVE = [
  'Talab qilingan tajriba yetarli emas.',
  'Kutilgan oylik vakansiya byudjetidan yuqori.',
  'Savollarga ishonchsiz javob berdi.',
]

const INTERVIEWERS = [
  { id: 'emp-004', name: 'Nazarov Rauf', role: 'Yetakchi rekruter' },
  { id: 'emp-008', name: 'Islomova Sabina', role: 'Rekruter' },
  { id: 'emp-009', name: 'Tursunov Bekzod', role: 'Junior rekruter' },
  { id: 'emp-003', name: 'Nazarova Nilufar', role: 'HR bo‘lim boshlig‘i' },
  { id: 'emp-011', name: 'Yo‘ldoshev Sardor', role: 'Operatsion direktor' },
  { id: 'emp-012', name: 'Mirzayev Javohir', role: 'IT rahbari' },
]

/**
 * Interviews mirror the candidate funnel: candidates in `interview` have an
 * upcoming slot, later stages carry a completed interview with a result.
 */
export const generateInterviews = (rng, { candidates }) => {
  const rows = []
  let index = 0

  const add = (candidate, { status, result, daysOffset, hour, type }) => {
    index += 1
    const interviewer =
      candidate.department === 'IT'
        ? rng.pick([INTERVIEWERS[5], INTERVIEWERS[1]])
        : rng.pick([INTERVIEWERS[0], INTERVIEWERS[1], INTERVIEWERS[2], INTERVIEWERS[3]])
    const mode = rng.weighted({ office: 7, online: 3 })
    rows.push({
      id: `int-${String(index).padStart(3, '0')}`,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      avatarTone: candidate.avatarTone,
      phone: candidate.phone,
      vacancyId: candidate.vacancyId,
      vacancyTitle: candidate.vacancyTitle,
      department: candidate.department,
      branch: candidate.branch,
      interviewerId: interviewer.id,
      interviewerName: interviewer.name,
      interviewerRole: interviewer.role,
      type,
      mode,
      location: mode === 'office' ? 'Bosh ofis · 3-qavat, suhbat xonasi' : 'Online · Telegram video',
      scheduledAt: atTime(daysOffset, hour, rng.pick([0, 15, 30])),
      durationMin: rng.pick([30, 40, 45, 60]),
      status,
      result,
      score: result === 'passed' ? rng.int(72, 96) : result === 'failed' ? rng.int(28, 61) : null,
      feedback:
        result === 'passed'
          ? rng.pick(FEEDBACK_POSITIVE)
          : result === 'failed'
            ? rng.pick(FEEDBACK_NEGATIVE)
            : null,
      createdAt: atTime(daysOffset + rng.int(2, 6), 10),
      reminderSent: status === 'scheduled',
    })
  }

  candidates.forEach((candidate) => {
    if (candidate.status === 'interview') {
      const daysOffset = -rng.int(0, 6) // upcoming
      add(candidate, {
        status: 'scheduled',
        result: 'pending',
        daysOffset,
        hour: rng.int(10, 17),
        type: rng.weighted({ hr: 6, technical: 3, trial: 1 }),
      })
      return
    }
    if (['accepted', 'onboarding', 'hired'].includes(candidate.status)) {
      add(candidate, {
        status: 'completed',
        result: 'passed',
        daysOffset: rng.int(6, 34),
        hour: rng.int(10, 17),
        type: rng.weighted({ hr: 5, technical: 3, final: 2 }),
      })
      if (candidate.department === 'IT' || rng.bool(0.25)) {
        add(candidate, {
          status: 'completed',
          result: 'passed',
          daysOffset: rng.int(3, 8),
          hour: rng.int(11, 16),
          type: 'final',
        })
      }
      return
    }
    if (candidate.status === 'rejected' && rng.bool(0.55)) {
      add(candidate, {
        status: rng.weighted({ completed: 7, no_show: 2, cancelled: 1 }),
        result: rng.weighted({ failed: 7, reserve: 3 }),
        daysOffset: rng.int(4, 45),
        hour: rng.int(10, 17),
        type: rng.weighted({ hr: 7, technical: 3 }),
      })
    }
    if (candidate.status === 'screening' && rng.bool(0.3)) {
      add(candidate, {
        status: 'rescheduled',
        result: 'pending',
        daysOffset: -rng.int(2, 9),
        hour: rng.int(10, 17),
        type: 'hr',
      })
    }
  })

  return rows.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
}
