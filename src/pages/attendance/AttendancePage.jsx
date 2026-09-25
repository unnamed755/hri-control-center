import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck2,
  Clock,
  Download,
  Laptop,
  Percent,
  TimerOff,
  UserCheck,
  UserX,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { attendanceService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatHours, formatNumber, formatPercent } from '@/lib/format'
import { ATTENDANCE_COLORS, attendanceStatus } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { DateRangeInput, Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PersonCell } from '@/components/ui/Avatar'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { BarCompare, DonutChart, RankBars } from '@/components/charts/ChartKit'

const AttendancePage = () => {
  const table = useTableState({ sortBy: 'date', sortDir: 'desc', perPage: 14 })
  const [scopeDate, setScopeDate] = useState('')

  const { data: dates } = useQuery([QK.attendance], () => attendanceService.getAttendanceDates(), {
    deps: ['attendance-dates'],
  })
  const activeDate = scopeDate || dates?.[0] || ''
  const scope = {
    date: activeDate,
    department: table.filters.department,
    branch: table.filters.branch,
  }

  const { data: summary } = useQuery([QK.attendance], () => attendanceService.getAttendanceSummary(scope), {
    deps: ['attendance-summary', scope],
  })
  const { data: trend } = useQuery(
    [QK.attendance],
    () => attendanceService.getAttendanceTrend({ days: 14, department: table.filters.department, branch: table.filters.branch }),
    { deps: ['attendance-trend', table.filters.department, table.filters.branch] },
  )
  const { data: departments } = useQuery(
    [QK.attendance],
    () => attendanceService.getDepartmentAttendance({ branch: table.filters.branch }),
    { deps: ['attendance-departments', table.filters.branch] },
  )
  const { data: facets } = useQuery([QK.attendance], () => attendanceService.getAttendanceFacets(), {
    deps: ['attendance-facets'],
  })

  const params = {
    ...table.params,
    filters: { ...table.params.filters, ...(scopeDate ? { date: scopeDate } : {}) },
  }
  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.attendance, QK.employees],
    () => attendanceService.getAttendance(params),
    { deps: ['attendance', params] },
  )

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'Sana', value: (r) => formatDate(r.date) },
        { label: 'Xodim', value: (r) => r.fullName },
        { label: 'Bo‘lim', value: (r) => r.department },
        { label: 'Filial', value: (r) => r.branch },
        { label: 'Holat', value: (r) => attendanceStatus.label(r.status) },
        { label: 'Kirish', value: (r) => r.checkIn ?? '' },
        { label: 'Chiqish', value: (r) => r.checkOut ?? '' },
        { label: 'Soat', value: (r) => r.hours },
        { label: 'Kechikish (daq)', value: (r) => r.lateMinutes },
        { label: 'Manba', value: (r) => r.source },
      ],
      rows,
    )
    download(`hri-davomat-${activeDate || 'all'}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta yozuv eksport qilindi` })
  }

  const donutData = (summary?.distribution ?? []).map((entry) => ({
    name: attendanceStatus.label(entry.key),
    value: entry.value,
    color: ATTENDANCE_COLORS[entry.key],
  }))

  const columns = [
    { key: 'date', label: 'Sana', width: 110, render: (row) => <span className="tabular">{formatDate(row.date)}</span> },
    {
      key: 'fullName',
      label: 'Xodim',
      render: (row) => <PersonCell name={row.fullName} subtitle={row.position} tone={row.avatarTone} size="sm" />,
    },
    { key: 'department', label: 'Bo‘lim', hideBelow: 'md' },
    { key: 'branch', label: 'Filial', hideBelow: 'lg' },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="attendanceStatus" value={row.status} /> },
    { key: 'checkIn', label: 'Kirish', align: 'right', render: (row) => <span className="tabular">{row.checkIn ?? '—'}</span> },
    { key: 'checkOut', label: 'Chiqish', align: 'right', render: (row) => <span className="tabular">{row.checkOut ?? '—'}</span> },
    {
      key: 'hours',
      label: 'Soat',
      align: 'right',
      render: (row) => <span className="tabular">{row.hours ? formatHours(row.hours) : '—'}</span>,
    },
    {
      key: 'lateMinutes',
      label: 'Kechikish',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => (
        <span className={`tabular ${row.lateMinutes ? 'text-warning' : 'text-subtle'}`}>
          {row.lateMinutes ? `${row.lateMinutes} daq.` : '—'}
        </span>
      ),
    },
    { key: 'source', label: 'Manba', hideBelow: 'xl', render: (row) => <span className="text-subtle">{row.source}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Davomat"
        subtitle="Turniket va mobil ilova ma’lumotlari asosidagi kunlik davomat. Ko‘rsatkichlar xodimlar profiliga va KPI hisobiga bevosita ta’sir qiladi."
        icon={CalendarCheck2}
        actions={
          <>
            <Select
              className="w-44"
              size="sm"
              value={activeDate}
              onChange={(value) => setScopeDate(value)}
              options={(dates ?? []).map((d) => ({ value: d, label: formatDate(d) }))}
              allLabel="Barcha sanalar"
              placeholder="Sana"
              searchable
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
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-5"
        >
          <StatCard label="Kelgan" value={summary.present} icon={UserCheck} tone="success" hint={`${formatPercent(summary.rate)} davomat`} compact />
          <StatCard label="Kechikkan" value={summary.late} icon={Clock} tone="warning" hint={`${summary.lateMinutes} daqiqa jami`} compact />
          <StatCard label="Kelmagan" value={summary.absent} icon={UserX} tone="danger" hint={`${summary.leave} ta ta’tilda`} compact />
          <StatCard label="Masofadan" value={summary.remote} icon={Laptop} tone="info" hint="Ofis xodimlari" compact />
          <StatCard
            label="O‘rtacha soat"
            value={summary.avgHours}
            format={(v) => v.toFixed(1)}
            suffix="soat"
            icon={TimerOff}
            tone="teal"
            hint={`Jami ${formatNumber(summary.totalHours)} soat`}
            compact
          />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-5"
          title="Kunlik davomat"
          subtitle="Oxirgi 14 kun"
          icon={CalendarCheck2}
          loading={!trend}
          height={250}
          legend={[
            { label: 'Kelgan', color: ATTENDANCE_COLORS.present },
            { label: 'Kechikkan', color: ATTENDANCE_COLORS.late },
            { label: 'Kelmagan', color: ATTENDANCE_COLORS.absent },
            { label: 'Masofadan', color: ATTENDANCE_COLORS.remote },
          ]}
        >
          <BarCompare
            data={trend ?? []}
            xKey="date"
            xFormatter={(v) => formatDate(v).slice(0, 5)}
            height={244}
            stacked
            series={[
              { key: 'present', label: 'Kelgan', color: ATTENDANCE_COLORS.present },
              { key: 'late', label: 'Kechikkan', color: ATTENDANCE_COLORS.late },
              { key: 'remote', label: 'Masofadan', color: ATTENDANCE_COLORS.remote },
              { key: 'absent', label: 'Kelmagan', color: ATTENDANCE_COLORS.absent },
            ]}
            yFormatter={(v) => formatNumber(v)}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-3"
          title="Taqsimot"
          subtitle={activeDate ? formatDate(activeDate) : 'Barcha sanalar'}
          icon={Percent}
          loading={!summary}
          height={250}
        >
          <DonutChart data={donutData} centerValue={formatPercent(summary?.rate ?? 0)} centerLabel="davomat" height={232} />
        </ChartCard>

        <ChartCard
          className="xl:col-span-4"
          title="Bo‘limlar taqqoslash"
          subtitle="Davomat foizi"
          icon={UserCheck}
          loading={!departments}
          height={250}
          bodyClassName="px-5"
        >
          <RankBars
            data={(departments ?? []).map((row) => ({
              name: row.department,
              value: row.rate,
              hint: `${row.headcount} xodim · ${row.late} kechikish`,
            }))}
            valueFormatter={(v) => `${v}%`}
            max={100}
          />
        </ChartCard>
      </div>

      <Card className="mt-3.5" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Xodim, bo‘lim, filial..."
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
            className="w-36"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={attendanceStatus.options()}
            allLabel="Barcha holatlar"
            placeholder="Holat"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.source}
            onChange={(v) => table.setFilter('source', v)}
            options={(facets?.sources ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha manbalar"
            placeholder="Manba"
          />
          <DateRangeInput value={table.range} onChange={table.setRange} className="[&_input]:h-8.5 [&_input]:text-[12.5px]" />
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
          query={table.query}
          onResetFilters={table.reset}
          dense
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

export default AttendancePage
