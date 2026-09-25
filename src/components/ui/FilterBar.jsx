import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { SearchInput } from './Input'

/**
 * Standard filter row: search on the left, filter controls in the middle,
 * actions on the right, and a reset chip that only appears when something is
 * actually filtered.
 */
export const FilterBar = ({
  query,
  onQueryChange,
  placeholder,
  children,
  actions,
  activeCount = 0,
  onReset,
  className,
  resultLabel,
}) => (
  <div className={cn('flex flex-col gap-3 border-b border-line-soft px-4 py-3.5 xl:flex-row xl:items-center', className)}>
    {onQueryChange && (
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder={placeholder ?? 'Ism, telefon, lavozim bo‘yicha qidirish...'}
        className="w-full xl:max-w-xs"
      />
    )}

    <div className="flex flex-1 flex-wrap items-center gap-2">
      {children}
      <AnimatePresence>
        {activeCount > 0 && onReset && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
          >
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>
              Tozalash
              <span className="ml-0.5 rounded-full bg-brand/16 px-1.5 text-[10.5px] font-semibold text-brand-2">
                {activeCount}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <div className="flex items-center gap-2">
      {resultLabel && <span className="hidden text-[12px] text-subtle tabular lg:block">{resultLabel}</span>}
      {actions}
    </div>
  </div>
)

export const FilterGroupIcon = () => (
  <span className="hidden size-8.5 place-items-center rounded-[9px] border border-line bg-surface-2 text-subtle xl:grid">
    <SlidersHorizontal className="size-4" strokeWidth={2} />
  </span>
)
