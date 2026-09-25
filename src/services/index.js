import { appConfig } from '@/config/appConfig'

import * as mockEmployees from './mock/mockEmployeesService'
import * as mockCandidates from './mock/mockCandidatesService'
import * as mockVacancies from './mock/mockVacanciesService'
import * as mockOnboarding from './mock/mockOnboardingService'
import * as mockPayroll from './mock/mockPayrollService'
import * as mockAttendance from './mock/mockAttendanceService'
import * as mockTasks from './mock/mockTasksService'
import * as mockKpi from './mock/mockKpiService'
import * as mockInterviews from './mock/mockInterviewsService'
import * as mockCashiers from './mock/mockCashiersService'
import * as mockCamera from './mock/mockCameraService'
import * as mockRecruiterWeb from './mock/mockRecruiterWebService'
import * as mockOrg from './mock/mockOrgService'
import * as mockWorkCriteria from './mock/mockWorkCriteriaService'
import * as mockNotifications from './mock/mockNotificationsService'
import * as mockAnalytics from './mock/mockAnalyticsService'
import * as mockReports from './mock/mockReportsService'
import * as mockAi from './mock/mockAiService'

import * as apiEmployees from './api/employees'
import * as apiCandidates from './api/candidates'
import * as apiVacancies from './api/vacancies'
import * as apiOnboarding from './api/onboarding'
import * as apiPayroll from './api/payroll'
import * as apiAttendance from './api/attendance'
import * as apiTasks from './api/tasks'
import * as apiKpi from './api/kpi'
import * as apiInterviews from './api/interviews'
import * as apiCashiers from './api/cashiers'
import * as apiCamera from './api/camera'
import * as apiRecruiterWeb from './api/recruiterWeb'
import * as apiOrg from './api/org'
import * as apiWorkCriteria from './api/workCriteria'
import * as apiNotifications from './api/notifications'
import * as apiAnalytics from './api/analytics'
import * as apiReports from './api/reports'
import * as apiAi from './api/ai'

/**
 * Service registry — the single switch between DEMO and PRODUCTION.
 *
 *   appConfig.dataSource = 'mock'  →  UI → mock service → demo database
 *   appConfig.dataSource = 'api'   →  UI → api service  → real backend
 *
 * Pages and components import from here only; they never import a mock module
 * directly, which is why tomorrow's backend switch needs zero UI changes.
 */
const useApi = appConfig.dataSource === 'api'
const pick = (mock, api) => (useApi ? api : mock)

export const employeesService = pick(mockEmployees, apiEmployees)
export const candidatesService = pick(mockCandidates, apiCandidates)
export const vacanciesService = pick(mockVacancies, apiVacancies)
export const onboardingService = pick(mockOnboarding, apiOnboarding)
export const payrollService = pick(mockPayroll, apiPayroll)
export const attendanceService = pick(mockAttendance, apiAttendance)
export const tasksService = pick(mockTasks, apiTasks)
export const kpiService = pick(mockKpi, apiKpi)
export const interviewsService = pick(mockInterviews, apiInterviews)
export const cashiersService = pick(mockCashiers, apiCashiers)
export const cameraService = pick(mockCamera, apiCamera)
export const recruiterWebService = pick(mockRecruiterWeb, apiRecruiterWeb)
export const orgService = pick(mockOrg, apiOrg)
export const workCriteriaService = pick(mockWorkCriteria, apiWorkCriteria)
export const notificationsService = pick(mockNotifications, apiNotifications)
export const analyticsService = pick(mockAnalytics, apiAnalytics)
export const reportsService = pick(mockReports, apiReports)
export const aiService = pick(mockAi, apiAi)

export const services = {
  employees: employeesService,
  candidates: candidatesService,
  vacancies: vacanciesService,
  onboarding: onboardingService,
  payroll: payrollService,
  attendance: attendanceService,
  tasks: tasksService,
  kpi: kpiService,
  interviews: interviewsService,
  cashiers: cashiersService,
  camera: cameraService,
  recruiterWeb: recruiterWebService,
  org: orgService,
  workCriteria: workCriteriaService,
  notifications: notificationsService,
  analytics: analyticsService,
  reports: reportsService,
  ai: aiService,
}

export const dataSource = appConfig.dataSource
