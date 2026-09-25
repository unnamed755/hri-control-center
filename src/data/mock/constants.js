/** Static reference data for the DEMO company "HRI Retail Group". */

export const COMPANY = {
  name: 'HRI Retail Group',
  legalName: '"HRI RETAIL GROUP" MChJ',
  inn: '3** *** ***',
  hq: 'Toshkent, Yunusobod tumani',
}

export const BRANCHES = [
  { id: 'br-hq', name: 'Bosh ofis', city: 'Toshkent', type: 'office', address: 'Yunusobod, Amir Temur 108' },
  { id: 'br-chi', name: 'Chilonzor', city: 'Toshkent', type: 'store', address: 'Chilonzor 9-kvartal' },
  { id: 'br-yun', name: 'Yunusobod', city: 'Toshkent', type: 'store', address: 'Yunusobod 19-mavze' },
  { id: 'br-ser', name: 'Sergeli', city: 'Toshkent', type: 'store', address: 'Sergeli 7-mavze' },
  { id: 'br-mir', name: 'Mirzo Ulug‘bek', city: 'Toshkent', type: 'store', address: 'Buyuk Ipak Yo‘li 45' },
  { id: 'br-yak', name: 'Yakkasaroy', city: 'Toshkent', type: 'store', address: 'Shota Rustaveli 24' },
  { id: 'br-olm', name: 'Olmazor', city: 'Toshkent', type: 'store', address: 'Olmazor, Do‘rmon 12' },
  { id: 'br-sam', name: 'Samarqand', city: 'Samarqand', type: 'store', address: 'Registon 3' },
  { id: 'br-bux', name: 'Buxoro', city: 'Buxoro', type: 'store', address: 'Mustaqillik 18' },
  { id: 'br-nam', name: 'Namangan', city: 'Namangan', type: 'store', address: 'Navoiy 51' },
  { id: 'br-skl', name: 'Markaziy ombor', city: 'Toshkent', type: 'warehouse', address: 'Sergeli, Logistika 4' },
]

export const BRANCH_NAMES = BRANCHES.map((b) => b.name)
export const STORE_BRANCHES = BRANCHES.filter((b) => b.type === 'store').map((b) => b.name)
export const OFFICES = [
  { id: 'of-hq', name: 'Bosh ofis · Yunusobod', branch: 'Bosh ofis', capacity: 120 },
  { id: 'of-it', name: 'IT hub · Mirzo Ulug‘bek', branch: 'Mirzo Ulug‘bek', capacity: 45 },
  { id: 'of-sam', name: 'Samarqand filial ofisi', branch: 'Samarqand', capacity: 30 },
]

export const DEPARTMENTS = [
  { id: 'dp-exec', name: 'Boshqaruv', color: 'var(--color-brand-2)' },
  { id: 'dp-sales', name: 'Savdo', color: 'var(--color-brand)' },
  { id: 'dp-logistics', name: 'Logistika', color: 'var(--color-teal)' },
  { id: 'dp-it', name: 'IT', color: 'var(--color-violet)' },
  { id: 'dp-finance', name: 'Moliya', color: 'var(--color-success)' },
  { id: 'dp-hr', name: 'HR', color: 'var(--color-warning)' },
  { id: 'dp-marketing', name: 'Marketing', color: 'var(--color-info)' },
  { id: 'dp-service', name: 'Xizmat ko‘rsatish', color: 'var(--color-amber)' },
  { id: 'dp-security', name: 'Xavfsizlik', color: 'var(--color-danger)' },
]

export const DEPARTMENT_NAMES = DEPARTMENTS.map((d) => d.name)

export const departmentColor = (name) =>
  DEPARTMENTS.find((d) => d.name === name)?.color ?? 'var(--color-brand)'

/** position pools per department: [title, level weightings, salary band] */
export const POSITIONS = {
  Boshqaruv: [
    { title: 'Bosh direktor', band: [42000000, 48000000] },
    { title: 'HR Owner', band: [26000000, 30000000] },
    { title: 'Operatsion direktor', band: [24000000, 30000000] },
  ],
  Savdo: [
    { title: 'Kassir', band: [3200000, 4600000] },
    { title: 'Sotuvchi', band: [3400000, 5200000] },
    { title: 'Savdo menejeri', band: [5500000, 9000000] },
    { title: 'Filial boshqaruvchisi', band: [9500000, 14000000] },
    { title: 'Zal administratori', band: [4800000, 6800000] },
  ],
  Logistika: [
    { title: 'Haydovchi', band: [4200000, 6500000] },
    { title: 'Omborchi', band: [3600000, 5200000] },
    { title: 'Yig‘uvchi', band: [3200000, 4400000] },
    { title: 'Logist', band: [5800000, 8500000] },
    { title: 'Kuryer', band: [3400000, 5000000] },
  ],
  IT: [
    { title: 'Frontend dasturchi', band: [9000000, 18000000] },
    { title: 'Backend dasturchi', band: [10000000, 20000000] },
    { title: 'Tizim administratori', band: [7000000, 12000000] },
    { title: 'Ma’lumot tahlilchisi', band: [8000000, 14000000] },
    { title: 'Texnik qo‘llab-quvvatlash', band: [4500000, 7000000] },
  ],
  Moliya: [
    { title: 'Buxgalter', band: [6000000, 10000000] },
    { title: 'Bosh buxgalter', band: [12000000, 18000000] },
    { title: 'Moliyaviy tahlilchi', band: [7500000, 12500000] },
    { title: 'Kassa nazoratchisi', band: [5000000, 7500000] },
  ],
  HR: [
    { title: 'HR mutaxassis', band: [5500000, 8500000] },
    { title: 'Rekruter', band: [5000000, 8000000] },
    { title: 'HR bo‘lim boshlig‘i', band: [13000000, 19000000] },
    { title: 'Onboarding mutaxassisi', band: [5200000, 7800000] },
    { title: 'Ta’lim va rivojlanish mutaxassisi', band: [6000000, 9000000] },
  ],
  Marketing: [
    { title: 'Marketolog', band: [5500000, 9000000] },
    { title: 'Kontent menejer', band: [4500000, 7000000] },
    { title: 'Brend menejer', band: [8000000, 13000000] },
    { title: 'Dizayner', band: [5500000, 9500000] },
  ],
  'Xizmat ko‘rsatish': [
    { title: 'Call-markaz operatori', band: [3400000, 4800000] },
    { title: 'Mijozlar bilan ishlash mutaxassisi', band: [4200000, 6400000] },
    { title: 'Barista', band: [3200000, 4500000] },
    { title: 'Oshpaz', band: [4000000, 6000000] },
  ],
  Xavfsizlik: [
    { title: 'Qo‘riqchi', band: [3200000, 4400000] },
    { title: 'Xavfsizlik nazoratchisi', band: [4800000, 7000000] },
    { title: 'Video kuzatuv operatori', band: [4200000, 6000000] },
  ],
}

/** Professions used by the recruitment funnel (candidate-facing wording). */
export const PROFESSIONS = [
  { title: 'Kassir', department: 'Savdo', band: [3200000, 4600000] },
  { title: 'Sotuvchi', department: 'Savdo', band: [3400000, 5200000] },
  { title: 'Savdo menejeri', department: 'Savdo', band: [5500000, 9000000] },
  { title: 'Haydovchi', department: 'Logistika', band: [4200000, 6500000] },
  { title: 'Omborchi', department: 'Logistika', band: [3600000, 5200000] },
  { title: 'Kuryer', department: 'Logistika', band: [3400000, 5000000] },
  { title: 'Logist', department: 'Logistika', band: [5800000, 8500000] },
  { title: 'Buxgalter', department: 'Moliya', band: [6000000, 10000000] },
  { title: 'Frontend dasturchi', department: 'IT', band: [9000000, 18000000] },
  { title: 'Backend dasturchi', department: 'IT', band: [10000000, 20000000] },
  { title: 'Texnik qo‘llab-quvvatlash', department: 'IT', band: [4500000, 7000000] },
  { title: 'Call-markaz operatori', department: 'Xizmat ko‘rsatish', band: [3400000, 4800000] },
  { title: 'Barista', department: 'Xizmat ko‘rsatish', band: [3200000, 4500000] },
  { title: 'Oshpaz', department: 'Xizmat ko‘rsatish', band: [4000000, 6000000] },
  { title: 'Marketolog', department: 'Marketing', band: [5500000, 9000000] },
  { title: 'Dizayner', department: 'Marketing', band: [5500000, 9500000] },
  { title: 'Qo‘riqchi', department: 'Xavfsizlik', band: [3200000, 4400000] },
  { title: 'HR mutaxassis', department: 'HR', band: [5500000, 8500000] },
  { title: 'Zal administratori', department: 'Savdo', band: [4800000, 6800000] },
  { title: 'Yig‘uvchi', department: 'Logistika', band: [3200000, 4400000] },
]

export const PROFESSION_NAMES = PROFESSIONS.map((p) => p.title)

export const SOURCES = [
  { id: 'src-olx', name: 'OLX.uz', kind: 'board' },
  { id: 'src-hh', name: 'hh.uz', kind: 'board' },
  { id: 'src-ishuz', name: 'Ish.uz', kind: 'board' },
  { id: 'src-tg', name: 'Telegram kanal', kind: 'social' },
  { id: 'src-ig', name: 'Instagram', kind: 'social' },
  { id: 'src-ref', name: 'Xodim tavsiyasi', kind: 'referral' },
  { id: 'src-site', name: 'Korporativ sayt', kind: 'own' },
  { id: 'src-fair', name: 'Ish yarmarkasi', kind: 'offline' },
]

export const SOURCE_NAMES = SOURCES.map((s) => s.name)

export const LEVELS = ['intern', 'junior', 'middle', 'senior', 'lead']

export const EDUCATION = [
  'O‘rta ta’lim',
  'O‘rta maxsus',
  'Bakalavr — TDIU',
  'Bakalavr — TATU',
  'Bakalavr — O‘zMU',
  'Magistr — TDIU',
  'Kasb-hunar kolleji',
]

export const FIRST_NAMES_M = [
  'Azizbek', 'Jasur', 'Bekzod', 'Sardor', 'Ulug‘bek', 'Rustam', 'Farrux', 'Shohruh', 'Dilshod',
  'Nodirbek', 'Islom', 'Javohir', 'Otabek', 'Doniyor', 'Anvar', 'Kamron', 'Temur', 'Mirjalol',
  'Shahzod', 'Ravshan', 'Alisher', 'Muhammadali', 'Sanjar', 'Eldor', 'Behruz', 'Aziz', 'Mustafo',
  'Xusniddin', 'Akmal', 'Nurbek', 'Oybek', 'Davron', 'Zafar', 'Iskandar', 'Rauf', 'Saidazim',
]

export const FIRST_NAMES_F = [
  'Zilola', 'Madina', 'Gulnora', 'Nilufar', 'Dilnoza', 'Shahnoza', 'Kamola', 'Sevinch', 'Marjona',
  'Aziza', 'Feruza', 'Nargiza', 'Mohira', 'Diyora', 'Zarina', 'Malika', 'Umida', 'Lobar', 'Sabina',
  'Ozoda', 'Nafisa', 'Rayhona', 'Sitora', 'Xurshida', 'Muattar', 'Gulbahor', 'Zebo',
]

export const LAST_NAMES = [
  'Karimov', 'Rahimov', 'Yusupov', 'Abdullayev', 'Toshmatov', 'Xolmatov', 'Ergashev', 'Sultonov',
  'Nazarov', 'Qodirov', 'Islomov', 'Maxmudov', 'Saidov', 'Jo‘rayev', 'Tursunov', 'Umarov',
  'Ibragimov', 'Norqulov', 'Shukurov', 'Alimov', 'Bobojonov', 'Ahmedov', 'Mirzayev', 'Yo‘ldoshev',
  'Sattorov', 'Xudoyberdiyev', 'Rasulov', 'Salimov', 'Hamidov', 'Nurmatov', 'G‘aniyev', 'Tojiyev',
]

export const AVATAR_TONES = [
  'var(--color-brand)',
  'var(--color-teal)',
  'var(--color-violet)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-info)',
  'var(--color-amber)',
]

export const CAMERA_ZONES = ['Kassa zonasi', 'Savdo zali', 'Kirish/chiqish', 'Ombor', 'Orqa eshik', 'Avtoturargoh']

export const DOCUMENT_TYPES = [
  'Passport nusxasi',
  'INPS / STIR',
  'Ish daftarchasi',
  'Diplom nusxasi',
  'Tibbiy ma’lumotnoma',
  'Shartnoma',
  'Bank plastik kartasi',
]
