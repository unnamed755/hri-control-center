import clsx from 'clsx'

export const cn = (...args) => clsx(args)

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let seq = 0
export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

export const sum = (arr, pick = (x) => x) => arr.reduce((a, b) => a + (Number(pick(b)) || 0), 0)

export const avg = (arr, pick = (x) => x) => (arr.length ? sum(arr, pick) / arr.length : 0)

export const unique = (arr) => [...new Set(arr)].filter((v) => v !== undefined && v !== null && v !== '')

export const groupBy = (arr, pick) =>
  arr.reduce((acc, item) => {
    const key = pick(item)
    ;(acc[key] ||= []).push(item)
    return acc
  }, {})

export const countBy = (arr, pick) =>
  arr.reduce((acc, item) => {
    const key = pick(item)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

/** Case-insensitive haystack normalisation used by every search input. */
export const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Multi-token search: every token must appear somewhere in the record's
 * searchable text. Records expose numbers (experience, salary) as text too,
 * so a query like "driver 3" finds a driver with 3 years of experience.
 */
export const matchesQuery = (query, fields) => {
  const q = normalize(query)
  if (!q) return true
  const haystack = normalize(fields.filter((f) => f !== undefined && f !== null && f !== '').join(' '))
  return q.split(' ').every((token) => {
    if (!/^\d+$/.test(token)) return haystack.includes(token)
    // Long digit runs (phones, personnel codes) stay substring-searchable…
    if (token.length >= 4) return haystack.includes(token)
    // …while a short number must stand on its own, so "haydovchi 3" means
    // 3 years of experience and does not match a 3 inside a phone number.
    return new RegExp(`(?<!\\d)${token}(?!\\d)`).test(haystack)
  })
}

export const sortRecords = (rows, key, dir = 'asc') => {
  if (!key) return rows
  const factor = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === bv) return 0
    if (av === undefined || av === null) return 1
    if (bv === undefined || bv === null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
    return String(av).localeCompare(String(bv), 'uz') * factor
  })
}

export const paginate = (rows, page, perPage) => {
  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const safePage = clamp(page, 1, pages)
  return {
    rows: rows.slice((safePage - 1) * perPage, safePage * perPage),
    total,
    pages,
    page: safePage,
  }
}

export const inRange = (dateISO, from, to) => {
  if (!from && !to) return true
  if (!dateISO) return false
  const d = new Date(dateISO).setHours(12, 0, 0, 0)
  if (from && d < new Date(from).setHours(0, 0, 0, 0)) return false
  if (to && d > new Date(to).setHours(23, 59, 59, 999)) return false
  return true
}

export const deepClone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))

export const download = (filename, content, mime = 'text/plain;charset=utf-8') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

/** Excel-friendly CSV (semicolon separated + BOM) for the demo export buttons. */
export const toCsv = (columns, rows) => {
  const escape = (v) => {
    const s = v === undefined || v === null ? '' : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = columns.map((c) => escape(c.label)).join(';')
  const body = rows.map((row) => columns.map((c) => escape(c.value(row))).join(';'))
  return '﻿' + [head, ...body].join('\r\n')
}

export const pluralUz = (count, one, many) => (Number(count) === 1 ? one : many)
