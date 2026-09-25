import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Award, CheckCircle2, Gauge, TrendingUp, Users } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { kpiService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { formatMonthKey, formatNumber, formatPercent, monthKey } from '@/lib/format'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { StatCard } from '@/components/ui/StatCard'
import { Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KpiRing, ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/States'
import { BarCompare, DonutChart, LineTrend, RadarCompare } from '@/components/charts/ChartKit'

const PerformancePage = () => {
  const navigate = useNavigate()
  const [month, setMonth] = useState(monthKey())

  const { data: months } = useQuery([QK.kpi], () => kpiService.getKpiMonths(), { deps: ['kpi-months'] })
  const { data: summary } = useQuery([QK.kpi, QK.employees], () => kpiService.getKpiSummary(month), {
    deps: ['kpi-summary', month],
  })
  const { data: departments } = useQuery([QK.kpi, QK.employees], () => kpiService.getDepartmentPerformance(month), {
    deps: ['kpi-departments', month],
  })
  const { data: top } = useQuery([QK.kpi, QK.employees], () => kpiService.getTopPerformers({ month, limit: 8 }), {
    deps: ['kpi-top', month],
  })
  const { data: attention } = useQuery([QK.kpi, QK.employees], () => kpiService.getAttentionList({ month, limit: 8 }), {
    deps: ['kpi-attention', month],
  })

  const radarData = (departments ?? []).slice(0, 6).map((row) => ({
    metric: row.department,
    kpi: row.kpi,
    sifat: row.quality,
    intizom: row.discipline,
  }))

  return (
    <>
      <PageHeader
        title="Samaradorlik"
        subtitle="Xodimlar va bo‘limlar samaradorligi: KPI, sifat, intizom va vazifalarni bajarish ko‘rsatkichlari."
        icon={TrendingUp}
        actions={
          <Select
            className="w-40"
            size="sm"
            value={month}
            onChange={(value) => setMonth(value || monthKey())}
            options={(months ?? [monthKey()]).map((m) => ({ value: m, label: formatMonthKey(m, false) }))}
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
          <StatCard
            label="O‘rtacha KPI"
            value={summary.average}
            suffix="%"
            change={summary.change}
            icon={Gauge}
            tone="brand"
            hint={`${summary.employees} ta xodim`}
            compact
          />
          <StatCard label="Yuqori natija (90%+)" value={summary.above90} icon={Award} tone="success" hint={`Eng yuqori ${summary.topScore}%`} compact />
          <StatCard label="E’tibor talab qiladi" value={summary.below70} icon={AlertTriangle} tone="danger" hint={`Eng past ${summary.lowScore}%`} compact />
          <StatCard
            label="Vazifalar bajarilishi"
            value={summary.tasksPlanned ? Math.round((summary.tasksCompleted / summary.tasksPlanned) * 100) : 0}
            suffix="%"
            icon={CheckCircle2}
            tone="teal"
            hint={`${formatNumber(summary.tasksCompleted)} / ${formatNumber(summary.tasksPlanned)}`}
            compact
          />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-7"
          title="KPI dinamikasi"
          subtitle="Oylar bo‘yicha o‘rtacha ko‘rsatkich"
          icon={Activity}
          loading={!summary}
          height={250}
          legend={[
            { label: 'KPI', color: 'var(--color-brand)' },
            { label: 'Sifat', color: 'var(--color-teal)' },
          ]}
        >
          <LineTrend
            data={summary?.trend ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={244}
            yFormatter={(v) => `${v}%`}
            domain={[40, 100]}
            series={[
              { key: 'kpi', label: 'KPI', color: 'var(--color-brand)' },
              { key: 'quality', label: 'Sifat', color: 'var(--color-teal)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-5"
          title="KPI taqsimoti"
          subtitle={formatMonthKey(month, false)}
          icon={Gauge}
          loading={!summary}
          height={250}
        >
          <DonutChart
            data={(summary?.distribution ?? []).map((band) => ({ name: band.label, value: band.value, color: band.color }))}
            centerValue={formatPercent(summary?.average ?? 0)}
            centerLabel="o‘rtacha"
            height={232}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-7"
          title="Bo‘limlar samaradorligi"
          subtitle="KPI, sifat va intizom"
          icon={Users}
          loading={!departments}
          height={260}
          legend={[
            { label: 'KPI', color: 'var(--color-brand)' },
            { label: 'Sifat', color: 'var(--color-teal)' },
            { label: 'Intizom', color: 'var(--color-violet)' },
          ]}
        >
          <BarCompare
            data={departments ?? []}
            xKey="department"
            height={254}
            yFormatter={(v) => `${v}%`}
            series={[
              { key: 'kpi', label: 'KPI', color: 'var(--color-brand)' },
              { key: 'quality', label: 'Sifat', color: 'var(--color-teal)' },
              { key: 'discipline', label: 'Intizom', color: 'var(--color-violet)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-5"
          title="Ko‘rsatkichlar profili"
          subtitle="Bo‘limlar kesimi"
          icon={Activity}
          loading={!departments}
          height={260}
        >
          <RadarCompare
            data={radarData}
            height={254}
            series={[
              { key: 'kpi', label: 'KPI', color: 'var(--color-brand)' },
              { key: 'sifat', label: 'Sifat', color: 'var(--color-teal)' },
            ]}
          />
        </ChartCard>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Card title="Eng yaxshi natijalar" subtitle="Joriy oy bo‘yicha" icon={Award} padded={false}>
          <div className="p-3">
            {!top ? (
              <SkeletonList rows={6} />
            ) : top.length === 0 ? (
              <EmptyState title="Ma’lumot yo‘q" compact />
            ) : (
              <motion.div variants={staggerContainer(0.04)} initial="initial" animate="animate" className="space-y-1.5">
                {top.map((row, index) => (
                  <motion.button
                    key={row.id}
                    variants={fadeUp(8)}
                    type="button"
                    onClick={() => navigate(`/employees/${row.employeeId}`)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <span className="w-5 shrink-0 text-center text-[11.5px] font-semibold text-subtle tabular">{index + 1}</span>
                    <Avatar name={row.fullName} tone={row.avatarTone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-ink">{row.fullName}</p>
                      <p className="truncate text-[11px] text-subtle">
                        {row.position} · {row.department}
                      </p>
                    </div>
                    <div className="w-24 shrink-0">
                      <ProgressBar value={row.kpi} size="xs" />
                    </div>
                    <span className="w-10 shrink-0 text-right text-[12.5px] font-semibold text-ink tabular">{row.kpi}%</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </Card>

        <Card title="E’tibor talab qiladi" subtitle="Past ko‘rsatkichli xodimlar" icon={AlertTriangle} padded={false}>
          <div className="p-3">
            {!attention ? (
              <SkeletonList rows={6} />
            ) : attention.length === 0 ? (
              <EmptyState title="Barcha ko‘rsatkichlar me’yorda" compact />
            ) : (
              <motion.div variants={staggerContainer(0.04)} initial="initial" animate="animate" className="space-y-1.5">
                {attention.map((row) => (
                  <motion.button
                    key={row.id}
                    variants={fadeUp(8)}
                    type="button"
                    onClick={() => navigate(`/employees/${row.employeeId}`)}
                    className="flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <Avatar name={row.fullName} tone={row.avatarTone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-ink">{row.fullName}</p>
                      <p className="truncate text-[11px] text-subtle">
                        {row.position} · {row.department}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {row.reasons.slice(0, 2).map((reason) => (
                          <StatusBadge key={reason} label={reason} tone="warning" size="xs" dot={false} />
                        ))}
                      </div>
                    </div>
                    <KpiRing value={row.kpi} size={44} thickness={5} />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}

export default PerformancePage
