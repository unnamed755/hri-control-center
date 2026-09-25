import { createResource, mapList } from './_resource'

const r = createResource('/cameras')

export const getCameras = (params) => r.list(params).then(mapList)
export const getCameraById = (id) => r.get(id)
export const getCameraStats = () => r.collection('stats')
export const getCameraFacets = () => r.collection('facets')
export const toggleMonitoring = (id) => r.action(id, 'monitoring')
export const toggleRecording = (id) => r.action(id, 'recording')
export const setCameraStatus = (id, status) => r.action(id, 'status', { status })
