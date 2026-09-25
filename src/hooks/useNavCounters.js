import { useQuery } from './useQuery'
import {
  aiService,
  cameraService,
  candidatesService,
  cashiersService,
  employeesService,
  interviewsService,
  onboardingService,
  payrollService,
  recruiterWebService,
  tasksService,
  vacanciesService,
} from '@/services'

/**
 * Sidebar badge numbers. One aggregated read so the badges always agree with
 * the module pages, refreshed automatically after any mutation.
 */
const load = async () => {
  const [employees, cashiers, candidates, vacancies, onboarding, tasks, interviews, cameras, external, payroll, insights] =
    await Promise.all([
      employeesService.getEmployeeStats(),
      cashiersService.getCashierStats(),
      candidatesService.getCandidateStats(),
      vacanciesService.getVacancyStats(),
      onboardingService.getOnboardingStats(),
      tasksService.getTaskStats(),
      interviewsService.getInterviewStats(),
      cameraService.getCameraStats(),
      recruiterWebService.getExternalStats(),
      payrollService.getPayrollSummary(),
      aiService.getInsightSummary(),
    ])

  return {
    employees: employees.total,
    cashiers: cashiers.total,
    candidatesActive: candidates.active,
    vacanciesOpen: vacancies.active,
    onboardingActive: onboarding.active,
    tasksOpen: tasks.open,
    interviewsUpcoming: interviews.upcoming,
    camerasOffline: cameras.offline + cameras.maintenance,
    externalNew: external.new,
    payrollPending: payroll.pendingCount,
    aiInsights: insights.high,
  }
}

export const useNavCounters = () =>
  useQuery('*', load, { deps: ['nav-counters'], initialData: {} })
