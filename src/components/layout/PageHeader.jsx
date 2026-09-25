import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'

/**
 * Consistent page title block: icon, title, contextual subtitle, meta chips
 * and the page-level actions on the right.
 */
export const PageHeader = ({ title, subtitle, icon: Icon, actions, meta, tabs, className }) => (
  <motion.div variants={fadeUp(10)} className={cn('mb-5', className)}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span className="grid size-11 shrink-0 place-items-center rounded-[13px] border border-line bg-gradient-to-br from-surface-4 to-surface-2 text-brand-2">
            <Icon className="size-[21px]" strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-muted">{subtitle}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {tabs && <div className="mt-4">{tabs}</div>}
  </motion.div>
)

const META_TONES = {
  muted: 'text-subtle',
  brand: 'text-brand-2',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  teal: 'text-teal',
  violet: 'text-violet',
}

export const HeaderMeta = ({ icon: Icon, label, value, tone = 'muted' }) => (
  <span className="flex items-center gap-1.5 text-[11.5px]">
    {Icon && <Icon className={cn('size-3.5', META_TONES[tone] ?? META_TONES.muted)} strokeWidth={2} />}
    <span className="text-subtle">{label}</span>
    <span className="font-semibold text-ink-2 tabular">{value}</span>
  </span>
)
