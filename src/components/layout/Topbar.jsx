import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Command, Database, RefreshCcw, Search, Settings2, ShieldCheck, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockNow, formatDateLong, weekdayName } from '@/lib/format'
import { flatNavigation } from '@/config/navigation'
import { appConfig } from '@/config/appConfig'
import { useUiStore, askConfirm, toast } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { getDemoMeta, resetDemoData } from '@/services/demoService'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { NotificationCenter } from './NotificationCenter'
import { SidebarTrigger } from './Sidebar'

const useClock = () => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])
  return now
}

export const Topbar = () => {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const user = useSessionStore((s) => s.user)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const now = useClock()

  const current = flatNavigation.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  const meta = getDemoMeta()

  const handleReset = async () => {
    const ok = await askConfirm({
      title: 'Demo ma’lumotlarini tiklash?',
      description:
        'Barcha demo o‘zgarishlar (yangi nomzodlar, onboarding, to‘lovlar) boshlang‘ich holatga qaytadi. Haqiqiy ma’lumotga ta’sir qilmaydi.',
      confirmLabel: 'Tiklash',
      tone: 'warning',
    })
    if (!ok) return
    await resetDemoData()
    toast({ tone: 'success', title: 'Demo ma’lumotlari tiklandi' })
  }

  return (
    <header className="relative z-20 flex h-15 shrink-0 items-center gap-3 border-b border-line bg-canvas-2/80 px-4 backdrop-blur-xl">
      <SidebarTrigger />

      <div className="hidden min-w-0 flex-col md:flex">
        <div className="flex items-center gap-1.5 text-[11px] text-subtle">
          <span className="truncate">{current?.section ?? 'Asosiy'}</span>
          <span className="text-faint">/</span>
          <span className="truncate font-medium text-muted">{current?.label ?? 'Control Center'}</span>
        </div>
        <p className="truncate text-[11px] text-faint">
          {weekdayName(now)}, {formatDateLong(now)} · {clockNow(now)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group ml-auto flex h-9 flex-1 items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/70 px-3 text-left transition-colors duration-200 hover:border-brand/40 hover:bg-surface-2 sm:max-w-sm"
      >
        <Search className="size-4 shrink-0 text-subtle transition-colors group-hover:text-brand-2" strokeWidth={2} />
        <span className="flex-1 truncate text-[12.5px] text-subtle">Global qidiruv…</span>
        <span className="hidden items-center gap-0.5 rounded border border-line-strong bg-surface-3 px-1.5 py-0.5 text-[10px] text-subtle sm:flex">
          <Command className="size-2.5" strokeWidth={2.4} />K
        </span>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:ml-0">
        <span className="hidden items-center gap-1.5 rounded-[9px] border border-teal/25 bg-teal/10 px-2.5 py-1.5 text-[11px] font-medium text-teal xl:flex">
          <Database className="size-3.5" strokeWidth={2.2} />
          DEMO ma’lumot
        </span>

        <button
          type="button"
          onClick={() => navigate('/ai-recommendations')}
          className="hidden size-9 place-items-center rounded-[10px] border border-violet/25 bg-violet/10 text-violet transition-colors hover:bg-violet/16 sm:grid"
          title="AI tavsiyalar"
        >
          <Sparkles className="size-[17px]" strokeWidth={2} />
        </button>

        <NotificationCenter />

        <Dropdown
          align="right"
          width="w-60"
          trigger={
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              className="flex h-9 items-center gap-2.5 rounded-[10px] border border-line bg-surface-2 pl-1.5 pr-2.5 transition-colors hover:border-brand/40"
            >
              <Avatar name={user?.fullName ?? 'Super Admin'} tone="var(--color-brand)" size="xs" />
              <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
                <span className="truncate text-[12px] font-medium text-ink">{user?.fullName ?? 'Super Admin'}</span>
                <span className="truncate text-[10px] text-subtle">{user?.role ?? 'Super Admin'}</span>
              </span>
            </motion.button>
          }
          items={[
            { label: user?.roleLabel ?? 'Super Admin roli', icon: ShieldCheck, onClick: () => {} },
            { label: `Ma’lumot manbasi: ${meta.dataSource}`, icon: Database, onClick: () => {} },
            { divider: true },
            { label: 'Ish mezonlari', icon: Settings2, onClick: () => navigate('/work-criteria') },
            { label: 'Hisobotlar', icon: CalendarDays, onClick: () => navigate('/reports') },
            { divider: true },
            { label: 'Demo ma’lumotini tiklash', icon: RefreshCcw, tone: 'danger', onClick: handleReset },
          ]}
        />
      </div>
    </header>
  )
}
