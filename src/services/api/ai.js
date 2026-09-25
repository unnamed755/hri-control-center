import { createResource } from './_resource'

const r = createResource('/ai')

export const getInsights = () => r.collection('insights')
export const getInsightSummary = () => r.collection('insights/summary')
