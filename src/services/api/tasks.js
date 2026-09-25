import { createResource, mapList } from './_resource'

const r = createResource('/hr-tasks')

export const getTasks = (params) => r.list(params).then(mapList)
export const getTaskById = (id) => r.get(id)
export const getTaskFacets = () => r.collection('facets')
export const getTaskStats = () => r.collection('stats')
export const createTask = (payload) => r.create(payload)
export const updateTask = (id, patch) => r.update(id, patch)
export const setTaskStatus = (id, status) => r.action(id, 'status', { status })
export const deleteTask = (id) => r.remove(id)
