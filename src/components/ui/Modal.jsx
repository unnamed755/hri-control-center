import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { backdropVariants, scaleIn, slideRight } from '@/lib/motion'
import { IconButton } from './Button'

const useEscape = (open, onClose) => {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md', icon: Icon }) => {
  useEscape(open, onClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-[#03060D]/78 backdrop-blur-[3px]"
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-[16px] border border-line-strong bg-surface shadow-float',
              WIDTHS[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
                    <Icon className="size-[17px]" strokeWidth={2} />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
                  {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
                </div>
              </div>
              <IconButton variant="ghost" size="icon-sm" icon={X} onClick={onClose} aria-label="Yopish" />
            </div>
            <div className="scroll-area flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line-soft bg-surface-2/50 px-5 py-3.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

const DRAWER_WIDTHS = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-3xl',
}

export const Drawer = ({ open, onClose, title, subtitle, children, footer, size = 'lg', badge, icon: Icon }) => {
  useEscape(open, onClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-[#03060D]/72 backdrop-blur-[3px]"
          />
          <motion.aside
            variants={slideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative flex h-full w-full flex-col border-l border-line-strong bg-canvas-2 shadow-float',
              DRAWER_WIDTHS[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
                    <Icon className="size-[17px]" strokeWidth={2} />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-ink">{title}</h3>
                    {badge}
                  </div>
                  {subtitle && <p className="mt-0.5 truncate text-[12px] text-muted">{subtitle}</p>}
                </div>
              </div>
              <IconButton variant="ghost" size="icon-sm" icon={X} onClick={onClose} aria-label="Yopish" />
            </div>
            <div className="scroll-area flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-line bg-surface/60 px-5 py-3.5">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
