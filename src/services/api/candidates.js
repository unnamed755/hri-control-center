import { createResource, mapList } from './_resource'

const r = createResource('/candidates')

export const getCandidates = (params) => r.list(params).then(mapList)
export const getCandidateById = (id) => r.get(id)
export const getCandidateFacets = () => r.collection('facets')
export const getCandidateStats = () => r.collection('stats')
export const getPipeline = () => r.collection('pipeline')
export const createCandidate = (payload) => r.create(payload)
export const updateCandidate = (id, patch) => r.update(id, patch)
export const setCandidateStatus = (id, status, payload) => r.action(id, 'status', { status, ...payload })
export const addCandidateNote = (id, text, author) => r.action(id, 'notes', { text, author })
export const deleteCandidate = (id) => r.remove(id)
