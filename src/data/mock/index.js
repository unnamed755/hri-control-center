import { Rng } from './seedRandom'
import { appConfig } from '@/config/appConfig'
import { generateEmployees } from './employees'
import { generateRecruiters } from './recruiters'
import { generateVacancies } from './vacancies'
import { generateCandidates } from './candidates'
import { generateOnboarding } from './onboarding'
import { generatePayroll } from './payroll'
import { generateAttendance } from './attendance'
import { generateKpi } from './kpi'
import { generateInterviews } from './interviews'
import { generateCashiers } from './cashiers'
import { generateCameras } from './cameras'
import { generateTasks } from './tasks'
import { generateExternalCandidates } from './externalCandidates'
import { generateWorkCriteria } from './workCriteria'
import { buildOrgStructure } from './org'
import { generateNotifications } from './notifications'

/**
 * Builds the whole demo database in one deterministic pass and wires the
 * cross-domain references that make the funnel traceable end to end:
 *
 *   external application → candidate → interview → onboarding → employee
 *                                                     ↘ payroll / kpi / attendance
 */
export const createSeedData = (seed = appConfig.demo.seed) => {
  const rng = new Rng(seed)

  const employees = generateEmployees(rng)
  const recruiters = generateRecruiters(rng, { employees })
  const vacancies = generateVacancies(rng, { recruiters })
  const candidates = generateCandidates(rng, { vacancies, recruiters })

  // --- hired candidates become real employees ------------------------------
  const recentHires = employees
    .filter((e) => e.status !== 'terminated' && !['emp-001', 'emp-002', 'emp-003'].includes(e.id))
    .sort((a, b) => new Date(b.hiredAt) - new Date(a.hiredAt))

  const taken = new Set()
  candidates
    .filter((c) => c.status === 'hired')
    .forEach((candidate) => {
      const match =
        recentHires.find((e) => !taken.has(e.id) && e.position === candidate.profession) ??
        recentHires.find((e) => !taken.has(e.id) && e.department === candidate.department) ??
        recentHires.find((e) => !taken.has(e.id))
      if (!match) return
      taken.add(match.id)
      match.candidateId = candidate.id
      match.onboardingStatus = 'completed'
      candidate.employeeId = match.id
      candidate.profession = match.position
      candidate.department = match.department
      candidate.branch = match.branch
    })

  const onboarding = generateOnboarding(rng, { candidates, employees })
  onboarding.forEach((record) => {
    const candidate = candidates.find((c) => c.id === record.candidateId)
    if (candidate) candidate.onboardingId = record.id
  })

  const payroll = generatePayroll(rng, { employees })
  const attendance = generateAttendance(rng, { employees })
  const kpi = generateKpi(rng, { employees })
  const interviews = generateInterviews(rng, { candidates })
  const cashiers = generateCashiers(rng, { employees })
  const cameras = generateCameras(rng)
  const tasks = generateTasks(rng)
  const externalCandidates = generateExternalCandidates(rng)
  const workCriteria = generateWorkCriteria()

  // --- already-imported web applications point at their candidate ----------
  externalCandidates
    .filter((x) => x.status === 'imported')
    .forEach((external) => {
      const candidate = candidates.find(
        (c) => !c.externalId && c.profession === external.profession && c.status !== 'hired',
      )
      if (!candidate) return
      external.candidateId = candidate.id
      candidate.externalId = external.id
      candidate.source = external.source
    })

  const org = buildOrgStructure({ employees })
  const notifications = generateNotifications(rng, { candidates, onboarding, tasks, vacancies })

  return {
    employees,
    recruiters,
    vacancies,
    candidates,
    onboarding,
    payroll,
    attendance,
    kpi,
    interviews,
    cashiers,
    cameras,
    tasks,
    externalCandidates,
    workCriteria,
    org,
    notifications,
    meta: {
      seed,
      generatedAt: new Date().toISOString(),
      version: appConfig.demo.persistVersion,
    },
  }
}
