import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'

const TONES = {
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  violet: 'bg-violet',
  teal: 'bg-teal',
}

export const toneForValue = (value) => {
  if (value >= 90) return 'success'
  if (value >= 75) return 'brand'
  if (value >= 60) return 'warning'
  return 'danger'
}

export const ProgressBar = ({
  value = 0,
  max = 100,
  tone,
  size = 'md',
  label,
  showValue = false,
  className,
  delay = 0,
}) => {
  const pct = Math.max(0, Math.min(100, (Number(value) / (max || 100)) * 100))
  const resolvedTone = tone ?? toneForValue(pct)
  const height = size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2'

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && <span className="truncate text-[11.5px] text-muted">{label}</span>}
          {showValue && <span className="text-[11.5px] font-semibold text-ink-2 tabular">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-white/[0.06]', height)}>
        <motion.div
          className={cn('h-full rounded-full', TONES[resolvedTone] ?? TONES.brand)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.85, ease: EASE, delay }}
        />
      </div>
    </div>
  )
}

/** Multi-segment bar (e.g. attendance split) */
export const SegmentBar = ({ segments = [], className, height = 'h-2.5' }) => {
  const total = segments.reduce((a, s) => a + (s.value || 0), 0) || 1
  return (
    <div className={cn('flex w-full overflow-hidden rounded-full bg-white/[0.05]', height, className)}>
      {segments.map((segment, i) => (
        <motion.div
          key={segment.key ?? i}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ backgroundColor: segment.color }}
          initial={{ width: 0 }}
          animate={{ width: `${((segment.value || 0) / total) * 100}%` }}
          transition={{ duration: 0.8, ease: EASE, delay: i * 0.06 }}
          title={`${segment.label ?? segment.key}: ${segment.value}`}
        />
      ))}
    </div>
  )
}

/** Radial KPI ring with an animated stroke. */
export const KpiRing = ({ value = 0, size = 84, thickness = 7, tone, label, sublabel, delay = 0 }) => {
  const pct = Math.max(0, Math.min(100, Number(value)))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const resolvedTone = tone ?? toneForValue(pct)
  const color = {
    brand: 'var(--color-brand)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    info: 'var(--color-info)',
    violet: 'var(--color-violet)',
    teal: 'var(--color-teal)',
  }[resolvedTone]

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
          transition={{ duration: 1.05, ease: EASE, delay }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="text-[16px] font-semibold text-ink tabular">{label ?? `${Math.round(pct)}%`}</span>
        {sublabel && <span className="text-[10px] uppercase tracking-[0.1em] text-subtle">{sublabel}</span>}
      </div>
    </div>
  )
}
