/**
 * Domain contracts. These typedefs are the agreement between the UI and the
 * service layer — the mock services and tomorrow's HTTP services must both
 * return exactly these shapes (see `services/api/*` mappers).
 *
 * @typedef {'active'|'probation'|'leave'|'terminated'} EmployeeStatus
 * @typedef {'new'|'screening'|'interview'|'accepted'|'onboarding'|'hired'|'rejected'} CandidateStatus
 * @typedef {'accepted'|'documents'|'hr_verification'|'orientation'|'training'|'ready'|'started'} OnboardingStage
 * @typedef {'paid'|'processing'|'pending'|'hold'} PayrollStatus
 * @typedef {'pending'|'in_progress'|'completed'} TaskStatus
 * @typedef {'low'|'medium'|'high'|'urgent'} TaskPriority
 * @typedef {'present'|'late'|'absent'|'remote'|'leave'} AttendanceStatus
 * @typedef {'intern'|'junior'|'middle'|'senior'|'lead'} Level
 *
 * @typedef {Object} Employee
 * @property {string} id
 * @property {string} code            personnel number, e.g. "HRI-1042"
 * @property {string} fullName
 * @property {string} position
 * @property {string} department
 * @property {string} branch
 * @property {Level} level
 * @property {EmployeeStatus} status
 * @property {'full'|'part'|'contract'|'intern'} employmentType
 * @property {string} phone
 * @property {string} email
 * @property {string} hiredAt         ISO date
 * @property {string|null} terminatedAt
 * @property {string|null} managerId
 * @property {number} salary          gross monthly, UZS
 * @property {number} kpi             0..100
 * @property {number} coins
 * @property {number} attendanceRate  0..100
 * @property {boolean} isCashier
 * @property {OnboardingStage|'completed'|null} onboardingStatus
 * @property {string|null} candidateId origin candidate, when hired through the funnel
 *
 * @typedef {Object} Candidate
 * @property {string} id
 * @property {string} fullName
 * @property {string} phone
 * @property {string} profession
 * @property {number} experienceYears
 * @property {Level} level
 * @property {string|null} vacancyId
 * @property {string} vacancyTitle
 * @property {string} recruiterId
 * @property {string} recruiterName
 * @property {CandidateStatus} status
 * @property {string} source
 * @property {string} createdAt
 * @property {string|null} interviewAt
 * @property {number} expectedSalary
 * @property {Array<{stage:string,at:string,by:string,note?:string}>} timeline
 *
 * @typedef {Object} Vacancy
 * @property {string} id
 * @property {string} title
 * @property {string} department
 * @property {string} branch
 * @property {Level} level
 * @property {string} recruiterId
 * @property {number} openings
 * @property {number} salaryFrom
 * @property {number} salaryTo
 * @property {'active'|'paused'|'closed'|'archived'} status
 * @property {string} createdAt
 * @property {string} deadline
 * @property {string[]} requirements
 *
 * @typedef {Object} OnboardingRecord
 * @property {string} id
 * @property {string} candidateId
 * @property {string|null} employeeId
 * @property {string} fullName
 * @property {string} position
 * @property {OnboardingStage} stage
 * @property {string} hrResponsibleId
 * @property {string} targetStartDate
 * @property {string|null} completedAt
 * @property {Array<{id:string,label:string,stage:OnboardingStage,done:boolean,doneAt:string|null}>} checklist
 * @property {Array<{id:string,author:string,text:string,createdAt:string}>} notes
 *
 * @typedef {Object} PayrollRecord
 * @property {string} id
 * @property {string} month           "2026-09"
 * @property {string} employeeId
 * @property {number} baseSalary
 * @property {number} bonus
 * @property {number} deductions
 * @property {number} tax
 * @property {number} net
 * @property {PayrollStatus} status
 *
 * @typedef {Object} AttendanceRecord
 * @property {string} id
 * @property {string} date            "2026-09-25"
 * @property {string} employeeId
 * @property {AttendanceStatus} status
 * @property {string|null} checkIn
 * @property {string|null} checkOut
 * @property {number} hours
 * @property {number} lateMinutes
 * @property {'turniket'|'mobil'|'qo‘lda'} source
 *
 * @typedef {Object} HRTask
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} assigneeId
 * @property {TaskPriority} priority
 * @property {TaskStatus} status
 * @property {string} dueDate
 * @property {boolean} overdue        derived by the service
 *
 * @typedef {Object} KPIRecord
 * @property {string} id
 * @property {string} employeeId
 * @property {string} month
 * @property {number} kpi
 * @property {number} coins
 *
 * @typedef {Object} Interview
 * @property {string} id
 * @property {string} candidateId
 * @property {string} vacancyId
 * @property {string} interviewerId
 * @property {string} scheduledAt
 * @property {'scheduled'|'completed'|'rescheduled'|'cancelled'|'no_show'} status
 * @property {'pending'|'passed'|'failed'|'reserve'} result
 *
 * @typedef {Object} AnalyticsData
 * @property {Object} headline        KPI numbers for the control center
 * @property {Array} employeeGrowth
 * @property {Array} hiringFunnel
 * @property {Array} attendanceTrend
 * @property {Array} payrollTrend
 * @property {Array} kpiDistribution
 * @property {Array} departmentComparison
 * @property {Array} onboardingProgress
 */

export const DOMAINS = [
  'employees',
  'candidates',
  'vacancies',
  'onboarding',
  'payroll',
  'attendance',
  'tasks',
  'kpi',
  'interviews',
  'cashiers',
  'cameras',
  'recruiters',
  'externalCandidates',
  'org',
  'workCriteria',
  'notifications',
]
