import { createResource, mapList } from './_resource'

const r = createResource('/attendance')

export const getAttendance = (params) => r.list(params).then(mapList)
export const getOfficeAttendance = (params) => r.collection('office', params).then(mapList)
export const getAttendanceDates = () => r.collection('dates')
export const getAttendanceFacets = () => r.collection('facets')
export const getAttendanceSummary = (scope) => r.collection('summary', scope)
export const getAttendanceTrend = (scope) => r.collection('trend', scope)
export const getDepartmentAttendance = (scope) => r.collection('departments', scope)
export const getOfficeSummary = (date) => r.collection('office-summary', { date })
export const updateAttendance = (id, patch) => r.update(id, patch)
export const setAttendanceStatus = (id, status) => r.action(id, 'status', { status })
export const getLatestAttendanceDate = () => null
