import { createResource, mapList } from './_resource'

const r = createResource('/payroll')

export const getPayroll = (params) => r.list(params).then(mapList)
export const getPayrollById = (id) => r.get(id)
export const getPayrollMonths = () => r.collection('months')
export const getPayrollFacets = () => r.collection('facets')
export const getPayrollSummary = (month) => r.collection('summary', { month })
export const setPayrollStatus = (id, status) => r.action(id, 'status', { status })
export const payAll = (month) => r.command('pay-all', { month })
export const updatePayroll = (id, patch) => r.update(id, patch)
export const ensurePayrollForEmployee = (employee, month) =>
  r.command('ensure', { employeeId: employee?.id ?? employee, month })
