import { createResource } from './_resource'

const r = createResource('/work-criteria')

export const getWorkCriteria = () => r.list()
export const getWorkCriteriaGrouped = () => r.collection('grouped')
export const getWorkCriteriaSummary = () => r.collection('summary')
export const createCriterion = (payload) => r.create(payload)
export const updateCriterion = (id, patch) => r.update(id, patch)
export const toggleCriterion = (id) => r.action(id, 'toggle')
export const deleteCriterion = (id) => r.remove(id)
