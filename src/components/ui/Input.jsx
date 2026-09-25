import { forwardRef, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dropdownVariants } from '@/lib/motion'

const BASE =
  'w-full rounded-[10px] border border-line-strong bg-surface-2/80 text-[13px] text-ink transition-colors duration-200 placeholder:text-subtle hover:border-line-strong/80 focus:border-brand/60 focus:bg-surface-2 focus:outline-none'

export const Input = forwardRef(function Input({ className, icon: Icon, suffix, ...props }, ref) {
  return (
    <div className="relative w-full">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" strokeWidth={2} />
      )}
      <input
        ref={ref}
        className={cn(BASE, 'h-10 px-3', Icon && 'pl-9', suffix && 'pr-10', className)}
        {...props}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-subtle">{suffix}</span>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(BASE, 'resize-none px-3 py-2.5 leading-relaxed', className)} {...props} />
})

export const Field = ({ label, hint, error, required, children, className, htmlFor }) => (
  <label htmlFor={htmlFor} className={cn('block', className)}>
    {label && (
      <span className="mb-1.5 flex items-center gap-1 text-[11.5px] font-medium uppercase tracking-[0.07em] text-subtle">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
    )}
    {children}
    {error ? (
      <span className="mt-1.5 block text-[11.5px] text-danger">{error}</span>
    ) : (
      hint && <span className="mt-1.5 block text-[11.5px] text-subtle">{hint}</span>
    )}
  </label>
)

export const SearchInput = ({ value, onChange, placeholder = 'Qidirish...', className, onClear }) => (
  <div className={cn('relative', className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" strokeWidth={2} />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(BASE, 'h-10 pl-9 pr-9')}
    />
    <AnimatePresence>
      {value && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-subtle transition-colors hover:bg-white/10 hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2.4} />
        </motion.button>
      )}
    </AnimatePresence>
  </div>
)

/**
 * Animated single-select. Options: [{value, label, count?}]
 * `allLabel` adds an explicit "all" entry that clears the filter.
 */
export const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Tanlang',
  allLabel,
  className,
  size = 'md',
  align = 'left',
  disabled = false,
  searchable = false,
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = allLabel ? [{ value: 'all', label: allLabel }, ...options] : options
  const filtered = searchable && query ? items.filter((o) => String(o.label).toLowerCase().includes(query.toLowerCase())) : items
  const current = items.find((o) => String(o.value) === String(value ?? 'all'))
  const height = size === 'sm' ? 'h-8.5 text-[12.5px]' : 'h-10 text-[13px]'

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-[10px] border px-3 transition-colors duration-200',
          'border-line-strong bg-surface-2/80 text-ink hover:border-brand/40 disabled:opacity-50',
          open && 'border-brand/60 bg-surface-2',
          height,
        )}
      >
        <span className={cn('truncate', !current && 'text-subtle')}>{current?.label ?? placeholder}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-subtle transition-transform duration-200', open && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'absolute z-50 mt-1.5 max-h-72 w-full min-w-[180px] overflow-hidden rounded-[12px] border border-line-strong bg-surface-3/98 shadow-float backdrop-blur-xl',
              align === 'right' && 'right-0',
            )}
          >
            {searchable && (
              <div className="border-b border-line-soft p-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Qidirish..."
                  className="h-8 w-full rounded-[8px] border border-line bg-surface-2 px-2.5 text-[12.5px] outline-none placeholder:text-subtle focus:border-brand/50"
                />
              </div>
            )}
            <div className="scroll-area max-h-60 overflow-y-auto p-1.5">
              {filtered.length === 0 && <p className="px-2.5 py-3 text-center text-[12px] text-subtle">Topilmadi</p>}
              {filtered.map((option) => {
                const active = String(option.value) === String(value ?? 'all')
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value === 'all' ? '' : option.value)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors',
                      active ? 'bg-brand/14 text-brand-2' : 'text-ink-2 hover:bg-white/[0.055]',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {option.count !== undefined && (
                        <span className="text-[11px] text-subtle tabular">{option.count}</span>
                      )}
                      {active && <Check className="size-3.5" strokeWidth={2.6} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const DateInput = ({ value, onChange, className, ...props }) => (
  <input
    type="date"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className={cn(BASE, 'h-10 px-3 [color-scheme:dark]', className)}
    {...props}
  />
)

export const DateRangeInput = ({ value = { from: '', to: '' }, onChange, className }) => (
  <div className={cn('flex items-center gap-2', className)}>
    <DateInput value={value.from} onChange={(from) => onChange({ ...value, from })} />
    <span className="text-subtle">—</span>
    <DateInput value={value.to} onChange={(to) => onChange({ ...value, to })} />
  </div>
)

export const Switch = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn('flex items-center gap-2.5 disabled:opacity-50', label && 'pr-1')}
  >
    <span
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200',
        checked ? 'border-brand/50 bg-brand/80' : 'border-line-strong bg-surface-3',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        className={cn('absolute top-0.5 size-3.5 rounded-full bg-white shadow', checked ? 'left-4.5' : 'left-0.5')}
      />
    </span>
    {label && <span className="text-[12.5px] text-ink-2">{label}</span>}
  </button>
)

export const Checkbox = ({ checked, onChange, label, className }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn('flex items-start gap-2.5 text-left', className)}
  >
    <span
      className={cn(
        'mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-[5px] border transition-colors duration-200',
        checked ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface-2',
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
            <Check className="size-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
    {label && <span className="text-[12.5px] leading-snug text-ink-2">{label}</span>}
  </button>
)
