import { createResource, mapList } from './_resource'

const r = createResource('/employees')

export const getEmployees = (params) => r.list(params).then(mapList)
export const getEmployeeById = (id) => r.get(id)
export const getEmployeeOptions = () => r.collection('options')
export const getEmployeeFacets = () => r.collection('facets')
export const getEmployeeStats = () => r.collection('stats')
export const createEmployee = (payload) => r.create(payload)
export const updateEmployee = (id, patch) => r.update(id, patch)
export const terminateEmployee = (id, payload) => r.action(id, 'terminate', payload)
export const restoreEmployee = (id) => r.action(id, 'restore')
export const deleteEmployee = (id) => r.remove(id)
