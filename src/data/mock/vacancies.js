import { daysAgo, daysAhead } from './seedRandom'
import { BRANCH_NAMES, PROFESSIONS, STORE_BRANCHES } from './constants'

const REQUIREMENTS = {
  Kassir: ['Kassa apparati bilan ishlash', '1C bilan tanishlik', 'Mijoz bilan muloyim muomala', 'Smenali ish grafigi'],
  Sotuvchi: ['Savdo tajribasi 1 yildan ortiq', 'Mahsulot bilimi', 'Jamoada ishlash', 'Faol muloqot'],
  Haydovchi: ['B/C toifa guvohnomasi', 'Toshkent yo‘llarini bilish', 'Yuk hujjatlari bilan ishlash', '3 yil staj'],
  Omborchi: ['Ombor hisobi', 'WMS tizimi', 'Jismoniy chidamlilik'],
  Kuryer: ['Shaxsiy transport', 'Mobil ilova bilan ishlash', 'Punktuallik'],
  Logist: ['Marshrutlarni optimallashtirish', 'Excel / 1C', 'Ingliz tili — o‘rta'],
  Buxgalter: ['Buxgalteriya hisobi', '1C: Buxgalteriya', 'Soliq hisobotlari'],
  'Frontend dasturchi': ['React 18+', 'TypeScript', 'REST API integratsiyasi', 'Git flow'],
  'Backend dasturchi': ['Node.js yoki .NET', 'PostgreSQL', 'Docker', 'REST/GraphQL'],
  'Texnik qo‘llab-quvvatlash': ['Windows/Linux asoslari', 'Tarmoq asoslari', 'Mijozga xizmat'],
  'Call-markaz operatori': ['Aniq nutq', 'CRM bilan ishlash', 'Stressga chidamlilik'],
  Barista: ['Espresso mashinasi', 'Latte art', 'Sanitariya qoidalari'],
  Oshpaz: ['Sanitariya sertifikati', 'Milliy va Yevropa taomlari', 'Xom ashyo hisobi'],
  Marketolog: ['Performance marketing', 'Analitika (GA4)', 'Kontent rejasi'],
  Dizayner: ['Figma', 'Brend gaydlari', 'Bosma maketlar'],
  'Qo‘riqchi': ['Jismoniy tayyorgarlik', 'Video kuzatuv tizimi', 'Tungi smena'],
  'HR mutaxassis': ['Kadrlar hujjatlari', 'Mehnat kodeksi', 'HRM tizimlari'],
  'Savdo menejeri': ['B2B savdo tajribasi', 'Muzokara olib borish', 'CRM'],
  'Zal administratori': ['Jamoani boshqarish', 'Merchandising', 'Hisobot tayyorlash'],
  'Yig‘uvchi': ['Buyurtmani yig‘ish tezligi', 'Skaner bilan ishlash'],
}

const RESPONSIBILITIES = [
  'Kunlik rejani bajarish va hisobot berish',
  'Mijozlar bilan sifatli muloqot qilish',
  'Ichki standart va reglamentlarga rioya qilish',
  'Bo‘lim rahbari bilan muvofiqlashtirilgan holda ishlash',
]

export const generateVacancies = (rng, { recruiters }) => {
  const plan = [
    { profession: 'Kassir', status: 'active', openings: 6, priority: 'urgent' },
    { profession: 'Sotuvchi', status: 'active', openings: 4, priority: 'high' },
    { profession: 'Haydovchi', status: 'active', openings: 3, priority: 'high' },
    { profession: 'Kuryer', status: 'active', openings: 4, priority: 'medium' },
    { profession: 'Omborchi', status: 'active', openings: 2, priority: 'medium' },
    { profession: 'Call-markaz operatori', status: 'active', openings: 3, priority: 'high' },
    { profession: 'Frontend dasturchi', status: 'active', openings: 1, priority: 'high' },
    { profession: 'Backend dasturchi', status: 'active', openings: 1, priority: 'medium' },
    { profession: 'Buxgalter', status: 'active', openings: 1, priority: 'medium' },
    { profession: 'Marketolog', status: 'active', openings: 1, priority: 'low' },
    { profession: 'Zal administratori', status: 'active', openings: 2, priority: 'medium' },
    { profession: 'Barista', status: 'active', openings: 2, priority: 'low' },
    { profession: 'Qo‘riqchi', status: 'paused', openings: 2, priority: 'low' },
    { profession: 'Dizayner', status: 'paused', openings: 1, priority: 'low' },
    { profession: 'Logist', status: 'closed', openings: 1, priority: 'medium' },
    { profession: 'Oshpaz', status: 'closed', openings: 1, priority: 'low' },
    { profession: 'Savdo menejeri', status: 'closed', openings: 2, priority: 'high' },
    { profession: 'HR mutaxassis', status: 'archived', openings: 1, priority: 'low' },
  ]

  return plan.map((item, i) => {
    const profession = PROFESSIONS.find((p) => p.title === item.profession)
    const level = rng.weighted({ junior: 5, middle: 5, senior: 2, intern: 1 })
    const createdAt = daysAgo(item.status === 'active' ? rng.int(3, 55) : rng.int(60, 180))
    const recruiter = rng.pick(
      recruiters.filter((r) => r.specialisation.includes(profession.department)).length
        ? recruiters.filter((r) => r.specialisation.includes(profession.department))
        : recruiters,
    )
    const branch =
      profession.department === 'IT' || profession.department === 'Moliya' || profession.department === 'Marketing'
        ? 'Bosh ofis'
        : profession.department === 'Logistika'
          ? rng.pick(['Markaziy ombor', 'Sergeli', 'Chilonzor'])
          : rng.pick(STORE_BRANCHES)

    return {
      id: `vac-${String(i + 1).padStart(3, '0')}`,
      code: `VAC-${2026}-${String(i + 1).padStart(3, '0')}`,
      title: profession.title,
      department: profession.department,
      branch: BRANCH_NAMES.includes(branch) ? branch : 'Bosh ofis',
      level,
      openings: item.openings,
      filled: item.status === 'closed' ? item.openings : rng.int(0, Math.max(0, item.openings - 1)),
      salaryFrom: profession.band[0],
      salaryTo: profession.band[1],
      status: item.status,
      priority: item.priority,
      recruiterId: recruiter.id,
      hiringManagerId: 'emp-011',
      createdAt,
      deadline:
        item.status === 'active'
          ? daysAhead(rng.int(-4, 45))
          : daysAgo(rng.int(5, 40)),
      closedAt: item.status === 'closed' || item.status === 'archived' ? daysAgo(rng.int(2, 40)) : null,
      employmentType: rng.weighted({ full: 8, part: 2, contract: 1 }),
      schedule: rng.pick(['09:00 – 18:00', 'Smenali 2/2', 'Smenali 5/2', 'Moslashuvchan']),
      description: `${profession.title} lavozimiga ${profession.department} bo‘limi uchun xodim qabul qilinadi. Ish joyi: ${branch}.`,
      responsibilities: RESPONSIBILITIES,
      requirements: REQUIREMENTS[profession.title] ?? ['Tegishli sohada tajriba', 'Mas’uliyatlilik', 'Jamoada ishlash'],
      benefits: ['Oylik bonus tizimi', 'Korporativ ta’lim', 'Tibbiy sug‘urta', 'Xodimlar uchun chegirma'],
      views: rng.int(120, 2400),
    }
  })
}
