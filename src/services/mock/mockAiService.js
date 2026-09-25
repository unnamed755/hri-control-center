import { db } from './db'
import { latency } from './tableUtils'
import { avg, countBy, sum, unique } from '@/lib/utils'
import { formatMoney, monthKey } from '@/lib/format'
import { ACTIVE_CANDIDATE_STATUSES } from '@/config/dictionaries'

/**
 * "AI Tavsiyalar" — rule-based insights computed from the live demo data.
 * They change as the demo state changes, which is what makes the page feel
 * connected. Tomorrow this is where a real recommendation service plugs in.
 */
export const getInsights = async () => {
  await latency(0.7)
  const employees = db.get('employees').filter((e) => e.status !== 'terminated')
  const candidates = db.get('candidates')
  const vacancies = db.get('vacancies')
  const onboarding = db.get('onboarding')
  const tasks = db.get('tasks')
  const payroll = db.get('payroll').filter((p) => p.month === monthKey())
  const kpi = db.get('kpi').filter((k) => k.month === monthKey())
  const attendance = db.get('attendance')
  const cameras = db.get('cameras')

  const insights = []
  const add = (insight) => insights.push({ id: `ai-${insights.length + 1}`, ...insight })

  // --- recruitment ---------------------------------------------------------
  const urgent = vacancies.filter(
    (v) => v.status === 'active' && new Date(v.deadline).getTime() - Date.now() < 7 * 86400000,
  )
  if (urgent.length) {
    add({
      category: 'Ishga olish',
      module: 'recruitment',
      impact: 'high',
      confidence: 92,
      title: `${urgent.length} ta vakansiya muddati bir hafta ichida tugaydi`,
      summary: urgent
        .slice(0, 3)
        .map((v) => `${v.title} · ${v.branch}`)
        .join(', '),
      detail:
        'Ushbu vakansiyalar bo‘yicha saralash tezligini oshirish yoki muddatni qayta belgilash tavsiya etiladi. Aks holda filiallarda shtat yetishmovchiligi yuzaga keladi.',
      recommendation: 'Rekruterga kunlik saralash rejasini oshirishni topshiring va zaxira nomzodlar bilan bog‘laning.',
      metric: { label: 'Ochiq o‘rinlar', value: urgent.reduce((a, v) => a + v.openings, 0) },
      actions: [{ label: 'Vakansiyalarni ochish', to: '/vacancies' }],
    })
  }

  const stale = candidates.filter(
    (c) => c.status === 'new' && Date.now() - new Date(c.createdAt).getTime() > 3 * 86400000,
  )
  if (stale.length >= 3) {
    add({
      category: 'Ishga olish',
      module: 'recruitment',
      impact: 'medium',
      confidence: 87,
      title: `${stale.length} ta yangi nomzod 3 kundan beri saralanmagan`,
      summary: 'Javob kechikishi nomzodlarning boshqa kompaniyaga o‘tishiga olib keladi.',
      detail:
        'Tahlil ko‘rsatishicha, arizadan keyingi 48 soat ichida bog‘lanilgan nomzodlarning suhbatga kelish ehtimoli 2 baravar yuqori.',
      recommendation: 'Saralash navbatini rekruterlar orasida qayta taqsimlang.',
      metric: { label: 'Kutayotgan nomzod', value: stale.length },
      actions: [{ label: 'Nomzodlarni ko‘rish', to: '/candidates' }],
    })
  }

  const bestSource = Object.entries(
    candidates.reduce((acc, c) => {
      acc[c.source] ??= { total: 0, hired: 0 }
      acc[c.source].total += 1
      if (c.status === 'hired') acc[c.source].hired += 1
      return acc
    }, {}),
  )
    .map(([source, v]) => ({ source, ...v, rate: v.total ? (v.hired / v.total) * 100 : 0 }))
    .filter((s) => s.total >= 3)
    .sort((a, b) => b.rate - a.rate)[0]

  if (bestSource) {
    add({
      category: 'Manbalar',
      module: 'recruitment',
      impact: 'medium',
      confidence: 81,
      title: `Eng samarali manba — ${bestSource.source}`,
      summary: `Konversiya ${Math.round(bestSource.rate)}% (${bestSource.hired}/${bestSource.total}).`,
      detail:
        'Ushbu manbadan kelgan nomzodlar boshqa kanallarga nisbatan yuqori konversiya bermoqda. Byudjetni qayta taqsimlash mumkin.',
      recommendation: 'Reklama byudjetining kamida 30 foizini shu kanalga yo‘naltiring.',
      metric: { label: 'Konversiya', value: `${Math.round(bestSource.rate)}%` },
      actions: [{ label: 'Recruiter Web', to: '/recruiter-web' }],
    })
  }

  // --- onboarding ----------------------------------------------------------
  const ready = onboarding.filter((o) => o.stage === 'ready')
  if (ready.length) {
    add({
      category: 'Onboarding',
      module: 'onboarding',
      impact: 'high',
      confidence: 95,
      title: `${ready.length} nafar nomzod START bosqichiga tayyor`,
      summary: ready
        .slice(0, 3)
        .map((o) => o.fullName)
        .join(', '),
      detail: 'Checklist yakunlangan. START tugmasi bosilgach ular avtomatik xodimlar ro‘yxatiga va payrollga o‘tadi.',
      recommendation: 'Onboarding sahifasida START bosqichini yakunlang.',
      metric: { label: 'Tayyor', value: ready.length },
      actions: [{ label: 'Onboardingga o‘tish', to: '/onboarding' }],
    })
  }

  const stuck = onboarding.filter(
    (o) => o.stage !== 'started' && Date.now() - new Date(o.createdAt).getTime() > 14 * 86400000,
  )
  if (stuck.length) {
    add({
      category: 'Onboarding',
      module: 'onboarding',
      impact: 'medium',
      confidence: 84,
      title: `${stuck.length} ta onboarding 14 kundan ortiq davom etmoqda`,
      summary: 'Uzoq cho‘zilgan moslashuv yangi xodimning ketish xavfini oshiradi.',
      detail: 'Odatda hujjatlar bosqichi eng ko‘p vaqt oladi — skanerlangan hujjatlarni oldindan so‘rash vaqtni qisqartiradi.',
      recommendation: 'HR mas’ulni almashtiring yoki hujjatlar bosqichini ustuvor qiling.',
      metric: { label: 'Kechikkan', value: stuck.length },
      actions: [{ label: 'Onboarding', to: '/onboarding' }],
    })
  }

  // --- performance / attendance -------------------------------------------
  const lowKpi = kpi.filter((k) => k.kpi < 65)
  if (lowKpi.length) {
    add({
      category: 'Samaradorlik',
      module: 'kpi',
      impact: 'high',
      confidence: 89,
      title: `${lowKpi.length} nafar xodim KPI 65% dan past`,
      summary: 'Ular bilan individual ish rejasi tuzish tavsiya etiladi.',
      detail: 'Past KPI ko‘pincha davomat intizomi va vazifalarni bajarish ko‘rsatkichi bilan bog‘liq.',
      recommendation: 'Samaradorlik sahifasida "E’tibor talab qiladi" ro‘yxatini ko‘rib chiqing.',
      metric: { label: 'Xodimlar', value: lowKpi.length },
      actions: [{ label: 'Samaradorlik', to: '/performance' }],
    })
  }

  const lateProne = employees.filter((e) => e.lateCount >= 4)
  if (lateProne.length >= 3) {
    add({
      category: 'Intizom',
      module: 'attendance',
      impact: 'medium',
      confidence: 78,
      title: `${lateProne.length} nafar xodimda kechikish me’yordan yuqori`,
      summary: 'Oy davomida 4 va undan ko‘p marta kechikish qayd etilgan.',
      detail: `Eng ko‘p kechikish ${
        Object.entries(countBy(lateProne, (e) => e.branch)).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      } filialida kuzatilmoqda.`,
      recommendation: 'Smena boshlanish vaqtini qayta ko‘rib chiqing yoki intizom suhbati o‘tkazing.',
      metric: { label: 'Xodimlar', value: lateProne.length },
      actions: [{ label: 'Davomat', to: '/attendance' }],
    })
  }

  // --- payroll -------------------------------------------------------------
  const pendingPayroll = payroll.filter((p) => p.status !== 'paid')
  if (pendingPayroll.length) {
    add({
      category: 'Moliya',
      module: 'payroll',
      impact: 'high',
      confidence: 97,
      title: `${pendingPayroll.length} ta to‘lov hali yakunlanmagan`,
      summary: `Jami ${formatMoney(sum(pendingPayroll, (p) => p.net), { compact: true })} to‘lov kutilmoqda.`,
      detail: 'Oy yopilishidan oldin barcha to‘lovlarni tasdiqlash hisobot aniqligini ta’minlaydi.',
      recommendation: 'Payroll sahifasida "Barchasini to‘lash" amalini bajaring.',
      metric: { label: 'Summa', value: formatMoney(sum(pendingPayroll, (p) => p.net), { compact: true }) },
      actions: [{ label: 'Payroll', to: '/payroll' }],
    })
  }

  // --- tasks / infrastructure ---------------------------------------------
  const overdue = tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate).getTime() < Date.now())
  if (overdue.length) {
    add({
      category: 'HR boshqaruv',
      module: 'tasks',
      impact: 'medium',
      confidence: 99,
      title: `${overdue.length} ta HR vazifa muddati o‘tgan`,
      summary: overdue
        .slice(0, 2)
        .map((t) => t.title)
        .join(' · '),
      detail: 'Muddati o‘tgan vazifalar bo‘lim samaradorligi ko‘rsatkichiga salbiy ta’sir qiladi.',
      recommendation: 'Mas’ullarni qayta taqsimlang yoki muddatni yangilang.',
      metric: { label: 'Vazifalar', value: overdue.length },
      actions: [{ label: 'HR vazifalar', to: '/hr-tasks' }],
    })
  }

  const offlineCameras = cameras.filter((c) => c.status !== 'online')
  if (offlineCameras.length) {
    add({
      category: 'Infratuzilma',
      module: 'employees',
      impact: 'low',
      confidence: 90,
      title: `${offlineCameras.length} ta kamera ishlamayapti`,
      summary: unique(offlineCameras.map((c) => c.branch)).join(', '),
      detail: 'Kamera va turniket ma’lumotlari davomat aniqligini ta’minlaydi — uzilish hisobotda bo‘shliq qoldiradi.',
      recommendation: 'Texnik xizmatga so‘rov yuboring va davomatni qo‘lda tekshiring.',
      metric: { label: 'Qurilmalar', value: offlineCameras.length },
      actions: [{ label: 'Kameralar', to: '/camera' }],
    })
  }

  // --- strategic -----------------------------------------------------------
  const avgAttendance = Math.round(
    (attendance.filter((a) => ['present', 'late', 'remote'].includes(a.status)).length / Math.max(1, attendance.length)) *
      100,
  )
  add({
    category: 'Strategiya',
    module: 'analytics',
    impact: 'medium',
    confidence: 74,
    title: 'Shtat o‘sishi va oylik fondi muvozanati',
    summary: `${employees.length} xodim · ${formatMoney(sum(employees, (e) => e.salary), { compact: true })} oylik fondi`,
    detail: `Davomat ${avgAttendance}%, o‘rtacha KPI ${Math.round(avg(kpi, (k) => k.kpi))}%. Shtatni kengaytirishdan oldin mavjud samaradorlikni oshirish 8–12% tejamkorlik beradi.`,
    recommendation: 'Yangi shtat ochishdan avval past KPI segmentini rivojlantirish rejasini ishga tushiring.',
    metric: { label: 'Faol nomzodlar', value: candidates.filter((c) => ACTIVE_CANDIDATE_STATUSES.includes(c.status)).length },
    actions: [{ label: 'HR Analitika', to: '/hr-analytics' }],
  })

  return insights.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 }
    return rank[a.impact] - rank[b.impact] || b.confidence - a.confidence
  })
}

export const getInsightSummary = async () => {
  const insights = await getInsights()
  return {
    total: insights.length,
    high: insights.filter((i) => i.impact === 'high').length,
    medium: insights.filter((i) => i.impact === 'medium').length,
    low: insights.filter((i) => i.impact === 'low').length,
    avgConfidence: Math.round(avg(insights, (i) => i.confidence)),
    categories: unique(insights.map((i) => i.category)),
  }
}
