const UZ_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
]
const UZ_MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const UZ_WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const UZ_WEEKDAYS_SHORT = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha']

const NBSP = ' '

export const monthName = (index, short = false) =>
  (short ? UZ_MONTHS_SHORT : UZ_MONTHS)[((index % 12) + 12) % 12]

export const weekdayName = (date, short = false) =>
  (short ? UZ_WEEKDAYS_SHORT : UZ_WEEKDAYS)[new Date(date).getDay()]

export const formatNumber = (value, digits = 0) => {
  const n = Number(value) || 0
  const fixed = n.toFixed(digits)
  const [int, frac] = fixed.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  return frac ? `${grouped},${frac}` : grouped
}

/** 1 240 000 -> "1,2 mln" (short scale used across the demo dataset) */
export const formatCompact = (value) => {
  const n = Number(value) || 0
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${formatNumber(n / 1_000_000_000, 2)} mlrd`
  if (abs >= 1_000_000) return `${formatNumber(n / 1_000_000, 1)} mln`
  if (abs >= 10_000) return `${formatNumber(Math.round(n / 1_000))} ming`
  return formatNumber(n)
}

export const formatMoney = (value, { compact = false, currency = "so'm" } = {}) =>
  `${compact ? formatCompact(value) : formatNumber(value)}${currency ? ' ' + currency : ''}`

export const formatPercent = (value, digits = 0) => `${formatNumber(value, digits)}%`

export const formatDelta = (value, digits = 1) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), digits)}%`

export const toDate = (value) => (value instanceof Date ? value : new Date(value))

export const formatDate = (value) => {
  if (!value) return '—'
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

export const formatDateLong = (value) => {
  if (!value) return '—'
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${monthName(d.getMonth()).toLowerCase()} ${d.getFullYear()}`
}

export const formatTime = (value) => {
  if (!value) return '—'
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5)
  const d = toDate(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const formatDateTime = (value) => (value ? `${formatDate(value)} · ${formatTime(value)}` : '—')

export const formatMonthKey = (key, short = true) => {
  if (!key) return '—'
  const [y, m] = String(key).split('-')
  return `${monthName(Number(m) - 1, short)} ${y}`
}

export const monthKey = (date = new Date()) => {
  const d = toDate(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const dateKey = (date = new Date()) => {
  const d = toDate(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const relativeTime = (value) => {
  const diff = Date.now() - toDate(value).getTime()
  if (diff < 0) return formatDateTime(value)
  const min = Math.round(diff / 60000)
  if (min < 1) return 'hozir'
  if (min < 60) return `${min} daqiqa oldin`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.round(hours / 24)
  if (days === 1) return 'kecha'
  if (days < 30) return `${days} kun oldin`
  return formatDate(value)
}

export const daysUntil = (value) => {
  const target = toDate(value).setHours(23, 59, 59, 999)
  return Math.ceil((target - Date.now()) / 86400000)
}

export const formatPhone = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length !== 12) return raw ?? '—'
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
}

export const initials = (fullName) =>
  String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()

export const formatExperience = (years) => {
  const n = Number(years) || 0
  if (n === 0) return 'Tajribasiz'
  if (n < 1) return `${Math.round(n * 12)} oy`
  return `${formatNumber(n, n % 1 ? 1 : 0)} yil`
}

export const formatHours = (hours) => {
  const n = Number(hours) || 0
  const h = Math.floor(n)
  const m = Math.round((n - h) * 60)
  return m ? `${h} s ${m} d` : `${h} s`
}

export const clockNow = (date = new Date()) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
