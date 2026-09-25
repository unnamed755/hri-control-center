import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DUR, EASE, fadeUp } from '@/lib/motion'

/**
 * Base surface for every panel in the product.
 * `interactive` adds the restrained hover lift used across the dashboard.
 */
export const Card = ({
  children,
  className,
  bodyClassName,
  title,
  subtitle,
  action,
  icon: Icon,
  padded = true,
  interactive = false,
  as = 'div',
  variants = fadeUp(14),
  onClick,
  ...props
}) => {
  const Component = motion[as] ?? motion.div
  return (
    <Component
      variants={variants}
      onClick={onClick}
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ duration: DUR.micro, ease: EASE }}
      className={cn(
        'panel relative flex flex-col overflow-hidden',
        interactive && 'cursor-pointer transition-colors duration-200 hover:border-brand/40',
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[9px] border border-line bg-surface-3 text-brand-2">
                <Icon className="size-4" strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-semibold text-ink">{title}</h3>
              {subtitle && <p className="mt-0.5 truncate text-[12px] text-muted">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn(padded ? 'p-5' : '', 'flex-1', bodyClassName)}>{children}</div>
    </Component>
  )
}

export const CardRow = ({ label, value, className, valueClassName }) => (
  <div className={cn('flex items-center justify-between gap-4 py-2.5', className)}>
    <span className="text-[12.5px] text-muted">{label}</span>
    <span className={cn('text-[13px] font-medium text-ink tabular', valueClassName)}>{value}</span>
  </div>
)

export const CardDivider = ({ className }) => <div className={cn('h-px w-full bg-line-soft', className)} />

export const SectionTitle = ({ children, action, className }) => (
  <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
    <h4 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{children}</h4>
    {action}
  </div>
)
