import { appConfig } from '@/config/appConfig'
import { createSeedData } from '@/data/mock'

/**
 * In-memory demo database.
 *
 * It is the single source of truth for every mock service, so a change made in
 * Recruitment is instantly visible in Onboarding, Payroll and Analytics.
 * State is persisted to localStorage so a demo survives a page refresh; bump
 * `appConfig.demo.persistVersion` to re-seed.
 */
const STORAGE_KEY = `${appConfig.demo.persistKey}.v${appConfig.demo.persistVersion}`

let state = null
let persistEnabled = appConfig.demo.persist
let persistTimer = null

const readStorage = () => {
  if (!persistEnabled || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.meta?.version !== appConfig.demo.persistVersion) return null
    return parsed
  } catch {
    return null
  }
}

const writeStorage = () => {
  if (!persistEnabled || typeof localStorage === 'undefined' || !state) return
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Quota exceeded — keep the demo running purely in memory.
      persistEnabled = false
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
  }, 350)
}

const ensure = () => {
  if (!state) state = readStorage() ?? createSeedData()
  return state
}

export const db = {
  all() {
    return ensure()
  },

  /** @returns {Array} live reference — never mutate it outside of db.* */
  get(collection) {
    const value = ensure()[collection]
    return value ?? []
  },

  getObject(collection) {
    return ensure()[collection] ?? null
  },

  find(collection, id) {
    return db.get(collection).find((row) => row.id === id) ?? null
  },

  insert(collection, record, { prepend = true } = {}) {
    const rows = db.get(collection)
    ensure()[collection] = prepend ? [record, ...rows] : [...rows, record]
    writeStorage()
    return record
  },

  insertMany(collection, records, options) {
    records.forEach((r) => db.insert(collection, r, options))
    return records
  },

  update(collection, id, patch) {
    const rows = db.get(collection)
    let updated = null
    ensure()[collection] = rows.map((row) => {
      if (row.id !== id) return row
      updated = typeof patch === 'function' ? { ...row, ...patch(row) } : { ...row, ...patch }
      return updated
    })
    writeStorage()
    return updated
  },

  updateWhere(collection, predicate, patch) {
    const rows = db.get(collection)
    const touched = []
    ensure()[collection] = rows.map((row) => {
      if (!predicate(row)) return row
      const next = typeof patch === 'function' ? { ...row, ...patch(row) } : { ...row, ...patch }
      touched.push(next)
      return next
    })
    writeStorage()
    return touched
  },

  remove(collection, id) {
    const rows = db.get(collection)
    ensure()[collection] = rows.filter((row) => row.id !== id)
    writeStorage()
    return true
  },

  replace(collection, rows) {
    ensure()[collection] = rows
    writeStorage()
    return rows
  },

  setObject(collection, value) {
    ensure()[collection] = value
    writeStorage()
    return value
  },

  /** next sequential id for a collection, e.g. nextId('candidates','cnd') */
  nextId(collection, prefix) {
    const rows = db.get(collection)
    const max = rows.reduce((acc, row) => {
      const n = Number(String(row.id).split('-').pop())
      return Number.isFinite(n) ? Math.max(acc, n) : acc
    }, 0)
    return `${prefix}-${String(max + 1).padStart(3, '0')}`
  },

  reset() {
    state = createSeedData()
    if (persistEnabled && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
    writeStorage()
    return state
  },

  meta() {
    return ensure().meta
  },
}
