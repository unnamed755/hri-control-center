import {
  candidatesService,
  employeesService,
  interviewsService,
  kpiService,
  notificationsService,
  onboardingService,
  payrollService,
  recruiterWebService,
  tasksService,
  vacanciesService,
} from '@/services'
import { AGGREGATE_KEYS, QK, invalidate } from '@/lib/queryBus'

/**
 * Cross-domain orchestration.
 *
 * Domain services stay strictly inside their own boundary (Recruitment never
 * writes payroll). Anything that spans domains lives here, which is also the
 * natural place for a single backend transaction / saga tomorrow.
 *
 *   Recruiter Web → Candidate → Interview → Accepted → Onboarding → START
 *                → Employee → Payroll + KPI + Attendance → Analytics
 */

const notify = (entry) => {
  try {
    notificationsService.pushNotification?.(entry)
  } catch {
    /* notifications are non-critical for the flow */
  }
}

/** 1. External application becomes a real candidate in the pool. */
export const importExternalCandidate = async (external, { recruiterId = 'rec-001', vacancyId } = {}) => {
  const candidate = await candidatesService.createCandidate({
    fullName: external.fullName,
    phone: external.phone,
    profession: external.profession,
    department: external.department,
    experienceYears: external.experienceYears,
    level: external.level,
    city: external.city,
    source: external.source,
    expectedSalary: external.expectedSalary,
    avatarTone: external.avatarTone,
    gender: external.gender,
    recruiterId,
    vacancyId: vacancyId ?? null,
    externalId: external.id,
    status: 'new',
    rating: Math.round((external.matchScore / 100) * 5 * 10) / 10,
    notes: external.note
      ? [{ id: 'note-web', author: 'Recruiter Web', text: external.note, createdAt: new Date().toISOString() }]
      : [],
  })

  await recruiterWebService.linkImported(external.id, candidate.id)

  notify({
    type: 'candidate',
    severity: 'success',
    title: 'Nomzod bazaga olindi',
    message: `${candidate.fullName} — ${candidate.profession} (${external.source})`,
    module: 'recruitment',
    entityId: candidate.id,
    link: '/candidates',
  })

  invalidate([QK.candidates, QK.externalCandidates, QK.recruiters, ...AGGREGATE_KEYS])
  return candidate
}

/** 2. Screening → Interview is a plain status move plus an optional slot. */
export const moveCandidateToScreening = async (candidateId) => {
  const updated = await candidatesService.setCandidateStatus(candidateId, 'screening', {
    note: 'Saralashga olindi',
  })
  return updated
}

export const scheduleCandidateInterview = async (payload) => {
  const interview = await interviewsService.scheduleInterview(payload)
  notify({
    type: 'interview',
    severity: 'info',
    title: 'Suhbat belgilandi',
    message: `${interview.candidateName} · ${new Date(interview.scheduledAt).toLocaleString('ru-RU')}`,
    module: 'recruitment',
    entityId: interview.id,
    link: '/interviews',
  })
  invalidate([QK.interviews, QK.candidates, ...AGGREGATE_KEYS])
  return interview
}

export const completeCandidateInterview = async (interviewId, result) => {
  const interview = await interviewsService.completeInterview(interviewId, result)
  notify({
    type: 'interview',
    severity: result?.result === 'failed' ? 'warning' : 'success',
    title: 'Suhbat yakunlandi',
    message: `${interview.candidateName} — ${result?.result === 'passed' ? 'o‘tdi' : result?.result === 'failed' ? 'o‘tmadi' : 'zaxira'}`,
    module: 'recruitment',
    entityId: interview.id,
    link: '/interviews',
  })
  invalidate([QK.interviews, QK.candidates, ...AGGREGATE_KEYS])
  return interview
}

/** 3. Accepting a candidate opens the onboarding record automatically. */
export const acceptCandidate = async (candidateId, { hrResponsibleId, targetStartDate } = {}) => {
  const candidate = await candidatesService.setCandidateStatus(candidateId, 'accepted', {
    note: 'Taklif qabul qilindi — onboardingga o‘tkazildi',
  })

  const record = await onboardingService.createFromCandidate(candidate, { hrResponsibleId, targetStartDate })

  await tasksService.createTask({
    title: `${candidate.fullName} — onboarding hujjatlarini yig‘ish`,
    description: `${candidate.profession} lavozimi uchun hujjatlar, shartnoma va tibbiy ma’lumotnomani yig‘ish.`,
    module: 'onboarding',
    priority: 'high',
    assigneeId: record.hrResponsibleId,
    dueDate: record.targetStartDate,
  })

  notify({
    type: 'onboarding',
    severity: 'success',
    title: 'Nomzod qabul qilindi',
    message: `${candidate.fullName} onboarding jarayoniga o‘tkazildi. Mas’ul: ${record.hrResponsibleName}`,
    module: 'onboarding',
    entityId: record.id,
    link: '/onboarding',
  })

  invalidate([QK.candidates, QK.onboarding, QK.tasks, QK.vacancies, ...AGGREGATE_KEYS])
  return record
}

export const rejectCandidate = async (candidateId, reason) => {
  const candidate = await candidatesService.setCandidateStatus(candidateId, 'rejected', { note: reason })
  notify({
    type: 'candidate',
    severity: 'warning',
    title: 'Nomzod rad etildi',
    message: `${candidate.fullName} — ${reason ?? 'sabab ko‘rsatilmagan'}`,
    module: 'recruitment',
    entityId: candidate.id,
    link: '/candidates',
  })
  invalidate([QK.candidates, QK.vacancies, ...AGGREGATE_KEYS])
  return candidate
}

/** 4. Stage moves keep the candidate record in sync with onboarding. */
export const advanceOnboarding = async (onboardingId, stage) => {
  if (stage === 'started') return completeOnboarding(onboardingId)

  const record = await onboardingService.setStage(onboardingId, stage)
  if (record.candidateId && stage !== 'accepted') {
    await candidatesService.updateCandidate(record.candidateId, { status: 'onboarding' })
  }
  invalidate([QK.onboarding, QK.candidates, ...AGGREGATE_KEYS])
  return record
}

/**
 * 5. START — the moment a candidate becomes an employee.
 * Creates the employee, wires payroll + KPI, closes the vacancy seat and
 * marks the candidate as hired. Every dashboard number moves after this.
 */
export const completeOnboarding = async (onboardingId) => {
  const record = await onboardingService.getOnboardingById(onboardingId)
  if (record.employeeId) return { record, employee: await employeesService.getEmployeeById(record.employeeId) }

  const started = await onboardingService.setStage(onboardingId, 'started')

  const employee = await employeesService.createEmployee({
    fullName: record.fullName,
    phone: record.phone,
    position: record.position,
    department: record.department,
    branch: record.branch,
    level: record.level,
    salary: record.salaryOffer,
    status: 'probation',
    kpi: 72,
    hiredAt: new Date().toISOString(),
    candidateId: record.candidateId,
    avatarTone: record.avatarTone,
    onboardingStatus: 'completed',
    onboardingCompletedAt: new Date().toISOString(),
    managerId: record.mentorId ?? undefined,
  })

  await onboardingService.linkEmployee(onboardingId, employee.id)

  if (record.candidateId) {
    await candidatesService.updateCandidate(record.candidateId, { status: 'hired', employeeId: employee.id })
  }

  await payrollService.ensurePayrollForEmployee(employee)
  await kpiService.ensureKpiForEmployee(employee)

  if (record.vacancyId) {
    const vacancy = await vacanciesService.getVacancyById(record.vacancyId)
    const filled = (vacancy.filled ?? 0) + 1
    await vacanciesService.updateVacancy(record.vacancyId, {
      filled,
      status: filled >= vacancy.openings ? 'closed' : vacancy.status,
      closedAt: filled >= vacancy.openings ? new Date().toISOString() : null,
    })
  }

  notify({
    type: 'employee',
    severity: 'success',
    title: 'START — yangi xodim ishga tushdi',
    message: `${employee.fullName} · ${employee.position} · ${employee.branch}. Payroll va KPI yozuvlari yaratildi.`,
    module: 'employees',
    entityId: employee.id,
    link: `/employees/${employee.id}`,
  })

  invalidate([
    QK.onboarding,
    QK.candidates,
    QK.employees,
    QK.payroll,
    QK.kpi,
    QK.vacancies,
    QK.cashiers,
    QK.org,
    ...AGGREGATE_KEYS,
  ])

  return { record: started, employee }
}

/** Fast path used by the guided demo: candidate → employee in one action. */
export const runFullHiringFlow = async (candidateId) => {
  const record = await acceptCandidate(candidateId)
  for (const stage of ['documents', 'hr_verification', 'orientation', 'training', 'ready']) {
    await onboardingService.setStage(record.id, stage)
  }
  return completeOnboarding(record.id)
}
