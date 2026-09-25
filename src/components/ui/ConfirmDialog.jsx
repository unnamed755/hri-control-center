import { AlertTriangle, HelpCircle, Trash2 } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { Modal } from './Modal'
import { Button } from './Button'
import { cn } from '@/lib/utils'

const TONES = {
  danger: { icon: Trash2, cls: 'text-danger bg-danger/12 border-danger/30', button: 'danger' },
  warning: { icon: AlertTriangle, cls: 'text-warning bg-warning/12 border-warning/30', button: 'warning' },
  brand: { icon: HelpCircle, cls: 'text-brand-2 bg-brand/12 border-brand/30', button: 'primary' },
}

/** Global confirm dialog driven by `askConfirm()` from the UI store. */
export const ConfirmDialog = () => {
  const confirm = useUiStore((s) => s.confirm)
  const resolve = useUiStore((s) => s.resolveConfirm)
  const tone = TONES[confirm?.tone] ?? TONES.danger
  const Icon = tone.icon

  return (
    <Modal
      open={Boolean(confirm)}
      onClose={() => resolve(false)}
      title={confirm?.title ?? 'Tasdiqlaysizmi?'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => resolve(false)}>
            {confirm?.cancelLabel ?? 'Bekor qilish'}
          </Button>
          <Button variant={tone.button} onClick={() => resolve(true)}>
            {confirm?.confirmLabel ?? 'Tasdiqlash'}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-[11px] border', tone.cls)}>
          <Icon className="size-[18px]" strokeWidth={2} />
        </span>
        <p className="pt-1 text-[12.5px] leading-relaxed text-muted">
          {confirm?.description ?? 'Bu amalni qaytarib bo‘lmaydi.'}
        </p>
      </div>
    </Modal>
  )
}
