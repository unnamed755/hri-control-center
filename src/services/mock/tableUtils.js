import { appConfig } from '@/config/appConfig'
import { countBy, inRange, matchesQuery, paginate, sleep, sortRecords, unique } from '@/lib/utils'

const [MIN, MAX] = appConfig.demo.latency

/** Simulated network latency so loading skeletons are exercised for real. */
export const latency = (factor = 1) => sleep(Math.round((MIN + Math.random() * (MAX - MIN)) * factor))

/**
 * Server-side-style querying performed by the mock layer.
 * The params shape is intentionally the one a REST endpoint would accept:
 *   { q, filters, sortBy, sortDir, page, perPage, from, to }
 */
export const applyQuery = (rows, params = {}, config = {}) => {
  const { q, filters = {}, sortBy, sortDir = 'asc', page = 1, perPage, from, to } = params
  let out = rows

  if (q && config.search) {
    out = out.filter((row) => matchesQuery(q, config.search(row)))
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return
    if (Array.isArray(value) && !value.length) return
    const predicate = config.filters?.[key]
    out = out.filter((row) => {
      if (predicate) return predicate(row, value)
      if (Array.isArray(value)) return value.map(String).includes(String(row[key]))
      return String(row[key]) === String(value)
    })
  })

  if (from || to) {
    const field = config.dateField ?? 'createdAt'
    out = out.filter((row) => inRange(row[field], from, to))
  }

  const sortKey = sortBy ?? config.defaultSort
  const dir = sortBy ? sortDir : (config.defaultSortDir ?? sortDir)
  if (sortKey) out = sortRecords(out, sortKey, dir)

  const total = out.length
  if (perPage) {
    const p = paginate(out, page, perPage)
    return { rows: p.rows, total, pages: p.pages, page: p.page, perPage }
  }
  return { rows: out, total, pages: 1, page: 1, perPage: total }
}

/** Distinct values + counts for filter dropdowns. */
export const facet = (rows, key) => {
  const counts = countBy(rows, (r) => r[key])
  return unique(rows.map((r) => r[key]))
    .sort((a, b) => String(a).localeCompare(String(b), 'uz'))
    .map((value) => ({ value, label: String(value), count: counts[value] ?? 0 }))
}

export const optionsFrom = (values) => values.map((value) => ({ value, label: String(value) }))
