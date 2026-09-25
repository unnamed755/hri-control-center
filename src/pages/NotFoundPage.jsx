import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, LayoutDashboard, Search } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { flatNavigation } from '@/config/navigation'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const NotFoundPage = () => {
  const navigate = useNavigate()
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)

  return (
    <motion.div variants={staggerContainer(0.06)} initial="initial" animate="animate" className="mx-auto max-w-2xl py-10">
      <motion.div variants={fadeUp(14)} className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-[16px] border border-line bg-surface-3 text-brand-2">
          <Compass className="size-6" strokeWidth={1.9} />
        </span>
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.03em] text-ink">Sahifa topilmadi</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Siz qidirayotgan bo‘lim mavjud emas yoki manzil noto‘g‘ri kiritilgan. Quyidagi modullardan birini tanlang.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="primary" icon={LayoutDashboard} onClick={() => navigate('/dashboard')}>
            Control Center
          </Button>
          <Button variant="secondary" icon={Search} onClick={() => setCommandOpen(true)}>
            Global qidiruv
          </Button>
        </div>
      </motion.div>

      <Card className="mt-7" title="Mavjud modullar" icon={Compass}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {flatNavigation.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/50 px-3 py-2 text-left transition-colors hover:border-brand/40"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-surface-3 text-subtle">
                <item.icon className="size-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{item.label}</span>
              <span className="shrink-0 text-[10.5px] text-faint">{item.section}</span>
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

export default NotFoundPage
