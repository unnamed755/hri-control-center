import { createResource, mapList } from './_resource'
import { KPI_BANDS, kpiBand } from '@/data/mock/kpi'

const r = createResource('/kpi')

export const getKpiRecords = (params) => r.list(params).then(mapList)
export const getKpiMonths = () => r.collection('months')
export const getKpiFacets = () => r.collection('facets')
export const getKpiSummary = (month) => r.collection('summary', { month })
export const getDepartmentPerformance = (month) => r.collection('departments', { month })
export const getTopPerformers = (params) => r.collection('top', params)
export const getAttentionList = (params) => r.collection('attention', params)
export const getEmployeeKpiHistory = (employeeId) => r.collection(`employee/${employeeId}`)
export const updateKpi = (id, patch) => r.update(id, patch)
export const ensureKpiForEmployee = (employee, month) =>
  r.command('ensure', { employeeId: employee?.id ?? employee, month })

export { KPI_BANDS, kpiBand }
