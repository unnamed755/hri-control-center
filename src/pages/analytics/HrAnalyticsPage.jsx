import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote,
  CalendarCheck2,
  FileBarChart2,
  Gauge,
  PieChart,
  Rocket,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { analyticsService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { formatMoney, formatMonthKey, formatNumber, formatPercent } from '@/lib/format'
import { ATTENDANCE_COLORS, attendanceStatus, onboardingStage } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { MetricTile } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards, SkeletonChart } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { AreaTrend, BarCompare, DonutChart, FunnelStages, LineTrend, RankBars } from '@/components/charts/ChartKit'

const RANGES = [
  { value: 6, label: '6 oy' },
  { value: 12, label: '12 oy' },
]

const HrAnalyticsPage = () => {
  const navigate = useNavigate()
  const [range, setRange] = useState(12)

  const { data, loading, error, refetch } = useQuery(
    [QK.analytics, QK.employees, QK.candidates, QK.onboarding, QK.payroll, QK.attendance, QK.kpi],
    () => analyticsService.getAnalytics({ months: range }),
    { deps: ['hr-analytics', range] },
  )

  if (error) {
    return (
      <>
        <PageHeader title="HR Analitika" icon={PieChart} />
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  const headline = data?.headline

  const attendanceDonut = [
    { key: 'present', value: data?.attendance?.present ?? 0 },
    { key: 'late', value: data?.attendance?.late ?? 0 },
    { key: 'remote', value: data?.attendance?.remote ?? 0 },
    { key: 'absent', value: data?.attendance?.absent ?? 0 },
    { key: 'leave', value: data?.attendance?.leave ?? 0 },
  ].map((entry) => ({ name: attendanceStatus.label(entry.key), value: entry.value, color: ATTENDANCE_COLORS[entry.key] }))

  const departmentColumns = [
    { key: 'department', label: 'Bo‘lim' },
    { key: 'headcount', label: 'Shtat', align: 'right' },
    {
      key: 'kpi',
      label: 'KPI',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <ProgressBar value={row.kpi} size="xs" className="w-14" />
          <span className="w-9 text-right tabular">{row.kpi}%</span>
        </div>
      ),
    },
    { key: 'attendance', label: 'Davomat', align: 'right', render: (row) => <span className="tabular">{row.attendance}%</span> },
    {
      key: 'avgSalary',
      label: 'O‘rtacha oylik',
      align: 'right',
      hideBelow: 'lg',
      render: (row) => <span className="tabular">{formatMoney(row.avgSalary, { compact: true, currency: '' })}</span>,
    },
    {
      key: 'payroll',
      label: 'Payroll',
      align: 'right',
      render: (row) => <span className="tabular">{formatMoney(row.payroll, { compact: true, currency: '' })}</span>,
    },
    { key: 'candidates', label: 'Nomzodlar', align: 'right', hideBelow: 'xl' },
  ]

  return (
    <>
      <PageHeader
        title="HR Analitika"
        subtitle="Barcha modullardan yig‘ilgan agregatsiya: rekruting, nomzodlar, onboarding, xodimlar, davomat, payroll va KPI birgalikda tahlil qilinadi."
        icon={PieChart}
        actions={
          <>
            <SegmentedControl id="analytics-range" size="sm" items={RANGES} value={range} onChange={setRange} />
            <Button variant="secondary" size="sm" icon={FileBarChart2} onClick={() => navigate('/reports')}>
              Hisobotlar
            </Button>
          </>
        }
      />

      {/* headline metrics */}
      {!headline ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.05)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
        >
          <MetricTile label="Shtat" value={formatNumber(headline.headcount)} icon={Users} tone="brand" hint={`${headline.avgTenureMonths} oy o‘rtacha staj`} />
          <MetricTile label="Qabul (yil)" value={formatNumber(headline.hiredThisYear)} icon={UserPlus} tone="success" hint={`Konversiya ${headline.hiringConversion}%`} />
          <MetricTile label="Bo‘shash (yil)" value={formatNumber(headline.leftThisYear)} icon={UserMinus} tone="danger" hint={`Turnover ${headline.turnoverRate}%`} />
          <MetricTile label="Onboarding" value={`${headline.onboardingCompletion}%`} icon={Rocket} tone="teal" hint="Yakunlanish darajasi" />
          <MetricTile label="Davomat" value={`${headline.attendanceRate}%`} icon={CalendarCheck2} tone="info" hint="Oxirgi 30 kun" />
          <MetricTile label="O‘rtacha KPI" value={`${headline.avgKpi}%`} icon={Gauge} tone="violet" hint={`${headline.openVacancies} ochiq vakansiya`} />
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer(0.06, 0.08)}
        initial="initial"
        animate="animate"
        className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-12"
      >
        <ChartCard
          className="xl:col-span-7"
          title="Shtat o‘sishi"
          subtitle="Oylik shtat, qabul va bo‘shash"
          icon={Users}
          loading={loading && !data}
          height={260}
          legend={[
            { label: 'Jami shtat', color: 'var(--color-brand)' },
            { label: 'Qabul', color: 'var(--color-success)' },
            { label: 'Bo‘shagan', color: 'var(--color-danger)' },
          ]}
        >
          <AreaTrend
            data={data?.employeeGrowth ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={254}
            yFormatter={(v) => formatNumber(v)}
            series={[
              { key: 'total', label: 'Jami shtat', color: 'var(--color-brand)' },
              { key: 'hired', label: 'Qabul', color: 'var(--color-success)' },
              { key: 'left', label: 'Bo‘shagan', color: 'var(--color-danger)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-5"
          title="Kadrlar almashinuvi"
          subtitle="Turnover foizi va sof o‘sish"
          icon={TrendingDown}
          loading={loading && !data}
          height={260}
          legend={[
            { label: 'Turnover, %', color: 'var(--color-danger)' },
            { label: 'Sof o‘sish', color: 'var(--color-teal)' },
          ]}
        >
          <LineTrend
            data={data?.turnover ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={254}
            series={[
              { key: 'rate', label: 'Turnover, %', color: 'var(--color-danger)' },
              { key: 'net', label: 'Sof o‘sish', color: 'var(--color-teal)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Ishga olish varonkasi"
          subtitle="Arizadan ishga olishgacha"
          icon={TrendingUp}
          loading={loading && !data}
          height={260}
          bodyClassName="px-5"
        >
          <FunnelStages
            data={(data?.hiringFunnel ?? []).map((stage, index) => ({
              ...stage,
              color: ['var(--color-info)', 'var(--color-violet)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-teal)', 'var(--color-brand)'][index],
            }))}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Manbalar samarasi"
          subtitle="Konversiya bo‘yicha"
          icon={TrendingUp}
          loading={loading && !data}
          height={260}
          bodyClassName="px-5"
        >
          <RankBars
            data={(data?.sourceEffectiveness ?? []).map((row) => ({
              name: row.source,
              value: row.total,
              hint: `${row.hired} ta ishga olingan · konversiya ${row.conversion}%`,
            }))}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Onboarding bosqichlari"
          subtitle="Joriy taqsimot"
          icon={Rocket}
          loading={loading && !data}
          height={260}
        >
          <BarCompare
            data={(data?.onboardingProgress ?? []).map((row) => ({
              name: onboardingStage.label(row.stage),
              value: row.value,
            }))}
            xKey="name"
            height={254}
            colorByPoint
            series={[{ key: 'value', label: 'Yozuvlar', color: 'var(--color-teal)' }]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Davomat taqsimoti"
          subtitle="Oxirgi 30 kun"
          icon={CalendarCheck2}
          loading={loading && !data}
          height={250}
        >
          <DonutChart
            data={attendanceDonut}
            centerValue={formatPercent(data?.attendance?.rate ?? 0)}
            centerLabel="davomat"
            height={232}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Payroll dinamikasi"
          subtitle="Oylik to‘lov fondi"
          icon={Banknote}
          loading={loading && !data}
          height={250}
          legend={[
            { label: 'Jami', color: 'var(--color-violet)' },
            { label: 'Bonus', color: 'var(--color-warning)' },
          ]}
        >
          <BarCompare
            data={data?.payrollTrend ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={244}
            valueFormatter={(v) => formatMoney(v, { compact: true })}
            series={[
              { key: 'total', label: 'Jami', color: 'var(--color-violet)' },
              { key: 'bonus', label: 'Bonus', color: 'var(--color-warning)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="KPI taqsimoti"
          subtitle="Xodimlar guruhlari"
          icon={Gauge}
          loading={loading && !data}
          height={250}
        >
          <DonutChart
            data={(data?.kpiDistribution ?? []).map((band) => ({ name: band.label, value: band.value, color: band.color }))}
            centerValue={formatPercent(headline?.avgKpi ?? 0)}
            centerLabel="o‘rtacha"
            height={232}
          />
        </ChartCard>
      </motion.div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Bo‘limlar kesimi" subtitle="Shtat, KPI, davomat va payroll" icon={Users} padded={false}>
          {loading && !data ? (
            <div className="p-4">
              <SkeletonChart height={220} />
            </div>
          ) : (
            <DataTable columns={departmentColumns} rows={data?.departmentComparison ?? []} rowKey={(row) => row.department} dense />
          )}
        </Card>

        <Card title="Filiallar" subtitle="Shtat va davomat" icon={Users}>
          {loading && !data ? (
            <SkeletonChart height={220} />
          ) : (
            <RankBars
              data={(data?.branchComparison ?? [])
                .sort((a, b) => b.headcount - a.headcount)
                .map((row) => ({
                  name: row.branch,
                  value: row.headcount,
                  hint: `KPI ${row.kpi}% · davomat ${row.attendance}%`,
                }))}
            />
          )}
        </Card>
      </div>
    </>
  )
}

export default HrAnalyticsPage
