import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'
import { useUiStore } from '@/store/uiStore'

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-success', ring: 'border-success/30', glow: 'bg-success/10' },
  danger: { icon: XCircle, cls: 'text-danger', ring: 'border-danger/30', glow: 'bg-danger/10' },
  warning: { icon: AlertTriangle, cls: 'text-warning', ring: 'border-warning/30', glow: 'bg-warning/10' },
  info: { icon: Info, cls: 'text-info', ring: 'border-info/30', glow: 'bg-info/10' },
}

export const ToastHost = () => {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return createPortal(
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2.5">
      <AnimatePresence>
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] ?? TONES.info
          const Icon = tone.icon
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97, transition: { duration: 0.18 } }}
              transition={{ duration: 0.3, ease: EASE }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-[12px] border bg-surface-3/96 p-3.5 shadow-float backdrop-blur-xl',
                tone.ring,
              )}
            >
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-[9px]', tone.glow, tone.cls)}>
                <Icon className="size-[17px]" strokeWidth={2.1} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-ink">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="grid size-5 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-white/10 hover:text-ink"
              >
                <X className="size-3.5" strokeWidth={2.4} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
