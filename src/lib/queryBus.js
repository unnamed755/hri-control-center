/**
 * Tiny invalidation bus.
 *
 * Mutations announce which collections changed; every mounted `useQuery`
 * listening on that key refetches through its service. This is the exact seam
 * where real revalidation (websocket push, SWR, react-query) lands tomorrow —
 * no UI component has to change.
 */
const listeners = new Map()

export const subscribeKey = (key, fn) => {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key).add(fn)
  return () => {
    listeners.get(key)?.delete(fn)
  }
}

export const invalidate = (keys) => {
  const list = Array.isArray(keys) ? keys : [keys]
  const notified = new Set()
  list.forEach((key) => {
    listeners.get(key)?.forEach((fn) => {
      if (notified.has(fn)) return
      notified.add(fn)
      fn()
    })
  })
  listeners.get('*')?.forEach((fn) => {
    if (!notified.has(fn)) fn()
  })
}

export const QK = {
  employees: 'employees',
  candidates: 'candidates',
  vacancies: 'vacancies',
  onboarding: 'onboarding',
  payroll: 'payroll',
  attendance: 'attendance',
  officeAttendance: 'officeAttendance',
  tasks: 'tasks',
  kpi: 'kpi',
  interviews: 'interviews',
  cashiers: 'cashiers',
  cameras: 'cameras',
  recruiters: 'recruiters',
  externalCandidates: 'externalCandidates',
  org: 'org',
  workCriteria: 'workCriteria',
  notifications: 'notifications',
  analytics: 'analytics',
  reports: 'reports',
  ai: 'ai',
}

/** Anything that changes a domain also changes the aggregated views. */
export const AGGREGATE_KEYS = [QK.analytics, QK.notifications, QK.reports]
