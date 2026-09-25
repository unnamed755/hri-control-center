import { createResource, mapList } from './_resource'

const r = createResource('/vacancies')

export const getVacancies = (params) => r.list(params).then(mapList)
export const getVacancyById = (id) => r.get(id)
export const getVacancyFacets = () => r.collection('facets')
export const getVacancyStats = () => r.collection('stats')
export const createVacancy = (payload) => r.create(payload)
export const updateVacancy = (id, patch) => r.update(id, patch)
export const setVacancyStatus = (id, status) => r.action(id, 'status', { status })
export const assignRecruiter = (id, recruiterId) => r.action(id, 'recruiter', { recruiterId })
export const deleteVacancy = (id) => r.remove(id)
