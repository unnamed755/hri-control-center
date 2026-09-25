import {
  LayoutDashboard,
  Sparkles,
  Users,
  Wallet2,
  ClipboardList,
  Network,
  TrendingUp,
  CalendarCheck2,
  Video,
  Building2,
  Coins,
  MessagesSquare,
  Banknote,
  SlidersHorizontal,
  UserSearch,
  BriefcaseBusiness,
  UserRoundCog,
  Globe2,
  Rocket,
  ListChecks,
  PieChart,
  FileBarChart2,
} from 'lucide-react'

/**
 * Sidebar hierarchy mirrors the HR panel reference.
 * `badge` names a counter resolved by `useNavCounters()` — no hardcoded numbers.
 */
export const navigation = [
  {
    id: 'core',
    items: [
      { to: '/dashboard', label: 'Control Center', icon: LayoutDashboard },
      { to: '/ai-recommendations', label: 'AI Tavsiyalar', icon: Sparkles, badge: 'aiInsights', tone: 'violet' },
    ],
  },
  {
    id: 'staff',
    title: 'XODIMLAR',
    items: [
      { to: '/employees', label: 'Xodimlar', icon: Users, badge: 'employees' },
      { to: '/cashiers', label: 'Kassirlar', icon: Wallet2, badge: 'cashiers' },
      { to: '/employee-register', label: 'Xodimlar reestri', icon: ClipboardList },
      { to: '/org-structure', label: 'Org struktura', icon: Network },
      { to: '/performance', label: 'Samaradorlik', icon: TrendingUp },
      { to: '/attendance', label: 'Davomat', icon: CalendarCheck2 },
      { to: '/camera', label: 'Kamera', icon: Video, badge: 'camerasOffline', tone: 'danger' },
      { to: '/office-attendance', label: 'Ofis davomat', icon: Building2 },
      { to: '/kpi-coins', label: 'KPI & Coins', icon: Coins },
      { to: '/interviews', label: 'Suhbatlar', icon: MessagesSquare, badge: 'interviewsUpcoming' },
    ],
  },
  {
    id: 'finance',
    title: 'MOLIYA',
    items: [
      { to: '/payroll', label: 'Payroll', icon: Banknote, badge: 'payrollPending', tone: 'warning' },
      { to: '/work-criteria', label: 'Ish mezoni', icon: SlidersHorizontal },
    ],
  },
  {
    id: 'hiring',
    title: 'ISHGA OLISH',
    items: [
      { to: '/candidates', label: 'Nomzodlar', icon: UserSearch, badge: 'candidatesActive' },
      { to: '/vacancies', label: 'Vakansiyalar', icon: BriefcaseBusiness, badge: 'vacanciesOpen' },
      { to: '/recruiter', label: 'Rauf — Rekruter', icon: UserRoundCog },
      { to: '/recruiter-web', label: 'Recruiter Web', icon: Globe2, badge: 'externalNew', tone: 'teal' },
    ],
  },
  {
    id: 'hr-management',
    title: 'HR BOSHQARUV',
    items: [
      { to: '/onboarding', label: 'Onboarding', icon: Rocket, badge: 'onboardingActive' },
      { to: '/hr-tasks', label: 'HR vazifalar', icon: ListChecks, badge: 'tasksOpen', tone: 'warning' },
      { to: '/hr-analytics', label: 'HR Analitika', icon: PieChart },
      { to: '/reports', label: 'Hisobotlar', icon: FileBarChart2 },
    ],
  },
]

export const flatNavigation = navigation.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title ?? 'Asosiy' })),
)

/** Extra searchable destinations that are not sidebar entries. */
export const extraDestinations = [
  { to: '/employees', label: 'Xodim profili', section: 'XODIMLAR', hint: 'Xodimlar ro‘yxatidan tanlang' },
]
