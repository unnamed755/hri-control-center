import { createResource, mapList } from './_resource'

const r = createResource('/interviews')

export const getInterviews = (params) => r.list(params).then(mapList)
export const getInterviewById = (id) => r.get(id)
export const getInterviewStats = () => r.collection('stats')
export const getInterviewFacets = () => r.collection('facets')
export const scheduleInterview = (payload) => r.create(payload)
export const rescheduleInterview = (id, scheduledAt, payload) =>
  r.action(id, 'reschedule', { scheduledAt, ...payload })
export const completeInterview = (id, payload) => r.action(id, 'complete', payload)
export const cancelInterview = (id, reason) => r.action(id, 'cancel', { reason })
export const deleteInterview = (id) => r.remove(id)
