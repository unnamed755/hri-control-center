import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dropdownVariants } from '@/lib/motion'
import { IconButton } from './Button'

/**
 * Row / card action menu.
 * items: [{ label, icon, onClick, tone?, divider?, disabled? }]
 */
export const Dropdown = ({ items = [], align = 'right', trigger, className, width = 'w-52' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <span
        onClick={(event) => {
          event.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {trigger ?? <IconButton variant="ghost" size="icon-sm" icon={MoreHorizontal} aria-label="Amallar" />}
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'absolute z-50 mt-1.5 overflow-hidden rounded-[12px] border border-line-strong bg-surface-3/98 p-1.5 shadow-float backdrop-blur-xl',
              align === 'right' ? 'right-0' : 'left-0',
              width,
            )}
          >
            {items.map((item, index) =>
              item.divider ? (
                <div key={`divider-${index}`} className="my-1.5 h-px bg-line-soft" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false)
                    item.onClick?.()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[12.5px] transition-colors disabled:opacity-40',
                    item.tone === 'danger'
                      ? 'text-danger hover:bg-danger/12'
                      : 'text-ink-2 hover:bg-white/[0.06] hover:text-ink',
                  )}
                >
                  {item.icon && <item.icon className="size-[15px] shrink-0" strokeWidth={2} />}
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="ml-auto text-[11px] text-subtle">{item.hint}</span>}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
