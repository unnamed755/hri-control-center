import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronsLeft, LogOut, PanelLeft, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DUR, EASE, SPRING, backdropVariants } from '@/lib/motion'
import { navigation } from '@/config/navigation'
import { appConfig } from '@/config/appConfig'
import { useUiStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useNavCounters } from '@/hooks/useNavCounters'
import { toast } from '@/store/uiStore'
import { Avatar } from '@/components/ui/Avatar'

const BADGE_TONES = {
  default: 'bg-white/[0.07] text-muted group-hover:text-ink-2',
  brand: 'bg-brand/16 text-brand-2',
  warning: 'bg-warning/16 text-warning',
  danger: 'bg-danger/16 text-danger',
  teal: 'bg-teal/16 text-teal',
  violet: 'bg-violet/16 text-violet',
}

const BrandMark = ({ collapsed }) => (
  <div className={cn('flex items-center gap-2.5 px-3.5 py-4', collapsed && 'justify-center px-0')}>
    <span className="relative grid size-9 shrink-0 place-items-center rounded-[11px] border border-brand/35 bg-gradient-to-br from-brand/28 to-brand/5">
      <span className="text-[13px] font-bold tracking-[-0.03em] text-brand-2">HRI</span>
      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-success ring-2 ring-canvas-2" />
    </span>
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: DUR.fast }}
          className="min-w-0"
        >
          <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">{appConfig.brand.product}</p>
          <p className="truncate text-[11px] text-subtle">{appConfig.brand.tagline}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const NavItem = ({ item, collapsed, badgeValue, scope = 'desktop' }) => {
  const location = useLocation()
  const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-[10px] py-2 text-[12.5px] font-medium transition-colors duration-200',
        collapsed ? 'justify-center px-0' : 'px-2.5',
        isActive ? 'text-ink' : 'text-muted hover:bg-white/[0.04] hover:text-ink-2',
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`sidebar-active-${scope}`}
          transition={SPRING}
          className="absolute inset-0 rounded-[10px] border border-brand/28 bg-brand/12"
        />
      )}
      {isActive && !collapsed && (
        <motion.span
          layoutId={`sidebar-accent-${scope}`}
          transition={SPRING}
          className="absolute -left-2.5 top-1/2 h-4.5 w-[2.5px] -translate-y-1/2 rounded-full bg-brand"
        />
      )}
      <item.icon
        className={cn('relative size-[17px] shrink-0 transition-colors', isActive ? 'text-brand-2' : 'text-subtle group-hover:text-muted')}
        strokeWidth={2}
      />
      {!collapsed && <span className="relative truncate">{item.label}</span>}
      {!collapsed && badgeValue ? (
        <span
          className={cn(
            'relative ml-auto rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular transition-colors',
            BADGE_TONES[item.tone ?? 'default'],
          )}
        >
          {badgeValue > 99 ? '99+' : badgeValue}
        </span>
      ) : null}
      {collapsed && badgeValue ? (
        <span
          className={cn(
            'absolute right-2 top-1.5 size-1.5 rounded-full',
            item.tone === 'danger' ? 'bg-danger' : item.tone === 'warning' ? 'bg-warning' : 'bg-brand',
          )}
        />
      ) : null}
    </NavLink>
  )
}

const SidebarContent = ({ collapsed, scope = 'desktop' }) => {
  const { data: counters } = useNavCounters()
  const user = useSessionStore((s) => s.user)
  const signOut = useSessionStore((s) => s.signOut)
  const signIn = useSessionStore((s) => s.signIn)

  const handleSignOut = () => {
    signOut()
    toast({
      tone: 'info',
      title: 'Demo sessiya yopildi',
      description: 'Bu DEMO — sessiya darhol qayta tiklanadi.',
    })
    setTimeout(signIn, 1200)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BrandMark collapsed={collapsed} />

      <nav className="scroll-area min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {navigation.map((section) => (
          <div key={section.id} className="mb-1.5">
            {section.title && !collapsed && (
              <p className="px-2.5 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                {section.title}
              </p>
            )}
            {section.title && collapsed && <div className="mx-auto my-3 h-px w-6 bg-line" />}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  scope={scope}
                  badgeValue={item.badge ? counters?.[item.badge] : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-2.5 py-3">
        <div className={cn('flex items-center gap-2.5 rounded-[10px] px-1.5 py-1.5', collapsed && 'justify-center px-0')}>
          <Avatar name={user?.fullName ?? 'Super Admin'} tone="var(--color-brand)" size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-ink">{user?.fullName ?? 'Super Admin'}</p>
              <p className="flex items-center gap-1 truncate text-[10.5px] text-subtle">
                <ShieldCheck className="size-3 text-success" strokeWidth={2.2} />
                {user?.roleLabel ?? 'Super Admin roli'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleSignOut}
              title="Chiqish"
              className="grid size-7 shrink-0 place-items-center rounded-[8px] text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
            >
              <LogOut className="size-4" strokeWidth={2} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={handleSignOut}
            title="Chiqish"
            className="mx-auto mt-2 grid size-8 place-items-center rounded-[9px] text-subtle transition-colors hover:bg-danger/12 hover:text-danger"
          >
            <LogOut className="size-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}

export const Sidebar = () => {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const mobileOpen = useUiStore((s) => s.sidebarMobileOpen)
  const closeMobile = useUiStore((s) => s.closeMobileSidebar)
  const { pathname } = useLocation()

  // close the mobile drawer whenever the route changes
  useEffect(() => {
    closeMobile()
  }, [pathname, closeMobile])

  return (
    <>
      {/* desktop */}
      <motion.aside
        animate={{ width: collapsed ? 74 : 248 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="relative z-30 hidden shrink-0 border-r border-line bg-canvas-2/95 md:block"
      >
        <SidebarContent collapsed={collapsed} />
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Menyuni ochish' : 'Menyuni yig‘ish'}
          className="absolute -right-3 top-[70px] z-40 grid size-6 place-items-center rounded-full border border-line-strong bg-surface-3 text-subtle shadow transition-colors hover:border-brand/50 hover:text-brand-2"
        >
          <ChevronsLeft className={cn('size-3.5 transition-transform duration-300', collapsed && 'rotate-180')} strokeWidth={2.4} />
        </button>
      </motion.aside>

      {/* mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[70] md:hidden">
            <motion.div
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={closeMobile}
              className="absolute inset-0 bg-[#03060D]/75 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: EASE }}
              className="relative h-full w-[268px] border-r border-line bg-canvas-2"
            >
              <SidebarContent collapsed={false} scope="mobile" />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export const SidebarTrigger = () => {
  const open = useUiStore((s) => s.openMobileSidebar)
  return (
    <button
      type="button"
      onClick={open}
      className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface-2 text-muted transition-colors hover:text-ink md:hidden"
      aria-label="Menyu"
    >
      <PanelLeft className="size-[17px]" strokeWidth={2} />
    </button>
  )
}
