/**
 * Deterministic PRNG so the demo dataset is identical on every load —
 * dashboard numbers, charts and tables must never drift between refreshes.
 */
const mulberry32 = (seed) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  constructor(seed = 1) {
    this.next = mulberry32(seed)
  }

  float(min = 0, max = 1) {
    return min + this.next() * (max - min)
  }

  int(min, max) {
    return Math.floor(this.float(min, max + 1))
  }

  /** rounded to `step` (e.g. salaries to the nearest 50 000) */
  step(min, max, step) {
    return Math.round(this.int(min, max) / step) * step
  }

  bool(chance = 0.5) {
    return this.next() < chance
  }

  pick(list) {
    return list[this.int(0, list.length - 1)]
  }

  /** weights: { key: weight } -> key */
  weighted(weights) {
    const entries = Object.entries(weights)
    const total = entries.reduce((a, [, w]) => a + w, 0)
    let roll = this.float(0, total)
    for (const [key, w] of entries) {
      roll -= w
      if (roll <= 0) return key
    }
    return entries[entries.length - 1][0]
  }

  shuffle(list) {
    const arr = [...list]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  sample(list, count) {
    return this.shuffle(list).slice(0, count)
  }

  /** normal-ish distribution clamped to [min,max] — nicer KPI spreads */
  around(center, spread, min = -Infinity, max = Infinity) {
    const v = center + (this.next() + this.next() + this.next() - 1.5) * spread
    return Math.min(max, Math.max(min, v))
  }
}

/** ISO date `days` ago (noon, to dodge timezone drift) */
export const daysAgo = (days, base = Date.now()) => {
  const d = new Date(base)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const daysAhead = (days, base = Date.now()) => daysAgo(-days, base)

export const atTime = (days, hour, minute = 0, base = Date.now()) => {
  const d = new Date(base)
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const dateOnly = (iso) => String(iso).slice(0, 10)

export const monthsAgoKey = (offset, base = new Date()) => {
  const d = new Date(base.getFullYear(), base.getMonth() - offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
