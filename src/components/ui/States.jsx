import { motion } from 'framer-motion'
import { AlertTriangle, Inbox, RefreshCw, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { scaleIn } from '@/lib/motion'
import { Button } from './Button'

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Ma’lumot topilmadi',
  description,
  action,
  compact = false,
  className,
}) => (
  <motion.div
    variants={scaleIn}
    initial="initial"
    animate="animate"
    className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16', className)}
  >
    <span className="grid size-12 place-items-center rounded-[14px] border border-line bg-surface-3 text-subtle">
      <Icon className="size-[22px]" strokeWidth={1.8} />
    </span>
    <p className="mt-4 text-[14px] font-semibold text-ink-2">{title}</p>
    {description && <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
)

export const NoResults = ({ onReset, query }) => (
  <EmptyState
    icon={SearchX}
    title="Natija topilmadi"
    description={
      query
        ? `"${query}" so‘rovi bo‘yicha mos yozuv yo‘q. Filtrlarni tozalab ko‘ring.`
        : 'Tanlangan filtrlar bo‘yicha yozuv yo‘q. Filtrlarni tozalab ko‘ring.'
    }
    action={
      onReset ? (
        <Button variant="subtle" size="sm" icon={RefreshCw} onClick={onReset}>
          Filtrlarni tozalash
        </Button>
      ) : null
    }
  />
)

export const ErrorState = ({ error, onRetry, title = 'Ma’lumotni yuklab bo‘lmadi', className }) => (
  <motion.div
    variants={scaleIn}
    initial="initial"
    animate="animate"
    className={cn('flex flex-col items-center justify-center py-14 text-center', className)}
  >
    <span className="grid size-12 place-items-center rounded-[14px] border border-danger/30 bg-danger/10 text-danger">
      <AlertTriangle className="size-[22px]" strokeWidth={1.9} />
    </span>
    <p className="mt-4 text-[14px] font-semibold text-ink">{title}</p>
    <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted">
      {error?.message ?? 'Kutilmagan xatolik yuz berdi.'}
    </p>
    {onRetry && (
      <Button className="mt-5" variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
        Qayta urinish
      </Button>
    )}
  </motion.div>
)

/** Thin progress line shown while a filtered refetch is in flight. */
export const RefetchBar = ({ active }) => (
  <div className="relative h-px w-full overflow-hidden bg-transparent">
    {active && (
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-brand to-transparent"
        animate={{ x: ['-100%', '320%'] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
      />
    )}
  </div>
)
