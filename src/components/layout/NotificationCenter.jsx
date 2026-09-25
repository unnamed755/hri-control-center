import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Banknote,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  Rocket,
  TrendingUp,
  UserPlus,
  UserRound,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dropdownVariants } from '@/lib/motion'
import { relativeTime } from '@/lib/format'
import { QK } from '@/lib/queryBus'
import { notificationsService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useUiStore } from '@/store/uiStore'
import { Button, IconButton } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/States'

const TYPE_ICON = {
  candidate: UserPlus,
  vacancy: CalendarClock,
  interview: CalendarClock,
  onboarding: Rocket,
  employee: UserRound,
  payroll: Banknote,
  task: CheckCheck,
  kpi: TrendingUp,
  camera: Video,
}

const SEVERITY = {
  info: 'text-info bg-info/12',
  success: 'text-success bg-success/12',
  warning: 'text-warning bg-warning/12',
  danger: 'text-danger bg-danger/12',
}

export const NotificationCenter = () => {
  const open = useUiStore((s) => s.notificationsOpen)
  const setOpen = useUiStore((s) => s.setNotificationsOpen)
  const navigate = useNavigate()
  const ref = useRef(null)

  const { data, loading } = useQuery(QK.notifications, () => notificationsService.getNotifications({ limit: 30 }), {
    deps: ['notifications'],
  })

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, setOpen])

  const unread = data?.unread ?? 0
  const rows = data?.rows ?? []

  const handleOpen = async (notification) => {
    await notificationsService.markRead(notification.id)
    if (notification.link) {
      setOpen(false)
      navigate(notification.link)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'relative grid size-9 place-items-center rounded-[10px] border transition-colors duration-200',
          open ? 'border-brand/50 bg-brand/12 text-brand-2' : 'border-line bg-surface-2 text-muted hover:text-ink',
        )}
        aria-label="Bildirishnomalar"
      >
        <Bell className="size-[17px]" strokeWidth={2} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white ring-2 ring-canvas"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 z-50 mt-2 flex max-h-[min(560px,75vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[14px] border border-line-strong bg-surface-3/98 shadow-float backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Bildirishnomalar</p>
                <p className="text-[11px] text-subtle">{unread > 0 ? `${unread} o‘qilmagan` : 'Barchasi o‘qilgan'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {unread > 0 && (
                  <Button variant="ghost" size="xs" icon={CheckCheck} onClick={() => notificationsService.markAllRead()}>
                    O‘qilgan
                  </Button>
                )}
                <IconButton
                  variant="ghost"
                  size="icon-sm"
                  icon={BellOff}
                  title="Tozalash"
                  onClick={() => notificationsService.clearAll()}
                />
              </div>
            </div>

            <div className="scroll-area flex-1 overflow-y-auto">
              {loading && !rows.length ? (
                <div className="p-4">
                  <SkeletonList rows={4} />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState icon={Bell} title="Bildirishnoma yo‘q" description="Yangi harakatlar shu yerda ko‘rinadi." compact />
              ) : (
                <div className="divide-y divide-line-soft/70">
                  {rows.map((row) => {
                    const Icon = TYPE_ICON[row.type] ?? Bell
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => handleOpen(row)}
                        className={cn(
                          'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.035]',
                          !row.read && 'bg-brand/[0.045]',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-8 shrink-0 place-items-center rounded-[9px]',
                            SEVERITY[row.severity] ?? SEVERITY.info,
                          )}
                        >
                          <Icon className="size-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{row.title}</span>
                            {!row.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{row.message}</span>
                          <span className="mt-1 block text-[10.5px] text-faint">{relativeTime(row.createdAt)}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
