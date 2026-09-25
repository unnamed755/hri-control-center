import { daysAgo, daysAhead } from './seedRandom'

const HR_TEAM = [
  { id: 'emp-003', name: 'Nazarova Nilufar', role: 'HR bo‘lim boshlig‘i' },
  { id: 'emp-004', name: 'Nazarov Rauf', role: 'Yetakchi rekruter' },
  { id: 'emp-005', name: 'Abdullayeva Madina', role: 'Onboarding mutaxassisi' },
  { id: 'emp-006', name: 'Yusupova Kamola', role: 'HR mutaxassis' },
  { id: 'emp-007', name: 'Ergashev Otabek', role: 'Ta’lim mutaxassisi' },
  { id: 'emp-008', name: 'Islomova Sabina', role: 'Rekruter' },
  { id: 'emp-009', name: 'Tursunov Bekzod', role: 'Junior rekruter' },
  { id: 'emp-010', name: 'Rahimov Anvar', role: 'Bosh buxgalter' },
]

/**
 * HR tasks are issued by the HR Department Head and routed to an HR function.
 * `module` keeps the domain boundary explicit (recruitment ≠ payroll).
 */
const TASK_SEED = [
  ['Chilonzor filiali uchun 6 kassir yopilishi', 'Vakansiya bo‘yicha kunlik 8 ta saralash qo‘ng‘irog‘i va haftada 4 suhbat belgilash.', 'recruitment', 'urgent', 'in_progress', 'emp-004', -3],
  ['Sentabr oyi payroll hisobotini yakunlash', 'Bonus va jarimalarni tasdiqlash, moliya bo‘limiga topshirish.', 'payroll', 'high', 'in_progress', 'emp-010', 2],
  ['Yangi xodimlar uchun orientatsiya kuni', '12 ta yangi xodim uchun kompaniya bilan tanishtiruv sessiyasi.', 'onboarding', 'high', 'pending', 'emp-005', 4],
  ['Turniket ma’lumotlarini davomat bilan solishtirish', 'Kamera va turniket loglari orasidagi farqlarni tekshirish.', 'employees', 'medium', 'pending', 'emp-006', 5],
  ['IT bo‘limi uchun texnik suhbat jadvali', 'Frontend va backend nomzodlari uchun texnik suhbatlarni muvofiqlashtirish.', 'recruitment', 'high', 'in_progress', 'emp-008', 1],
  ['Kassirlar uchun xizmat standarti treningi', '3 filialda smenadan keyin 2 soatlik trening.', 'employees', 'medium', 'pending', 'emp-007', 7],
  ['Q3 KPI natijalarini rahbariyatga taqdim etish', 'Bo‘limlar bo‘yicha KPI taqqoslama slaydlari.', 'analytics', 'high', 'pending', 'emp-003', 6],
  ['Onboarding hujjatlarini raqamlashtirish', 'Skan qilingan hujjatlarni tizimga yuklash va tekshirish.', 'onboarding', 'medium', 'in_progress', 'emp-005', 9],
  ['Ta’til grafigini tasdiqlash', 'Oktabr–dekabr oralig‘idagi ta’til navbatini kelishish.', 'employees', 'low', 'pending', 'emp-006', 12],
  ['Bo‘shagan xodimlar bilan exit-suhbat', '6 nafar bo‘shagan xodim bilan sabablarni aniqlash.', 'analytics', 'medium', 'overdue_candidate', 'emp-006', -6],
  ['Samarqand filiali uchun rekruter tayinlash', 'Mintaqaviy rekrutingni Sabinaga o‘tkazish.', 'recruitment', 'medium', 'pending', 'emp-003', 8],
  ['Ish mezonlari vaznini qayta ko‘rib chiqish', 'Davomat va KPI vaznlarini yangi siyosatga moslashtirish.', 'analytics', 'low', 'pending', 'emp-003', 15],
  ['Kuryerlar uchun mehnat shartnomalarini yangilash', '14 ta shartnoma muddati tugaydi.', 'payroll', 'high', 'overdue_candidate', 'emp-010', -2],
  ['Recruiter Web dan kelgan nomzodlarni tozalash', 'Dublikat va mos kelmaydigan arizalarni arxivlash.', 'recruitment', 'low', 'in_progress', 'emp-009', 3],
  ['Tibbiy ko‘rikni tashkil qilish', 'Savdo bo‘limi xodimlari uchun yillik tibbiy ko‘rik.', 'employees', 'medium', 'pending', 'emp-006', 18],
  ['Yangi filial uchun kadrlar rejasi', 'Olmazor filiali uchun 14 lavozimli shtat jadvali.', 'recruitment', 'high', 'pending', 'emp-003', 11],
  ['Coins tizimi bo‘yicha xodimlarni xabardor qilish', 'Yangi coins almashish qoidalarini tushuntirish.', 'employees', 'low', 'completed', 'emp-007', -8],
  ['Avgust payroll yopildi', 'Barcha to‘lovlar amalga oshirildi va hisobot arxivlandi.', 'payroll', 'high', 'completed', 'emp-010', -20],
  ['Onboarding checklistini yangilash', 'Turniket kartasi bandi qo‘shildi.', 'onboarding', 'medium', 'completed', 'emp-005', -12],
  ['hh.uz integratsiyasi uchun talablar ro‘yxati', 'Recruiter Web uchun API talablari hujjatlashtirildi.', 'recruitment', 'medium', 'completed', 'emp-004', -15],
  ['Xavfsizlik bo‘limi smena grafigi', 'Tungi smenalar uchun 4 qo‘shimcha xodim taqsimlandi.', 'employees', 'medium', 'completed', 'emp-006', -5],
  ['Sotuvchilar uchun motivatsiya tizimi', 'Yangi bonus sxemasi taqdimoti tayyorlandi.', 'analytics', 'low', 'completed', 'emp-003', -9],
]

export const generateTasks = (rng) =>
  TASK_SEED.map(([title, description, module, priority, rawStatus, assigneeId, dueOffset], i) => {
    const assignee = HR_TEAM.find((h) => h.id === assigneeId) ?? HR_TEAM[0]
    const status = rawStatus === 'overdue_candidate' ? rng.weighted({ pending: 6, in_progress: 4 }) : rawStatus
    const dueDate = dueOffset >= 0 ? daysAhead(dueOffset) : daysAgo(-dueOffset)
    return {
      id: `tsk-${String(i + 1).padStart(3, '0')}`,
      code: `HRT-${String(i + 1).padStart(3, '0')}`,
      title,
      description,
      module,
      priority,
      status,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeRole: assignee.role,
      department: 'HR',
      createdBy: 'Nazarova Nilufar',
      createdById: 'emp-003',
      createdAt: daysAgo(rng.int(2, 30)),
      dueDate,
      completedAt: status === 'completed' ? daysAgo(Math.max(1, -dueOffset - rng.int(0, 3))) : null,
      progress: status === 'completed' ? 100 : status === 'in_progress' ? rng.int(25, 85) : 0,
      commentsCount: rng.int(0, 7),
      attachments: rng.int(0, 3),
    }
  })
