import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BrainCircuit, Gauge, Lightbulb, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { aiService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { cn, unique } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { impact } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SegmentedControl } from '@/components/ui/Tabs'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'

const IMPACT_TONE = { high: 'danger', medium: 'warning', low: 'info' }

const InsightCard = ({ insight }) => {
  const navigate = useNavigate()
  return (
    <motion.div
      variants={fadeUp(12)}
      whileHover={{ y: -3 }}
      className={cn(
        'panel flex flex-col p-4 transition-colors',
        insight.impact === 'high' ? 'border-danger/25 hover:border-danger/45' : 'hover:border-brand/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-[10px] border',
              insight.impact === 'high'
                ? 'border-danger/30 bg-danger/12 text-danger'
                : insight.impact === 'medium'
                  ? 'border-warning/30 bg-warning/12 text-warning'
                  : 'border-info/30 bg-info/12 text-info',
            )}
          >
            <Lightbulb className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug text-ink">{insight.title}</p>
            <p className="mt-0.5 text-[11.5px] text-subtle">{insight.category}</p>
          </div>
        </div>
        <StatusBadge label={impact.label(insight.impact)} tone={IMPACT_TONE[insight.impact]} size="xs" />
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{insight.summary}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-subtle">{insight.detail}</p>

      <div className="mt-3 rounded-[10px] border border-line bg-surface-2/60 p-3">
        <p className="text-[10.5px] uppercase tracking-[0.09em] text-subtle">Tavsiya</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{insight.recommendation}</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {insight.metric && (
          <span className="text-[11.5px] text-subtle">
            {insight.metric.label}: <span className="font-semibold text-ink tabular">{insight.metric.value}</span>
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="text-[11px] text-subtle">Ishonch</span>
          <span className="w-16">
            <ProgressBar value={insight.confidence} size="xs" tone={insight.confidence >= 85 ? 'success' : 'brand'} />
          </span>
          <span className="text-[11.5px] font-semibold text-ink-2 tabular">{insight.confidence}%</span>
        </span>
      </div>

      {insight.actions?.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line-soft pt-3">
          {insight.actions.map((action) => (
            <Button key={action.to} size="sm" variant="subtle" iconRight={ArrowRight} onClick={() => navigate(action.to)}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

const AiRecommendationsPage = () => {
  const [filter, setFilter] = useState('all')

  const { data: insights, loading, error, refetch } = useQuery(
    [QK.ai, QK.candidates, QK.onboarding, QK.tasks, QK.payroll, QK.kpi, QK.vacancies, QK.cameras],
    () => aiService.getInsights(),
    { deps: ['ai-insights'] },
  )
  const { data: summary } = useQuery([QK.ai, QK.candidates, QK.onboarding, QK.tasks], () => aiService.getInsightSummary(), {
    deps: ['ai-summary'],
  })

  const filtered = (insights ?? []).filter((insight) => (filter === 'all' ? true : insight.impact === filter))
  const categories = unique((insights ?? []).map((i) => i.category))

  return (
    <>
      <PageHeader
        title="AI Tavsiyalar"
        subtitle="Tizimdagi jonli ma’lumotlar asosida hisoblangan tavsiyalar. Har bir tavsiya tegishli moduldagi haqiqiy holatdan kelib chiqadi va o‘sha sahifaga yo‘naltiradi."
        icon={Sparkles}
        actions={
          <SegmentedControl
            id="ai-filter"
            size="sm"
            items={[
              { value: 'all', label: 'Barchasi' },
              { value: 'high', label: 'Yuqori' },
              { value: 'medium', label: 'O‘rta' },
              { value: 'low', label: 'Past' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        }
      />

      {!summary ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard label="Jami tavsiyalar" value={summary.total} icon={BrainCircuit} tone="violet" hint={`${categories.length} ta yo‘nalish`} compact />
          <StatCard label="Yuqori ta’sir" value={summary.high} icon={ShieldAlert} tone="danger" hint="Darhol e’tibor" compact />
          <StatCard label="O‘rta ta’sir" value={summary.medium} icon={TrendingUp} tone="warning" hint="Rejalashtirish uchun" compact />
          <StatCard label="O‘rtacha ishonch" value={summary.avgConfidence} suffix="%" icon={Gauge} tone="teal" hint="Model baholashi" compact />
        </motion.div>
      )}

      <div className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : loading && !insights ? (
          <Card>
            <SkeletonList rows={6} />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={Sparkles}
              title="Bu darajada tavsiya yo‘q"
              description="Tanlangan ta’sir darajasi bo‘yicha hozircha tavsiya mavjud emas."
            />
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer(0.05)}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 2xl:grid-cols-3"
          >
            {filtered.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </motion.div>
        )}
      </div>

      <Card className="mt-3.5" title="Tavsiyalar qanday hisoblanadi" icon={BrainCircuit}>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Tavsiyalar qoidaga asoslangan tahlil natijasidir: vakansiya muddatlari, nomzodlar saralash tezligi, onboarding
          davomiyligi, KPI taqsimoti, davomat intizomi, payroll holati va qurilmalar uzilishi bir vaqtda tekshiriladi.
          Ma’lumot o‘zgarganda (masalan, nomzod qabul qilinsa yoki to‘lov yakunlansa) tavsiyalar avtomatik qayta hisoblanadi.
        </p>
        <p className="mt-2 text-[11.5px] text-subtle">
          Oxirgi hisoblash: {formatDateTime(new Date())} · manba: <span className="text-ink-2">services/api/ai.js</span> —
          ertaga bu yerga real tavsiya xizmati ulanadi.
        </p>
      </Card>
    </>
  )
}

export default AiRecommendationsPage
