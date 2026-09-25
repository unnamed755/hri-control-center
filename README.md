# HRI · Control Center

**Jonli demo:** https://unnamed755.github.io/hri-control-center/

Korporativ HR boshqaruv platformasining **to‘liq interaktiv DEMO versiyasi**.
Barcha modullar bitta demo ma’lumot bazasidan ishlaydi: rekrutingdagi o‘zgarish
onboardingda, xodimlarda, payrollda va analitikada bir zumda aks etadi.

> Bugun: `UI → mock servis → demo baza`
> Ertaga: `UI → API servis → real backend` — **UI kodi o‘zgarmaydi.**

---

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview
npm run deploy   # build + gh-pages branchga chiqarish
```

Stack: **React 19 · Vite 7 · Tailwind CSS v4 · framer-motion 12 · recharts 2 ·
react-router 7 · zustand 5** (JavaScript, TypeScript emas).

---

## Backendga ulash (ertaga)

Butun almashtirish **bitta konfiguratsiya faylida**:

```bash
# .env
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://api.sizning-domeningiz.uz
```

`src/services/index.js` shu qiymatga qarab har bir domen uchun mock yoki HTTP
implementatsiyani eksport qiladi:

```js
const useApi = appConfig.dataSource === 'api'
export const employeesService = useApi ? apiEmployees : mockEmployees
```

Sahifalar va komponentlar **faqat `@/services` dan** import qiladi — mock
modullarga to‘g‘ridan-to‘g‘ri hech qayerda murojaat yo‘q. Shuning uchun real
API ulanganda birorta sahifa, jadval yoki forma o‘zgartirilmaydi.

Endpoint nomlari `src/services/api/*.js` da REST konvensiyasida yozilgan
(`GET /employees`, `POST /candidates/:id/status`, …). Agar backend boshqa
format qaytarsa — `src/services/api/_resource.js` dagi `mapList` adapteri
o‘zgartiriladi, UI emas.

---

## Arxitektura

```
src/
├── config/          appConfig (data source switch), navigation, dictionaries
├── types/           domen shartnomalari (JSDoc typedef)
├── data/mock/       DEMO ma’lumot generatori (deterministik seed)
├── services/
│   ├── mock/        demo baza (db.js) + har bir domen uchun mock servis
│   ├── api/         REST servislar — bugun chaqirilmaydi, ertaga yoqiladi
│   ├── http/        apiClient (base URL, timeout, xatolar, auth token)
│   ├── workflow/    domenlararo orkestratsiya (hrWorkflow)
│   └── index.js     SERVIS REESTRI — mock/api almashtirish nuqtasi
├── hooks/           useQuery, useMutation, useTableState, useCountUp …
├── store/           uiStore (toast, confirm, layout), sessionStore (demo user)
├── components/      layout · ui (30+ komponent) · charts
└── pages/           22 ta modul sahifasi
```

### Ma’lumot oqimi

1. Sahifa `useQuery(kalit, () => service.getX(params))` chaqiradi.
2. Servis `params` ni qabul qiladi (`q`, `filters`, `sortBy`, `page`, …) — bu
   aynan REST endpoint qabul qiladigan shakl.
3. Mutatsiya (`acceptCandidate`, `payAll`, …) demo bazani o‘zgartiradi va
   `invalidate([...])` chaqiradi.
4. O‘sha kalitni tinglayotgan barcha `useQuery` avtomatik yangilanadi —
   dashboard, sidebar badge’lari, analitika bir vaqtda qayta hisoblanadi.

---

## Biznes oqimi (to‘liq ishlaydi)

```
Tashqi manba → Recruiter Web → Rekruter → Nomzod
   → Suhbat → Qabul → Onboarding (7 bosqich) → START
   → Xodim → Payroll + KPI + Davomat → HR Analitika → Hisobotlar
```

Amalda tekshirish mumkin:

1. **Recruiter Web** → ariza yonidagi **“Bazaga”** → nomzod bazaga o‘tadi.
2. **Nomzodlar** → nomzodni oching → **Saralashga** → **Qabul qilish**.
   Shu zahoti onboarding yozuvi ochiladi va HR vazifa yaratiladi.
3. **Onboarding** → checklistni to‘ldiring yoki **START** bosing.
4. Nomzod **Xodimlar** ro‘yxatida paydo bo‘ladi, **Payroll** yozuvi va joriy oy
   **KPI** yozuvi avtomatik yaratiladi, vakansiyaning bo‘sh o‘rni kamayadi.
5. **Control Center** va **HR Analitika** raqamlari darhol yangilanadi.

Domenlar aralashtirilmagan: har bir servis faqat o‘z kolleksiyasini yozadi,
domenlararo mantiq esa `services/workflow/hrWorkflow.js` da.

---

## Modullar (22 ta route)

| Route | Modul |
|---|---|
| `/dashboard` | Control Center — 8 KPI, pipeline, o‘sish, davomat, payroll, KPI taqsimoti |
| `/ai-recommendations` | AI Tavsiyalar — jonli ma’lumotdan hisoblangan tavsiyalar |
| `/employees`, `/employees/:id` | Xodimlar ro‘yxati va 7 bo‘limli profil |
| `/cashiers` | Kassirlar — filiallar bo‘yicha guruhlangan |
| `/employee-register` | Xodimlar reestri — saralash, filtr, sahifalash, eksport |
| `/org-structure` | Tashkiliy struktura (CEO → HR Owner → HR Head → modullar) |
| `/performance` | Samaradorlik — KPI dinamikasi, bo‘limlar, top va e’tibor ro‘yxati |
| `/attendance` | Davomat — kunlik trend, bo‘limlar, to‘liq jadval |
| `/camera` | Kamera monitoringi (DEMO — jonli efir yo‘q) |
| `/office-attendance` | Ofis davomati — kelish/ketish, bandlik |
| `/kpi-coins` | KPI & Coins |
| `/interviews` | Suhbatlar — belgilash, ko‘chirish, natija kiritish |
| `/payroll` | Payroll — oy tanlash, to‘lash, batafsil hisob-kitob |
| `/work-criteria` | Ish mezoni — vazn, target va jonli qiymat |
| `/candidates` | Nomzodlar — pipeline, filtrlar, drawer, CRUD |
| `/vacancies` | Vakansiyalar — kartalar/jadval, yaratish, arxivlash |
| `/recruiter` | Rekruter ish maydoni |
| `/recruiter-web` | Tashqi arizalar oqimi va import |
| `/onboarding` | Onboarding — bosqichlar, checklist, START |
| `/hr-tasks` | HR vazifalar — doska va jadval |
| `/hr-analytics` | HR Analitika — barcha modullar agregatsiyasi |
| `/reports` | Hisobotlar — 6 tur, preview va CSV eksport |

---

## DEMO ma’lumot

- Deterministik seed (`appConfig.demo.seed`) — har yuklashda bir xil raqamlar.
- ~84 xodim, 72+ nomzod, 18 vakansiya, 14 onboarding, 6 oylik payroll va KPI,
  21 kunlik davomat, 23 HR vazifa, 26 tashqi ariza, 30+ kamera.
- Barcha ismlar, telefonlar, filiallar va oyliklar **o‘ylab topilgan** —
  hech qanday real shaxsiy ma’lumot ishlatilmagan.
- O‘zgarishlar `localStorage` da saqlanadi (sahifa yangilansa ham qoladi).
  Topbar → profil menyusi → **“Demo ma’lumotini tiklash”** boshlang‘ich holatga
  qaytaradi. Sxema o‘zgarsa `appConfig.demo.persistVersion` ni oshiring.

---

## Dizayn va animatsiya

- Deep-navy enterprise palitra, `src/index.css` dagi `@theme` tokenlari.
- Yagona motion tili: `src/lib/motion.js` (bitta easing, bitta stagger ritmi).
- Sahifa kirishi → KPI kartalar ketma-ket → raqamlar sanaladi → grafiklar
  chiziladi → jadval qatorlari paydo bo‘ladi.
- Har bir sahifada **loading (skeleton) / empty / error** holatlari bor.
- Jadval qatorlarida chiqish animatsiyasi ataylab ishlatilmagan — filtrlashda
  qator DOM’da “osilib” qolmasligi uchun.

## Qidiruv

Qidiruv bir nechta tokenni birga tekshiradi va raqamlarni aqlli ajratadi:

- `haydovchi 3` → kasbi “Haydovchi”, tajribasi 3 yil bo‘lgan nomzodlar
  (qisqa raqam telefon ichidagi raqamga tushmaydi).
- `998 90 432` kabi uzun raqamlar telefon bo‘yicha qidiradi.
