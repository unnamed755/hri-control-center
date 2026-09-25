import { createResource, mapList } from './_resource'

const r = createResource('/cashiers')

export const getCashiers = (params) => r.list(params).then(mapList)
export const getCashiersByBranch = (params) => r.collection('by-branch', params)
export const getCashierById = (id) => r.get(id)
export const getCashierStats = () => r.collection('stats')
export const getCashierFacets = () => r.collection('facets')
export const updateCashier = (id, patch) => r.update(id, patch)
