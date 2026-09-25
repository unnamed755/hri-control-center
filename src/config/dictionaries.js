/**
 * Domain vocabulary: every status value has exactly one Uzbek label and one
 * visual tone, so a badge looks identical on every page.
 * tone ∈ neutral | brand | success | warning | danger | info | violet | teal
 */
const dict = (entries) => ({
  map: entries,
  keys: Object.keys(entries),
  label: (key) => entries[key]?.label ?? key ?? '—',
  tone: (key) => entries[key]?.tone ?? 'neutral',
  options: () => Object.entries(entries).map(([value, v]) => ({ value, label: v.label })),
})

export const candidateStatus = dict({
  new: { label: 'Yangi', tone: 'info' },
  screening: { label: 'Saralash', tone: 'violet' },
  interview: { label: 'Suhbat', tone: 'warning' },
  accepted: { label: 'Qabul qilindi', tone: 'success' },
  onboarding: { label: 'Onboarding', tone: 'teal' },
  hired: { label: 'Ishga olindi', tone: 'brand' },
  rejected: { label: 'Rad etildi', tone: 'danger' },
})

/** Statuses that still occupy a recruiter's pipeline. */
export const ACTIVE_CANDIDATE_STATUSES = ['new', 'screening', 'interview', 'accepted', 'onboarding']

export const RECRUITMENT_PIPELINE = [
  { key: 'new', label: 'Yangi', color: 'var(--color-info)' },
  { key: 'screening', label: 'Saralash', color: 'var(--color-violet)' },
  { key: 'interview', label: 'Suhbat', color: 'var(--color-warning)' },
  { key: 'accepted', label: 'Qabul', color: 'var(--color-success)' },
  { key: 'onboarding', label: 'Onboarding', color: 'var(--color-teal)' },
  { key: 'rejected', label: 'Rad etildi', color: 'var(--color-danger)' },
]

export const vacancyStatus = dict({
  active: { label: 'Aktiv', tone: 'success' },
  paused: { label: 'Pauza', tone: 'warning' },
  closed: { label: 'Yopilgan', tone: 'neutral' },
  archived: { label: 'Arxivda', tone: 'neutral' },
})

export const employeeStatus = dict({
  active: { label: 'Faol', tone: 'success' },
  probation: { label: 'Sinov muddati', tone: 'warning' },
  leave: { label: 'Ta’tilda', tone: 'info' },
  terminated: { label: 'Bo‘shagan', tone: 'danger' },
})

export const employmentType = dict({
  full: { label: 'To‘liq stavka', tone: 'brand' },
  part: { label: 'Yarim stavka', tone: 'info' },
  contract: { label: 'Shartnoma', tone: 'violet' },
  intern: { label: 'Amaliyotchi', tone: 'neutral' },
})

export const onboardingStage = dict({
  accepted: { label: 'Qabul qilindi', tone: 'info' },
  documents: { label: 'Hujjatlar', tone: 'violet' },
  hr_verification: { label: 'HR tekshiruvi', tone: 'warning' },
  orientation: { label: 'Orientatsiya', tone: 'teal' },
  training: { label: 'Trening', tone: 'brand' },
  ready: { label: 'Tayyor', tone: 'success' },
  started: { label: 'START', tone: 'success' },
})

export const ONBOARDING_STAGES = [
  'accepted',
  'documents',
  'hr_verification',
  'orientation',
  'training',
  'ready',
  'started',
]

export const payrollStatus = dict({
  paid: { label: 'To‘langan', tone: 'success' },
  processing: { label: 'Jarayonda', tone: 'info' },
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  hold: { label: 'To‘xtatilgan', tone: 'danger' },
})

export const taskStatus = dict({
  pending: { label: 'Kutilmoqda', tone: 'info' },
  in_progress: { label: 'Jarayonda', tone: 'warning' },
  completed: { label: 'Bajarildi', tone: 'success' },
  overdue: { label: 'Muddati o‘tgan', tone: 'danger' },
})

export const taskPriority = dict({
  low: { label: 'Past', tone: 'neutral' },
  medium: { label: 'O‘rta', tone: 'info' },
  high: { label: 'Yuqori', tone: 'warning' },
  urgent: { label: 'Shoshilinch', tone: 'danger' },
})

export const attendanceStatus = dict({
  present: { label: 'Kelgan', tone: 'success' },
  late: { label: 'Kechikkan', tone: 'warning' },
  absent: { label: 'Kelmagan', tone: 'danger' },
  remote: { label: 'Masofadan', tone: 'info' },
  leave: { label: 'Ta’tilda', tone: 'violet' },
})

export const ATTENDANCE_COLORS = {
  present: 'var(--color-success)',
  late: 'var(--color-warning)',
  absent: 'var(--color-danger)',
  remote: 'var(--color-info)',
  leave: 'var(--color-violet)',
}

export const interviewStatus = dict({
  scheduled: { label: 'Rejalashtirilgan', tone: 'info' },
  completed: { label: 'O‘tkazilgan', tone: 'success' },
  rescheduled: { label: 'Ko‘chirilgan', tone: 'warning' },
  cancelled: { label: 'Bekor qilingan', tone: 'neutral' },
  no_show: { label: 'Kelmadi', tone: 'danger' },
})

export const interviewResult = dict({
  pending: { label: 'Natija kutilmoqda', tone: 'neutral' },
  passed: { label: 'O‘tdi', tone: 'success' },
  failed: { label: 'O‘tmadi', tone: 'danger' },
  reserve: { label: 'Zaxira', tone: 'warning' },
})

export const interviewType = dict({
  hr: { label: 'HR suhbat', tone: 'brand' },
  technical: { label: 'Texnik', tone: 'violet' },
  final: { label: 'Yakuniy', tone: 'teal' },
  trial: { label: 'Sinov kuni', tone: 'warning' },
})

export const cameraStatus = dict({
  online: { label: 'Onlayn', tone: 'success' },
  offline: { label: 'Oflayn', tone: 'danger' },
  maintenance: { label: 'Texnik xizmat', tone: 'warning' },
})

export const externalStatus = dict({
  new: { label: 'Yangi', tone: 'info' },
  reviewed: { label: 'Ko‘rilgan', tone: 'violet' },
  imported: { label: 'Bazaga olingan', tone: 'success' },
  rejected: { label: 'Mos emas', tone: 'danger' },
})

export const level = dict({
  intern: { label: 'Intern', tone: 'neutral' },
  junior: { label: 'Junior', tone: 'info' },
  middle: { label: 'Middle', tone: 'brand' },
  senior: { label: 'Senior', tone: 'violet' },
  lead: { label: 'Lead', tone: 'teal' },
})

export const impact = dict({
  high: { label: 'Yuqori ta’sir', tone: 'danger' },
  medium: { label: 'O‘rta ta’sir', tone: 'warning' },
  low: { label: 'Past ta’sir', tone: 'info' },
})

export const documentStatus = dict({
  verified: { label: 'Tasdiqlangan', tone: 'success' },
  pending: { label: 'Kutilmoqda', tone: 'warning' },
  missing: { label: 'Yo‘q', tone: 'danger' },
})

export const dictionaries = {
  candidateStatus,
  vacancyStatus,
  employeeStatus,
  employmentType,
  onboardingStage,
  payrollStatus,
  taskStatus,
  taskPriority,
  attendanceStatus,
  interviewStatus,
  interviewResult,
  interviewType,
  cameraStatus,
  externalStatus,
  level,
  impact,
  documentStatus,
}
