import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SPRING } from '@/lib/motion'

/**
 * Underlined tabs with a shared animated indicator (layoutId).
 * items: [{ value, label, count?, icon? }]
 */
export const Tabs = ({ items = [], value, onChange, className, id = 'tabs' }) => (
  <div className={cn('flex items-center gap-1 overflow-x-auto border-b border-line-soft', className)}>
    {items.map((item) => {
      const active = item.value === value
      return (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-medium transition-colors duration-200',
            active ? 'text-ink' : 'text-muted hover:text-ink-2',
          )}
        >
          {item.icon && <item.icon className="size-4" strokeWidth={2} />}
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular',
                active ? 'bg-brand/16 text-brand-2' : 'bg-white/[0.06] text-subtle',
              )}
            >
              {item.count}
            </span>
          )}
          {active && (
            <motion.span
              layoutId={`${id}-indicator`}
              transition={SPRING}
              className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-brand"
            />
          )}
        </button>
      )
    })}
  </div>
)

/** Compact pill switch for period / view selectors. */
export const SegmentedControl = ({ items = [], value, onChange, className, size = 'md', id = 'segment' }) => (
  <div
    className={cn(
      'inline-flex items-center gap-0.5 rounded-[10px] border border-line bg-surface-2/70 p-0.5',
      className,
    )}
  >
    {items.map((item) => {
      const active = item.value === value
      return (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'relative rounded-[8px] font-medium transition-colors duration-200',
            size === 'sm' ? 'px-2.5 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[12.5px]',
            active ? 'text-ink' : 'text-muted hover:text-ink-2',
          )}
        >
          {active && (
            <motion.span
              layoutId={`${id}-pill`}
              transition={SPRING}
              className="absolute inset-0 rounded-[8px] border border-line-strong bg-surface-4"
            />
          )}
          <span className="relative flex items-center gap-1.5">
            {item.icon && <item.icon className="size-3.5" strokeWidth={2} />}
            {item.label}
          </span>
        </button>
      )
    })}
  </div>
)
