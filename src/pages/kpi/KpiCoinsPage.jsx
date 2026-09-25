import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, Coins, Download, Gauge, Sparkles, TrendingUp, Users } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { kpiService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatMonthKey, formatNumber, formatPercent, monthKey } from '@/lib/format'
import { kpiBand } from '@/data/mock/kpi'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PersonCell } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { AreaTrend, BarCompare, RankBars } from '@/components/charts/ChartKit'

const KpiCoinsPage = () => {
  const navigate = useNavigate()
  const [month, setMonth] = useState(monthKey())
  const table = useTableState({ sortBy: 'kpi', sortDir: 'desc', perPage: 12 })

  const params = { ...table.params, filters: { ...table.params.filters, month } }

  const { data: months } = useQuery([QK.kpi], () => kpiService.getKpiMonths(), { deps: ['kpi-coins-months'] })
  const { data: summary } = useQuery([QK.kpi, QK.employees], () => kpiService.getKpiSummary(month), {
    deps: ['kpi-coins-summary', month],
  })
  const { data: departments } = useQuery([QK.kpi, QK.employees], () => kpiService.getDepartmentPerformance(month), {
    deps: ['kpi-coins-departments', month],
  })
  const { data: facets } = useQuery([QK.kpi], () => kpiService.getKpiFacets(), { deps: ['kpi-coins-facets'] })
  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.kpi, QK.employees],
    () => kpiService.getKpiRecords(params),
    { deps: ['kpi-coins-records', params] },
  )

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'Xodim', value: (r) => r.fullName },
        { label: 'Lavozim', value: (r) => r.position },
        { label: 'Bo‘lim', value: (r) => r.department },
        { label: 'KPI', value: (r) => r.kpi },
        { label: 'Sifat', value: (r) => r.qualityScore },
        { label: 'Intizom', value: (r) => r.disciplineScore },
        { label: 'Vazifalar', value: (r) => `${r.tasksCompleted}/${r.tasksPlanned}` },
        { label: 'Coins', value: (r) => r.coins },
      ],
      rows,
    )
    download(`hri-kpi-coins-${month}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta yozuv eksport qilindi` })
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Xodim',
      render: (row) => <PersonCell name={row.fullName} subtitle={`${row.position} · ${row.department}`} tone={row.avatarTone} size="sm" />,
    },
    { key: 'branch', label: 'Filial', hideBelow: 'lg' },
    {
      key: 'kpi',
      label: 'KPI',
      align: 'right',
      width: 140,
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <ProgressBar value={row.kpi} size="xs" className="w-16" />
          <span className="w-9 text-right text-[12.5px] font-semibold text-ink tabular">{row.kpi}%</span>
        </div>
      ),
    },
    {
      key: 'band',
      label: 'Guruh',
      sortable: false,
      hideBelow: 'xl',
      render: (row) => <StatusBadge label={kpiBand(row.kpi).label} tone={kpiBand(row.kpi).tone} size="xs" />,
    },
    { key: 'qualityScore', label: 'Sifat', align: 'right', hideBelow: 'lg', render: (row) => <span className="tabular">{row.qualityScore}</span> },
    {
      key: 'disciplineScore',
      label: 'Intizom',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="tabular">{row.disciplineScore}</span>,
    },
    {
      key: 'tasksCompleted',
      label: 'Vazifalar',
      align: 'right',
      hideBelow: 'lg',
      render: (row) => (
        <span className="tabular text-muted">
          {row.tasksCompleted}
          <span className="text-subtle">/{row.tasksPlanned}</span>
        </span>
      ),
    },
    {
      key: 'coins',
      label: 'Coins',
      align: 'right',
      render: (row) => (
        <span className="flex items-center justify-end gap-1.5 font-semibold text-warning tabular">
          <Coins className="size-3.5" strokeWidth={2} />
          {formatNumber(row.coins)}
        </span>
      ),
    },
    {
      key: 'trend',
      label: 'O‘zgarish',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => (
        <span className={`tabular ${row.trend > 0 ? 'text-success' : row.trend < 0 ? 'text-danger' : 'text-subtle'}`}>
          {row.trend > 0 ? '+' : ''}
          {row.trend}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="KPI & Coins"
        subtitle="Samaradorlik ballari va ichki motivatsiya tizimi. Coins KPI, davomat va vazifalarni bajarish asosida hisoblanadi."
        icon={Coins}
        actions={
          <>
            <Select
              className="w-40"
              size="sm"
              value={month}
              onChange={(value) => setMonth(value || monthKey())}
              options={(months ?? [monthKey()]).map((m) => ({ value: m, label: formatMonthKey(m, false) }))}
            />
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
          </>
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
          <StatCard label="O‘rtacha KPI" value={summary.average} suffix="%" change={summary.change} icon={Gauge} tone="brand" hint={`${summary.employees} ta xodim`} compact />
          <StatCard
            label="Jami coins"
            value={summary.coins}
            icon={Coins}
            tone="warning"
            hint={`O‘tgan oy ${formatNumber(summary.coinsPrev)}`}
            compact
          />
          <StatCard label="90%+ natija" value={summary.above90} icon={Award} tone="success" hint={`Sifat ${summary.avgQuality}%`} compact />
          <StatCard label="Intizom bali" value={summary.avgDiscipline} suffix="%" icon={Sparkles} tone="teal" hint={`${summary.below70} ta past KPI`} compact />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-5"
          title="Coins dinamikasi"
          subtitle="Oylar bo‘yicha to‘plangan coins"
          icon={Coins}
          loading={!summary}
          height={240}
        >
          <AreaTrend
            data={summary?.trend ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={234}
            series={[{ key: 'coins', label: 'Coins', color: 'var(--color-warning)' }]}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Bo‘limlar coins"
          subtitle={formatMonthKey(month, false)}
          icon={Users}
          loading={!departments}
          height={240}
          bodyClassName="px-5"
        >
          <RankBars
            data={(departments ?? []).map((row) => ({ name: row.department, value: row.coins }))}
            valueFormatter={(v) => formatNumber(v)}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-3"
          title="KPI guruhlari"
          subtitle="Xodimlar taqsimoti"
          icon={TrendingUp}
          loading={!summary}
          height={240}
        >
          <BarCompare
            data={(summary?.distribution ?? []).map((band) => ({ name: band.label, value: band.value, color: band.color }))}
            xKey="name"
            height={234}
            colorByPoint
            series={[{ key: 'value', label: 'Xodimlar', color: 'var(--color-brand)' }]}
          />
        </ChartCard>
      </div>

      <Card className="mt-3.5" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Xodim, lavozim, bo‘lim..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta yozuv` : ''}
        >
          <Select
            className="w-40"
            size="sm"
            value={table.filters.department}
            onChange={(v) => table.setFilter('department', v)}
            options={(facets?.departments ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha bo‘limlar"
            placeholder="Bo‘lim"
          />
          <Select
            className="w-40"
            size="sm"
            value={table.filters.branch}
            onChange={(v) => table.setFilter('branch', v)}
            options={(facets?.branches ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha filiallar"
            placeholder="Filial"
            searchable
          />
          <Select
            className="w-40"
            size="sm"
            value={table.filters.band}
            onChange={(v) => table.setFilter('band', v)}
            options={facets?.bands ?? []}
            allLabel="Barcha guruhlar"
            placeholder="KPI guruhi"
          />
        </FilterBar>

        <DataTable
          columns={columns}
          rows={data?.rows ?? []}
          loading={loading}
          refetching={refetching}
          error={error}
          onRetry={refetch}
          sort={table.sort}
          onSort={table.toggleSort}
          onRowClick={(row) => navigate(`/employees/${row.employeeId}`)}
          query={table.query}
          onResetFilters={table.reset}
          pagination={{
            page: data?.page ?? 1,
            pages: data?.pages ?? 1,
            total: data?.total ?? 0,
            perPage: table.perPage,
            onChange: table.setPage,
            label: 'yozuv',
          }}
        />
      </Card>
    </>
  )
}

export default KpiCoinsPage
