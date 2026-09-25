import { appConfig } from '@/config/appConfig'
import { db } from './mock/db'
import { invalidate } from '@/lib/queryBus'
import { DOMAINS } from '@/types'

/**
 * Demo-only utilities (state reset, dataset info). In API mode these become
 * no-ops — real data is never reset from the client.
 */
export const isDemoMode = appConfig.dataSource === 'mock'

export const resetDemoData = async () => {
  if (!isDemoMode) return false
  db.reset()
  invalidate([...DOMAINS, 'analytics', 'reports', 'ai', 'notifications', 'org', '*'])
  return true
}

export const getDemoMeta = () => {
  if (!isDemoMode) return { dataSource: 'api', baseUrl: appConfig.api.baseUrl }
  const all = db.all()
  return {
    dataSource: 'mock',
    seed: all.meta?.seed,
    generatedAt: all.meta?.generatedAt,
    counts: {
      employees: all.employees.length,
      candidates: all.candidates.length,
      vacancies: all.vacancies.length,
      onboarding: all.onboarding.length,
      payroll: all.payroll.length,
      attendance: all.attendance.length,
      tasks: all.tasks.length,
      kpi: all.kpi.length,
      interviews: all.interviews.length,
      cashiers: all.cashiers.length,
      cameras: all.cameras.length,
      externalCandidates: all.externalCandidates.length,
    },
  }
}
