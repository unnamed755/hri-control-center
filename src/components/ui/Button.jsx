import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DUR, EASE } from '@/lib/motion'

const VARIANTS = {
  primary:
    'bg-brand text-white shadow-[0_8px_24px_-12px_rgba(59,124,255,0.85)] hover:bg-brand-2 active:bg-brand-deep border border-brand/60',
  secondary: 'bg-surface-3 text-ink border border-line-strong hover:bg-surface-4 hover:border-brand/40',
  subtle: 'bg-brand/10 text-brand-2 border border-brand/25 hover:bg-brand/16',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-surface-3 hover:text-ink',
  outline: 'bg-transparent text-ink border border-line-strong hover:border-brand/50 hover:bg-surface-2',
  danger: 'bg-danger/12 text-danger border border-danger/35 hover:bg-danger/20',
  success: 'bg-success/12 text-success border border-success/35 hover:bg-success/20',
  warning: 'bg-warning/12 text-warning border border-warning/35 hover:bg-warning/20',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-[11.5px] gap-1.5 rounded-[7px]',
  sm: 'h-8.5 px-3 text-[12.5px] gap-1.5 rounded-[9px]',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-[13.5px] gap-2 rounded-[11px]',
  icon: 'h-9 w-9 justify-center rounded-[10px]',
  'icon-sm': 'h-8 w-8 justify-center rounded-[9px]',
  /** square-ish but keeps its label (pagination numbers) */
  num: 'h-8 min-w-8 justify-center px-2 text-[12px] rounded-[8px]',
}

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    disabled = false,
    className,
    type = 'button',
    ...props
  },
  ref,
) {
  const isIconOnly = size === 'icon' || size === 'icon-sm'
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.975 }}
      transition={{ duration: DUR.micro, ease: EASE }}
      className={cn(
        'relative inline-flex select-none items-center font-medium tracking-[-0.01em] outline-none transition-colors duration-200',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn('animate-spin', isIconOnly ? 'size-4' : 'size-3.5')} strokeWidth={2.2} />
      ) : (
        Icon && <Icon className={isIconOnly ? 'size-[17px]' : 'size-[15px]'} strokeWidth={2} />
      )}
      {!isIconOnly && children}
      {!isIconOnly && IconRight && !loading && <IconRight className="size-[15px]" strokeWidth={2} />}
    </motion.button>
  )
})

export const IconButton = forwardRef(function IconButton({ size = 'icon', ...props }, ref) {
  return <Button ref={ref} size={size} {...props} />
})
