import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'

import DashboardPage from '@/pages/dashboard/DashboardPage'
import AiRecommendationsPage from '@/pages/ai/AiRecommendationsPage'
import EmployeesPage from '@/pages/employees/EmployeesPage'
import EmployeeProfilePage from '@/pages/employees/EmployeeProfilePage'
import CashiersPage from '@/pages/cashiers/CashiersPage'
import EmployeeRegisterPage from '@/pages/employees/EmployeeRegisterPage'
import OrgStructurePage from '@/pages/org/OrgStructurePage'
import PerformancePage from '@/pages/performance/PerformancePage'
import AttendancePage from '@/pages/attendance/AttendancePage'
import CameraPage from '@/pages/camera/CameraPage'
import OfficeAttendancePage from '@/pages/attendance/OfficeAttendancePage'
import KpiCoinsPage from '@/pages/kpi/KpiCoinsPage'
import InterviewsPage from '@/pages/interviews/InterviewsPage'
import PayrollPage from '@/pages/payroll/PayrollPage'
import WorkCriteriaPage from '@/pages/criteria/WorkCriteriaPage'
import CandidatesPage from '@/pages/recruitment/CandidatesPage'
import VacanciesPage from '@/pages/recruitment/VacanciesPage'
import RecruiterPage from '@/pages/recruitment/RecruiterPage'
import RecruiterWebPage from '@/pages/recruitment/RecruiterWebPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import HrTasksPage from '@/pages/tasks/HrTasksPage'
import HrAnalyticsPage from '@/pages/analytics/HrAnalyticsPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import NotFoundPage from '@/pages/NotFoundPage'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ai-recommendations" element={<AiRecommendationsPage />} />

        {/* XODIMLAR */}
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeProfilePage />} />
        <Route path="/cashiers" element={<CashiersPage />} />
        <Route path="/employee-register" element={<EmployeeRegisterPage />} />
        <Route path="/org-structure" element={<OrgStructurePage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/office-attendance" element={<OfficeAttendancePage />} />
        <Route path="/kpi-coins" element={<KpiCoinsPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />

        {/* MOLIYA */}
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/work-criteria" element={<WorkCriteriaPage />} />

        {/* ISHGA OLISH */}
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route path="/recruiter" element={<RecruiterPage />} />
        <Route path="/recruiter-web" element={<RecruiterWebPage />} />

        {/* HR BOSHQARUV */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/hr-tasks" element={<HrTasksPage />} />
        <Route path="/hr-analytics" element={<HrAnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
