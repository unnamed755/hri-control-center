import { db } from './db'
import { latency } from './tableUtils'
import { avg, countBy, inRange, sum, unique } from '@/lib/utils'
import { formatDate, formatMoney, formatNumber, formatPercent, monthKey } from '@/lib/format'
import {
  attendanceStatus,
  candidateStatus,
  employeeStatus,
  onboardingStage,
  payrollStatus,
} from '@/config/dictionaries'

export const REPORT_TYPES = [
  {
    id: 'recruitment',
    title: 'Ishga olish hisoboti',
    description: 'Nomzodlar, manbalar, konversiya va rekruter samaradorligi',
    module: 'recruitment',
    icon: 'UserSearch',
    dateField: 'createdAt',
  },
  {
    id: 'employees',
    title: 'Xodimlar hisoboti',
    description: 'Shtat, bo‘lim va filial kesimida kadrlar tarkibi',
    module: 'employees',
    icon: 'Users',
    dateField: 'hiredAt',
  },
  {
    id: 'attendance',
    title: 'Davomat hisoboti',
    description: 'Kelish, kechikish va yo‘qlik ko‘rsatkichlari',
    module: 'attendance',
    icon: 'CalendarCheck2',
    dateField: 'date',
  },
  {
    id: 'payroll',
    title: 'Payroll hisoboti',
    description: 'Oylik, bonus, ushlanma va soliq bo‘yicha to‘liq kesim',
    module: 'payroll',
    icon: 'Banknote',
    dateField: 'paidAt',
  },
  {
    id: 'kpi',
    title: 'KPI hisoboti',
    description: 'Samaradorlik taqsimoti va bo‘limlar solishtiruvi',
    module: 'kpi',
    icon: 'TrendingUp',
    dateField: null,
  },
  {
    id: 'onboarding',
    title: 'Onboarding hisoboti',
    description: 'Yangi xodimlarning moslashuv bosqichlari va yakunlanishi',
    module: 'onboarding',
    icon: 'Rocket',
    dateField: 'createdAt',
  },
]

export const getReportTypes = async () => {
  await latency(0.2)
  return REPORT_TYPES
}

const scope = (rows, dateField, from, to) =>
  dateField ? rows.filter((r) => inRange(r[dateField], from, to)) : rows

export const generateReport = async ({ type = 'recruitment', from, to, filters = {} } = {}) => {
  await latency(1.1)
  const meta = REPORT_TYPES.find((r) => r.id === type) ?? REPORT_TYPES[0]
  const applyFilters = (rows) =>
    rows.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true
        return String(row[key]) === String(value)
      }),
    )

  if (type === 'recruitment') {
    const rows = applyFilters(scope(db.get('candidates'), 'createdAt', from, to))
    const hired = rows.filter((r) => r.status === 'hired').length
    return {
      meta,
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'fullName', label: 'Nomzod' },
        { key: 'profession', label: 'Kasb' },
        { key: 'experienceYears', label: 'Tajriba', align: 'right', format: (v) => `${v} yil` },
        { key: 'vacancyTitle', label: 'Vakansiya' },
        { key: 'recruiterName', label: 'Rekruter' },
        { key: 'source', label: 'Manba' },
        { key: 'status', label: 'Holat', format: (v) => candidateStatus.label(v) },
        { key: 'createdAt', label: 'Sana', format: formatDate },
      ],
      rows,
      summary: [
        { label: 'Jami nomzod', value: formatNumber(rows.length) },
        { label: 'Ishga olindi', value: formatNumber(hired) },
        { label: 'Rad etildi', value: formatNumber(rows.filter((r) => r.status === 'rejected').length) },
        { label: 'Konversiya', value: formatPercent(rows.length ? (hired / rows.length) * 100 : 0) },
      ],
      chart: Object.entries(countBy(rows, (r) => r.source)).map(([name, value]) => ({ name, value })),
    }
  }

  if (type === 'employees') {
    const rows = applyFilters(scope(db.get('employees'), 'hiredAt', from, to))
    return {
      meta,
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'code', label: 'Tabel' },
        { key: 'fullName', label: 'Xodim' },
        { key: 'position', label: 'Lavozim' },
        { key: 'department', label: 'Bo‘lim' },
        { key: 'branch', label: 'Filial' },
        { key: 'status', label: 'Holat', format: (v) => employeeStatus.label(v) },
        { key: 'kpi', label: 'KPI', align: 'right', format: (v) => `${v}%` },
        { key: 'salary', label: 'Oylik', align: 'right', format: (v) => formatMoney(v, { compact: true }) },
        { key: 'hiredAt', label: 'Qabul sanasi', format: formatDate },
      ],
      rows,
      summary: [
        { label: 'Jami xodim', value: formatNumber(rows.filter((r) => r.status !== 'terminated').length) },
        { label: 'Bo‘limlar', value: formatNumber(unique(rows.map((r) => r.department)).length) },
        { label: 'O‘rtacha KPI', value: formatPercent(avg(rows, (r) => r.kpi)) },
        { label: 'Oylik fondi', value: formatMoney(sum(rows.filter((r) => r.status !== 'terminated'), (r) => r.salary), { compact: true }) },
      ],
      chart: Object.entries(countBy(rows.filter((r) => r.status !== 'terminated'), (r) => r.department)).map(
        ([name, value]) => ({ name, value }),
      ),
    }
  }

  if (type === 'attendance') {
    const rows = applyFilters(scope(db.get('attendance'), 'date', from, to))
    const counts = countBy(rows, (r) => r.status)
    return {
      meta,
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'date', label: 'Sana', format: formatDate },
        { key: 'fullName', label: 'Xodim' },
        { key: 'department', label: 'Bo‘lim' },
        { key: 'branch', label: 'Filial' },
        { key: 'status', label: 'Holat', format: (v) => attendanceStatus.label(v) },
        { key: 'checkIn', label: 'Kirish' },
        { key: 'checkOut', label: 'Chiqish' },
        { key: 'hours', label: 'Soat', align: 'right' },
      ],
      rows,
      summary: [
        { label: 'Yozuvlar', value: formatNumber(rows.length) },
        { label: 'Kelgan', value: formatNumber(counts.present ?? 0) },
        { label: 'Kechikkan', value: formatNumber(counts.late ?? 0) },
        {
          label: 'Davomat',
          value: formatPercent(
            rows.length ? (((counts.present ?? 0) + (counts.late ?? 0) + (counts.remote ?? 0)) / rows.length) * 100 : 0,
          ),
        },
      ],
      chart: Object.entries(counts).map(([name, value]) => ({ name: attendanceStatus.label(name), value })),
    }
  }

  if (type === 'payroll') {
    const month = filters.month ?? monthKey()
    const rows = applyFilters(db.get('payroll').filter((p) => p.month === month))
    return {
      meta,
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'fullName', label: 'Xodim' },
        { key: 'department', label: 'Bo‘lim' },
        { key: 'baseSalary', label: 'Oklad', align: 'right', format: (v) => formatMoney(v, { currency: '' }) },
        { key: 'bonus', label: 'Bonus', align: 'right', format: (v) => formatMoney(v, { currency: '' }) },
        { key: 'deductions', label: 'Ushlanma', align: 'right', format: (v) => formatMoney(v, { currency: '' }) },
        { key: 'tax', label: 'Soliq', align: 'right', format: (v) => formatMoney(v, { currency: '' }) },
        { key: 'net', label: 'Qo‘lga', align: 'right', format: (v) => formatMoney(v, { currency: '' }) },
        { key: 'status', label: 'Holat', format: (v) => payrollStatus.label(v) },
      ],
      rows,
      summary: [
        { label: 'Oy', value: month },
        { label: 'Jami to‘lov', value: formatMoney(sum(rows, (r) => r.net), { compact: true }) },
        { label: 'To‘langan', value: formatMoney(sum(rows.filter((r) => r.status === 'paid'), (r) => r.net), { compact: true }) },
        { label: 'Kutilmoqda', value: formatMoney(sum(rows.filter((r) => r.status !== 'paid'), (r) => r.net), { compact: true }) },
      ],
      chart: Object.entries(
        rows.reduce((acc, r) => {
          acc[r.department] = (acc[r.department] ?? 0) + r.net
          return acc
        }, {}),
      ).map(([name, value]) => ({ name, value })),
    }
  }

  if (type === 'kpi') {
    const month = filters.month ?? monthKey()
    const rows = applyFilters(db.get('kpi').filter((k) => k.month === month))
    return {
      meta,
      generatedAt: new Date().toISOString(),
      columns: [
        { key: 'fullName', label: 'Xodim' },
        { key: 'department', label: 'Bo‘lim' },
        { key: 'position', label: 'Lavozim' },
        { key: 'kpi', label: 'KPI', align: 'right', format: (v) => `${v}%` },
        { key: 'qualityScore', label: 'Sifat', align: 'right' },
        { key: 'disciplineScore', label: 'Intizom', align: 'right' },
        { key: 'tasksCompleted', label: 'Bajarilgan', align: 'right' },
        { key: 'coins', label: 'Coins', align: 'right', format: formatNumber },
      ],
      rows,
      summary: [
        { label: 'Oy', value: month },
        { label: 'O‘rtacha KPI', value: formatPercent(avg(rows, (r) => r.kpi)) },
        { label: '90%+ xodimlar', value: formatNumber(rows.filter((r) => r.kpi >= 90).length) },
        { label: 'Jami coins', value: formatNumber(sum(rows, (r) => r.coins)) },
      ],
      chart: Object.entries(
        rows.reduce((acc, r) => {
          acc[r.department] ??= { total: 0, count: 0 }
          acc[r.department].total += r.kpi
          acc[r.department].count += 1
          return acc
        }, {}),
      ).map(([name, v]) => ({ name, value: Math.round(v.total / v.count) })),
    }
  }

  const rows = applyFilters(scope(db.get('onboarding'), 'createdAt', from, to))
  return {
    meta,
    generatedAt: new Date().toISOString(),
    columns: [
      { key: 'fullName', label: 'Xodim' },
      { key: 'position', label: 'Lavozim' },
      { key: 'department', label: 'Bo‘lim' },
      { key: 'hrResponsibleName', label: 'HR mas’ul' },
      { key: 'stage', label: 'Bosqich', format: (v) => onboardingStage.label(v) },
      { key: 'createdAt', label: 'Boshlangan', format: formatDate },
      { key: 'targetStartDate', label: 'START sanasi', format: formatDate },
    ],
    rows,
    summary: [
      { label: 'Jami yozuv', value: formatNumber(rows.length) },
      { label: 'Yakunlangan', value: formatNumber(rows.filter((r) => r.stage === 'started').length) },
      { label: 'Jarayonda', value: formatNumber(rows.filter((r) => r.stage !== 'started').length) },
      {
        label: 'Yakunlanish',
        value: formatPercent(rows.length ? (rows.filter((r) => r.stage === 'started').length / rows.length) * 100 : 0),
      },
    ],
    chart: Object.entries(countBy(rows, (r) => r.stage)).map(([name, value]) => ({
      name: onboardingStage.label(name),
      value,
    })),
  }
}
