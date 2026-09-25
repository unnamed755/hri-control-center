import { createResource } from './_resource'

const r = createResource('/org')

export const getOrgStructure = () => r.collection('structure')
export const getOrgSummary = () => r.collection('summary')
export const getDirectReports = (employeeId) => r.collection(`reports/${employeeId}`)
