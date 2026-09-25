import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[11.5px]',
  md: 'size-9.5 text-[12.5px]',
  lg: 'size-12 text-[15px]',
  xl: 'size-16 text-[19px]',
  '2xl': 'size-20 text-[24px]',
}

/**
 * Initial-based avatar. The demo has no photos on purpose — a tinted monogram
 * reads better in a dense enterprise table and never breaks.
 */
export const Avatar = ({ name, tone = 'var(--color-brand)', size = 'md', className, ring = true, status }) => (
  <span className={cn('relative inline-grid shrink-0 place-items-center', className)}>
    <span
      className={cn(
        'grid place-items-center rounded-full font-semibold tracking-[-0.02em] uppercase',
        SIZES[size],
        ring && 'ring-1 ring-inset',
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${tone} 18%, transparent)`,
        color: tone,
        boxShadow: ring ? `inset 0 0 0 1px color-mix(in oklab, ${tone} 34%, transparent)` : undefined,
      }}
    >
      {initials(name) || '—'}
    </span>
    {status && (
      <span
        className={cn(
          'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface',
          status === 'active' && 'bg-success',
          status === 'probation' && 'bg-warning',
          status === 'leave' && 'bg-info',
          status === 'terminated' && 'bg-subtle',
        )}
      />
    )}
  </span>
)

export const AvatarGroup = ({ people = [], max = 4, size = 'sm' }) => {
  const visible = people.slice(0, max)
  const rest = people.length - visible.length
  return (
    <div className="flex items-center">
      {visible.map((person, i) => (
        <span key={person.id ?? i} className={cn(i > 0 && '-ml-2')}>
          <Avatar name={person.fullName} tone={person.avatarTone} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className={cn(
            '-ml-2 grid place-items-center rounded-full border border-line bg-surface-3 font-semibold text-muted',
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  )
}

/** Name + position pair used in every table's first column. */
export const PersonCell = ({ name, subtitle, tone, size = 'md', status, extra }) => (
  <div className="flex min-w-0 items-center gap-2.5">
    <Avatar name={name} tone={tone} size={size} status={status} />
    <div className="min-w-0">
      <p className="truncate text-[13px] font-medium text-ink">{name}</p>
      {subtitle && <p className="truncate text-[11.5px] text-subtle">{subtitle}</p>}
    </div>
    {extra}
  </div>
)
