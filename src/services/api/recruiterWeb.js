import { createResource, mapList } from './_resource'

const external = createResource('/recruiter-web/applications')
const recruiters = createResource('/recruiters')

export const getExternalCandidates = (params) => external.list(params).then(mapList)
export const getExternalById = (id) => external.get(id)
export const getExternalFacets = () => external.collection('facets')
export const getExternalStats = () => external.collection('stats')
export const markReviewed = (id) => external.action(id, 'review')
export const rejectExternal = (id, note) => external.action(id, 'reject', { note })
export const linkImported = (id, candidateId) => external.action(id, 'import', { candidateId })

export const getRecruiters = () => recruiters.list()
export const getRecruiterById = (id) => recruiters.get(id)
