import { createResource, mapList } from './_resource'

const r = createResource('/onboarding')

export const getOnboardingRecords = (params) => r.list(params).then(mapList)
export const getOnboardingById = (id) => r.get(id)
export const getOnboardingFacets = () => r.collection('facets')
export const getOnboardingStats = () => r.collection('stats')
export const createFromCandidate = (candidate, payload) =>
  r.create({ candidateId: candidate?.id ?? candidate, ...payload })
export const setStage = (id, stage, payload) => r.action(id, 'stage', { stage, ...payload })
export const toggleChecklistItem = (id, itemId) => r.action(id, 'checklist', { itemId })
export const addNote = (id, text, author) => r.action(id, 'notes', { text, author })
export const assignHrResponsible = (id, hrResponsibleId) => r.action(id, 'responsible', { hrResponsibleId })
export const updateOnboarding = (id, patch) => r.update(id, patch)
export const linkEmployee = (id, employeeId) => r.action(id, 'employee', { employeeId })
export const deleteOnboarding = (id) => r.remove(id)
