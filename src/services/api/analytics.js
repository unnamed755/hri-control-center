import { createResource } from './_resource'

const r = createResource('/analytics')

export const getDashboard = () => r.collection('dashboard')
export const getAnalytics = (params) => r.collection('hr', params)
