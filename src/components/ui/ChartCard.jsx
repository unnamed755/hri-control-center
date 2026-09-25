import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DUR, EASE, fadeUp } from '@/lib/motion'
import { SkeletonChart } from './Skeleton'
import { EmptyState, ErrorState } from './States'
import { ChartLegend } from '@/components/charts/ChartKit'

/**
 * Chart container with a consistent header, legend and state handling.
 * Charts only render once data is present, so recharts never animates from
 * an empty dataset (which looks broken).
 */
export const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  action,
  legend,
  children,
  loading = false,
  error = null,
  onRetry,
  isEmpty = false,
  emptyText = 'Bu davr uchun ma’lumot yo‘q',
  height = 240,
  className,
  bodyClassName,
  footer,
}) => (
  <motion.div
    variants={fadeUp(16)}
    whileHover={{ y: -2 }}
    transition={{ duration: DUR.micro, ease: EASE }}
    className={cn('panel flex flex-col overflow-hidden', className)}
  >
    <div className="flex items-start justify-between gap-4 px-5 pt-4.5">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[9px] border border-line bg-surface-3 text-brand-2">
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[13.5px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-[11.5px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>

    {legend && <ChartLegend items={legend} className="px-5 pt-3" />}

    <div className={cn('px-2 pb-3 pt-3', bodyClassName)} style={{ minHeight: height + 24 }}>
      {loading ? (
        <div className="px-3 pt-2">
          <SkeletonChart height={height} />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} className="py-8" />
      ) : isEmpty ? (
        <EmptyState title={emptyText} compact />
      ) : (
        children
      )}
    </div>

    {footer && <div className="border-t border-line-soft px-5 py-3">{footer}</div>}
  </motion.div>
)
