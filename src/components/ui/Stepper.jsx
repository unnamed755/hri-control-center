import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'

/**
 * Onboarding stage progress. Horizontal on wide screens, vertical inside the
 * detail drawer. `steps`: [{ key, label, hint? }]
 */
export const Stepper = ({ steps = [], currentIndex = 0, onSelect, orientation = 'horizontal', className }) => {
  if (orientation === 'vertical') {
    return (
      <ol className={cn('relative space-y-0', className)}>
        {steps.map((step, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          const last = index === steps.length - 1
          return (
            <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-[2px] rounded-full bg-line">
                  <motion.span
                    className="block w-full rounded-full bg-brand"
                    initial={{ height: 0 }}
                    animate={{ height: done ? '100%' : '0%' }}
                    transition={{ duration: 0.45, ease: EASE, delay: index * 0.05 }}
                  />
                </span>
              )}
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(step.key, index)}
                className={cn(
                  'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border text-[10.5px] font-semibold transition-colors',
                  done && 'border-brand bg-brand text-white',
                  active && !done && 'border-brand bg-brand/15 text-brand-2',
                  !done && !active && 'border-line-strong bg-surface-2 text-subtle',
                  onSelect && 'cursor-pointer hover:border-brand/60',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
              </button>
              <div className="min-w-0 pt-0.5">
                <p className={cn('text-[12.5px] font-medium', active ? 'text-ink' : done ? 'text-ink-2' : 'text-muted')}>
                  {step.label}
                </p>
                {step.hint && <p className="mt-0.5 text-[11.5px] text-subtle">{step.hint}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const last = index === steps.length - 1
        return (
          <div key={step.key} className={cn('flex items-center', !last && 'flex-1')}>
            <button
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(step.key, index)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full border text-[11px] font-semibold transition-colors duration-300',
                  done && 'border-brand bg-brand text-white',
                  active && !done && 'border-brand bg-brand/15 text-brand-2 ring-4 ring-brand/10',
                  !done && !active && 'border-line-strong bg-surface-2 text-subtle',
                  onSelect && 'cursor-pointer',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  'max-w-[86px] text-center text-[10.5px] leading-tight',
                  active ? 'font-medium text-ink' : done ? 'text-ink-2' : 'text-subtle',
                )}
              >
                {step.label}
              </span>
            </button>
            {!last && (
              <span className="mx-1.5 mb-5 h-[2px] flex-1 rounded-full bg-line">
                <motion.span
                  className="block h-full rounded-full bg-brand"
                  initial={{ width: 0 }}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: EASE, delay: index * 0.06 }}
                />
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
