import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DUR, EASE } from '@/lib/motion'
import { useCountUp } from '@/hooks/useCountUp'
import { formatDelta, formatNumber } from '@/lib/format'

const TONES = {
  brand: { fg: 'text-brand-2', bg: 'bg-brand/12', ring: 'group-hover:border-brand/45', glow: 'rgb(59 124 255 / 0.16)' },
  success: { fg: 'text-success', bg: 'bg-success/12', ring: 'group-hover:border-success/45', glow: 'rgb(34 201 154 / 0.16)' },
  warning: { fg: 'text-warning', bg: 'bg-warning/12', ring: 'group-hover:border-warning/45', glow: 'rgb(247 177 60 / 0.16)' },
  danger: { fg: 'text-danger', bg: 'bg-danger/12', ring: 'group-hover:border-danger/45', glow: 'rgb(242 99 127 / 0.16)' },
  info: { fg: 'text-info', bg: 'bg-info/12', ring: 'group-hover:border-info/45', glow: 'rgb(79 168 255 / 0.16)' },
  violet: { fg: 'text-violet', bg: 'bg-violet/12', ring: 'group-hover:border-violet/45', glow: 'rgb(154 123 255 / 0.16)' },
  teal: { fg: 'text-teal', bg: 'bg-teal/12', ring: 'group-hover:border-teal/45', glow: 'rgb(44 201 192 / 0.16)' },
}

const cardVariants = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: EASE } },
}

/**
 * KPI tile: label, animated value, trend pill, contextual icon.
 * The number counts up on mount and re-animates when the underlying data
 * changes, which is how a demo action becomes visible on the dashboard.
 */
export const StatCard = ({
  label,
  value = 0,
  suffix = '',
  prefix = '',
  format,
  change,
  hint,
  icon: Icon,
  tone = 'brand',
  onClick,
  delay = 0,
  compact = false,
  className,
  children,
}) => {
  const palette = TONES[tone] ?? TONES.brand
  const animated = useCountUp(value, { duration: 1100, delay: delay * 1000 })
  const display = format ? format(animated) : formatNumber(Math.round(animated))
  const TrendIcon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus
  const trendTone =
    change > 0 ? 'text-success bg-success/10' : change < 0 ? 'text-danger bg-danger/10' : 'text-muted bg-white/5'

  return (
    <motion.div
      variants={cardVariants}
      onClick={onClick}
      whileHover={{ y: -4 }}
      transition={{ duration: DUR.micro, ease: EASE }}
      className={cn(
        'group panel relative overflow-hidden',
        compact ? 'p-4' : 'p-[18px]',
        onClick && 'cursor-pointer',
        palette.ring,
        'transition-colors duration-200',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-14 -top-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: palette.glow }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-medium uppercase tracking-[0.1em] text-subtle">{label}</p>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className={cn('font-semibold tracking-[-0.03em] text-ink tabular', compact ? 'text-[22px]' : 'text-[27px]')}>
              {prefix}
              {display}
            </span>
            {suffix && <span className="text-[13px] font-medium text-muted">{suffix}</span>}
          </div>
        </div>
        {Icon && (
          <span
            className={cn(
              'grid shrink-0 place-items-center rounded-[11px] border border-line transition-transform duration-300 group-hover:scale-105',
              palette.bg,
              palette.fg,
              compact ? 'size-9' : 'size-10',
            )}
          >
            <Icon className={compact ? 'size-[17px]' : 'size-[19px]'} strokeWidth={2} />
          </span>
        )}
      </div>

      {(change !== undefined && change !== null) || hint ? (
        <div className="relative mt-3.5 flex items-center gap-2">
          {change !== undefined && change !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular',
                trendTone,
              )}
            >
              <TrendIcon className="size-3" strokeWidth={2.6} />
              {formatDelta(change)}
            </span>
          )}
          {hint && <span className="truncate text-[11.5px] text-subtle">{hint}</span>}
        </div>
      ) : null}

      {children && <div className="relative mt-3">{children}</div>}
    </motion.div>
  )
}

/** Compact inline metric used inside panels. */
export const MetricTile = ({ label, value, tone = 'brand', icon: Icon, hint, className }) => {
  const palette = TONES[tone] ?? TONES.brand
  return (
    <div className={cn('rounded-[12px] border border-line bg-surface-2/70 p-3.5', className)}>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className={cn('grid size-7 place-items-center rounded-[8px]', palette.bg, palette.fg)}>
            <Icon className="size-[15px]" strokeWidth={2} />
          </span>
        )}
        <span className="truncate text-[11.5px] font-medium uppercase tracking-[0.08em] text-subtle">{label}</span>
      </div>
      <p className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-ink tabular">{value}</p>
      {hint && <p className="mt-0.5 text-[11.5px] text-subtle">{hint}</p>}
    </div>
  )
}
