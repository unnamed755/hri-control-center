import { createResource } from './_resource'
import { REPORT_TYPES } from '@/services/mock/mockReportsService'

const r = createResource('/reports')

export const getReportTypes = () => r.collection('types')
export const generateReport = (params) => r.command('generate', params)

/** Report metadata is static product configuration, not backend data. */
export { REPORT_TYPES }
