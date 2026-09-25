import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote,
  BriefcaseBusiness,
  CalendarCheck2,
  Download,
  LayoutDashboard,
  ListChecks,
  Rocket,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserSearch,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { analyticsService } from '@/services'
import { completeOnboarding } from '@/services/workflow/hrWorkflow'
import { useQuery } from '@/hooks/useQuery'
import { toast } from '@/store/uiStore'
import { formatCompact, formatMonthKey, formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { attendanceStatus, ATTENDANCE_COLORS } from '@/config/dictionaries'
import { download, toCsv } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Tabs'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { AreaTrend, BarCompare, DonutChart, FunnelStages, RankBars } from '@/components/charts/ChartKit'
import {
  OnboardingStagesPanel,
  ReadyToStartPanel,
  RecentHiresPanel,
  UpcomingInterviewsPanel,
  UrgentTasksPanel,
} from './components/DashboardPanels'

const GROWTH_RANGES = [
  { value: 6, label: '6 oy' },
  { value: 12, label: '12 oy' },
]

const DashboardPage = () => {
  const navigate = useNavigate()
  const [growthRange, setGrowthRange] = useState(12)
  const [startingId, setStartingId] = useState(null)

  const { data, loading, error, refetch, refetching } = useQuery(
    [QK.analytics, QK.employees, QK.candidates, QK.onboarding, QK.payroll, QK.tasks],
    () => analyticsService.getDashboard(),
    { deps: ['dashboard'] },
  )

  const kpis = data?.kpis
  const growth = (data?.employeeGrowth ?? []).slice(-growthRange)

  const handleStart = async (record) => {
    setStartingId(record.id)
    try {
      const result = await completeOnboarding(record.id)
      toast({
        tone: 'success',
        title: 'START bajarildi',
        description: `${result.employee.fullName} xodimlar ro‘yxatiga qo‘shildi va payrollga ulandi.`,
      })
    } catch (err) {
      toast({ tone: 'danger', title: 'START bajarilmadi', description: err.message })
    } finally {
      setStartingId(null)
    }
  }

  const exportSummary = () => {
    if (!kpis) return
    const rows = Object.entries(kpis).map(([key, value]) => ({ key, ...value }))
    const csv = toCsv(
      [
        { label: 'Ko‘rsatkich', value: (r) => r.key },
        { label: 'Qiymat', value: (r) => r.value },
        { label: 'O‘zgarish, %', value: (r) => r.change },
        { label: 'Izoh', value: (r) => r.hint },
      ],
      rows,
    )
    download(`hri-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: 'Dashboard xulosasi yuklab olindi' })
  }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Control Center" icon={LayoutDashboard} />
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  const attendanceDonut = (data?.attendance?.distribution ?? [
    { key: 'present', value: data?.attendance?.present ?? 0 },
    { key: 'late', value: data?.attendance?.late ?? 0 },
    { key: 'remote', value: data?.attendance?.remote ?? 0 },
    { key: 'absent', value: data?.attendance?.absent ?? 0 },
    { key: 'leave', value: data?.attendance?.leave ?? 0 },
  ]).map((entry) => ({
    name: attendanceStatus.label(entry.key),
    value: entry.value,
    color: ATTENDANCE_COLORS[entry.key],
  }))

  return (
    <>
      <PageHeader
        title="Control Center"
        subtitle="Rekruting, onboarding, xodimlar, payroll va samaradorlik bo‘yicha yagona HR boshqaruv paneli. Barcha ko‘rsatkichlar bir xil DEMO ma’lumot bazasidan hisoblanadi."
        icon={LayoutDashboard}
        actions={
          <>
            <Button variant="subtle" size="sm" icon={Sparkles} onClick={() => navigate('/ai-recommendations')}>
              AI tavsiyalar
            </Button>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportSummary}>
              Xulosani yuklash
            </Button>
          </>
        }
      />

      {/* ---------------- KPI grid ---------------- */}
      {loading && !data ? (
        <SkeletonStatCards count={8} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard
            label="Jami xodimlar"
            value={kpis.totalEmployees.value}
            change={kpis.totalEmployees.change}
            hint={kpis.totalEmployees.hint}
            icon={Users}
            tone="brand"
            onClick={() => navigate('/employees')}
          />
          <StatCard
            label="Yangi xodimlar"
            value={kpis.newEmployees.value}
            change={kpis.newEmployees.change}
            hint={kpis.newEmployees.hint}
            icon={UserPlus}
            tone="success"
            onClick={() => navigate('/employee-register')}
          />
          <StatCard
            label="Faol nomzodlar"
            value={kpis.activeCandidates.value}
            change={kpis.activeCandidates.change}
            hint={kpis.activeCandidates.hint}
            icon={UserSearch}
            tone="info"
            onClick={() => navigate('/candidates')}
          />
          <StatCard
            label="Ochiq vakansiyalar"
            value={kpis.openVacancies.value}
            change={kpis.openVacancies.change}
            hint={kpis.openVacancies.hint}
            icon={BriefcaseBusiness}
            tone="warning"
            onClick={() => navigate('/vacancies')}
          />
          <StatCard
            label="Onboardingda"
            value={kpis.onboarding.value}
            change={kpis.onboarding.change}
            hint={kpis.onboarding.hint}
            icon={Rocket}
            tone="teal"
            onClick={() => navigate('/onboarding')}
          />
          <StatCard
            label="Payroll (oy)"
            value={kpis.payrollTotal.value}
            change={kpis.payrollTotal.change}
            hint={kpis.payrollTotal.hint}
            icon={Banknote}
            tone="violet"
            format={(v) => formatCompact(v)}
            suffix="so‘m"
            onClick={() => navigate('/payroll')}
          />
          <StatCard
            label="O‘rtacha KPI"
            value={kpis.avgKpi.value}
            change={kpis.avgKpi.change}
            hint={kpis.avgKpi.hint}
            icon={TrendingUp}
            tone="success"
            suffix="%"
            onClick={() => navigate('/performance')}
          />
          <StatCard
            label="Ochiq HR vazifalar"
            value={kpis.pendingTasks.value}
            change={kpis.pendingTasks.change}
            hint={kpis.pendingTasks.hint}
            icon={ListChecks}
            tone="danger"
            onClick={() => navigate('/hr-tasks')}
          />
        </motion.div>
      )}

      {/* ---------------- charts row 1 ---------------- */}
      <motion.div
        variants={staggerContainer(0.07, 0.12)}
        initial="initial"
        animate="animate"
        className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-12"
      >
        <ChartCard
          className="xl:col-span-5"
          title="Rekruting pipeline"
          subtitle="Nomzodlarning bosqichlar bo‘yicha taqsimoti"
          icon={UserSearch}
          loading={loading && !data}
          isEmpty={!loading && !(data?.pipeline ?? []).some((s) => s.value)}
          height={260}
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/candidates')}>
              Nomzodlar
            </Button>
          }
        >
          <div className="px-3 pt-1">
            <FunnelStages
              data={data?.pipeline ?? []}
              onSelect={(stage) => navigate(`/candidates?status=${stage.key}`)}
            />
          </div>
        </ChartCard>

        <ChartCard
          className="xl:col-span-7"
          title="Xodimlar o‘sishi"
          subtitle="Oylar bo‘yicha shtat, qabul va bo‘shash"
          icon={Users}
          loading={loading && !data}
          height={260}
          action={
            <SegmentedControl
              id="growth"
              size="sm"
              items={GROWTH_RANGES}
              value={growthRange}
              onChange={setGrowthRange}
            />
          }
          legend={[
            { label: 'Jami shtat', color: 'var(--color-brand)' },
            { label: 'Qabul qilingan', color: 'var(--color-success)' },
            { label: 'Bo‘shagan', color: 'var(--color-danger)' },
          ]}
        >
          <AreaTrend
            data={growth}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={222}
            series={[
              { key: 'total', label: 'Jami shtat', color: 'var(--color-brand)' },
              { key: 'hired', label: 'Qabul', color: 'var(--color-success)' },
              { key: 'left', label: 'Bo‘shagan', color: 'var(--color-danger)' },
            ]}
            yFormatter={(v) => formatNumber(v)}
          />
        </ChartCard>
      </motion.div>

      {/* ---------------- charts row 2 ---------------- */}
      <motion.div
        variants={staggerContainer(0.07, 0.06)}
        initial="initial"
        animate="animate"
        className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-12"
      >
        <ChartCard
          className="xl:col-span-4"
          title="Davomat (7 kun)"
          subtitle={`${formatPercent(data?.attendance?.rate ?? 0)} kelish ko‘rsatkichi`}
          icon={CalendarCheck2}
          loading={loading && !data}
          height={230}
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/attendance')}>
              Davomat
            </Button>
          }
        >
          <DonutChart
            data={attendanceDonut}
            centerValue={formatPercent(data?.attendance?.rate ?? 0)}
            centerLabel="kelish"
            height={214}
          />
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5 px-4">
            {attendanceDonut.map((entry) => (
              <span key={entry.name} className="flex items-center justify-between text-[11.5px]">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-semibold text-ink-2 tabular">{formatNumber(entry.value)}</span>
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Payroll dinamikasi"
          subtitle="Oylik to‘lov fondi (net)"
          icon={Banknote}
          loading={loading && !data}
          height={230}
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/payroll')}>
              Payroll
            </Button>
          }
        >
          <BarCompare
            data={data?.payrollTrend ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={226}
            valueFormatter={(v) => formatMoney(v, { compact: true })}
            series={[{ key: 'total', label: 'Jami', color: 'var(--color-violet)' }]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="KPI taqsimoti"
          subtitle="Xodimlarning samaradorlik guruhlari"
          icon={TrendingUp}
          loading={loading && !data}
          height={230}
          action={
            <Button variant="ghost" size="xs" onClick={() => navigate('/kpi-coins')}>
              KPI & Coins
            </Button>
          }
        >
          <DonutChart
            data={(data?.kpiDistribution ?? []).map((band) => ({
              name: band.label,
              value: band.value,
              color: band.color,
            }))}
            centerValue={formatPercent(data?.kpis?.avgKpi?.value ?? 0)}
            centerLabel="o‘rtacha"
            height={214}
          />
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5 px-4">
            {(data?.kpiDistribution ?? []).map((band) => (
              <span key={band.key} className="flex items-center justify-between text-[11.5px]">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="size-2 rounded-full" style={{ backgroundColor: band.color }} />
                  {band.label}
                </span>
                <span className="font-semibold text-ink-2 tabular">{band.value}</span>
              </span>
            ))}
          </div>
        </ChartCard>
      </motion.div>

      {/* ---------------- operational panels ---------------- */}
      <motion.div
        variants={staggerContainer(0.07, 0.06)}
        initial="initial"
        animate="animate"
        className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-3"
      >
        <ReadyToStartPanel
          rows={data?.readyToStart ?? []}
          loading={loading && !data}
          onStart={handleStart}
          startingId={startingId}
        />
        <UpcomingInterviewsPanel rows={data?.upcomingInterviews ?? []} loading={loading && !data} />
        <UrgentTasksPanel rows={data?.urgentTasks ?? []} loading={loading && !data} />
      </motion.div>

      <motion.div
        variants={staggerContainer(0.07, 0.06)}
        initial="initial"
        animate="animate"
        className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-3"
      >
        <OnboardingStagesPanel
          rows={data?.onboardingProgress ?? []}
          total={(data?.onboardingProgress ?? []).reduce((a, b) => a + b.value, 0)}
          loading={loading && !data}
        />
        <ChartCard
          title="Bo‘limlar kesimi"
          subtitle="Shtat soni va o‘rtacha KPI"
          icon={Users}
          loading={loading && !data}
          height={230}
          bodyClassName="px-5"
        >
          <RankBars
            data={(data?.departmentComparison ?? []).map((row) => ({
              name: row.department,
              value: row.headcount,
              color: row.color,
              hint: `KPI ${row.kpi}% · davomat ${row.attendance}%`,
            }))}
            onSelect={(row) => navigate(`/employees?department=${encodeURIComponent(row.name)}`)}
          />
        </ChartCard>
        <RecentHiresPanel rows={data?.recentHires ?? []} loading={loading && !data} />
      </motion.div>

      {refetching && (
        <p className="mt-4 text-center text-[11px] text-faint">Ma’lumotlar yangilanmoqda…</p>
      )}
    </>
  )
}

export default DashboardPage
