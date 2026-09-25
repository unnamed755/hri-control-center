import { cn } from '@/lib/utils'
import { dictionaries } from '@/config/dictionaries'

const TONES = {
  neutral: 'bg-white/[0.055] text-ink-2 border-line-strong',
  brand: 'bg-brand/12 text-brand-2 border-brand/30',
  success: 'bg-success/12 text-success border-success/30',
  warning: 'bg-warning/12 text-warning border-warning/30',
  danger: 'bg-danger/12 text-danger border-danger/30',
  info: 'bg-info/12 text-info border-info/30',
  violet: 'bg-violet/12 text-violet border-violet/30',
  teal: 'bg-teal/12 text-teal border-teal/30',
}

const SIZES = {
  xs: 'h-5 px-1.5 text-[10.5px] gap-1',
  sm: 'h-6 px-2 text-[11px] gap-1.5',
  md: 'h-7 px-2.5 text-[11.5px] gap-1.5',
}

/**
 * One badge for every status in the app. Pass `kind` (a dictionary name) and
 * the raw value, and the label + tone come from `config/dictionaries`.
 */
export const StatusBadge = ({ kind, value, label, tone, size = 'sm', dot = true, className }) => {
  const dict = kind ? dictionaries[kind] : null
  const resolvedLabel = label ?? dict?.label(value) ?? value ?? '—'
  const resolvedTone = tone ?? dict?.tone(value) ?? 'neutral'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-medium',
        TONES[resolvedTone] ?? TONES.neutral,
        SIZES[size],
        className,
      )}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />}
      {resolvedLabel}
    </span>
  )
}

export const LiveDot = ({ tone = 'success', className, pulse = true }) => (
  <span className={cn('relative grid size-2 place-items-center', className)}>
    <span
      className={cn(
        'absolute size-2 rounded-full',
        tone === 'success' && 'bg-success',
        tone === 'danger' && 'bg-danger',
        tone === 'warning' && 'bg-warning',
        tone === 'muted' && 'bg-subtle',
      )}
    />
    {pulse && (
      <span
        className={cn(
          'absolute size-2 animate-blip rounded-full',
          tone === 'success' && 'bg-success',
          tone === 'danger' && 'bg-danger',
          tone === 'warning' && 'bg-warning',
          tone === 'muted' && 'bg-subtle',
        )}
      />
    )}
  </span>
)
