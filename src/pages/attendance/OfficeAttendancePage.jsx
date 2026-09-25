import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Clock, Download, DoorOpen, LogOut, Timer, Users } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { attendanceService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatHours, formatNumber, formatPercent } from '@/lib/format'
import { attendanceStatus } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PersonCell } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'

const OfficeAttendancePage = () => {
  const table = useTableState({ sortBy: 'checkIn', perPage: 14 })
  const [date, setDate] = useState('')

  const { data: dates } = useQuery([QK.attendance], () => attendanceService.getAttendanceDates(), {
    deps: ['office-dates'],
  })
  const activeDate = date || dates?.[0] || ''

  const { data: offices, loading: officesLoading } = useQuery(
    [QK.attendance],
    () => attendanceService.getOfficeSummary(activeDate),
    { deps: ['office-summary', activeDate], enabled: Boolean(activeDate) },
  )
  const { data: facets } = useQuery([QK.attendance], () => attendanceService.getAttendanceFacets(), {
    deps: ['office-facets'],
  })

  const params = { ...table.params, filters: { ...table.params.filters, date: activeDate } }
  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.attendance, QK.officeAttendance],
    () => attendanceService.getOfficeAttendance(params),
    { deps: ['office-attendance', params], enabled: Boolean(activeDate) },
  )

  const totals = (offices ?? []).reduce(
    (acc, office) => ({
      total: acc.total + office.total,
      inside: acc.inside + office.inside,
      remote: acc.remote + office.remote,
      absent: acc.absent + office.absent,
      capacity: acc.capacity + office.capacity,
    }),
    { total: 0, inside: 0, remote: 0, absent: 0, capacity: 0 },
  )

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'Ofis', value: (r) => r.office },
        { label: 'Xodim', value: (r) => r.fullName },
        { label: 'Lavozim', value: (r) => r.position },
        { label: 'Bo‘lim', value: (r) => r.department },
        { label: 'Kelish', value: (r) => r.checkIn ?? '' },
        { label: 'Ketish', value: (r) => r.checkOut ?? '' },
        { label: 'Ish vaqti', value: (r) => r.hours },
        { label: 'Holat', value: (r) => attendanceStatus.label(r.status) },
      ],
      rows,
    )
    download(`hri-ofis-davomat-${activeDate}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta yozuv eksport qilindi` })
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Xodim',
      render: (row) => <PersonCell name={row.fullName} subtitle={row.position} tone={row.avatarTone} size="sm" />,
    },
    { key: 'office', label: 'Ofis' },
    { key: 'department', label: 'Bo‘lim', hideBelow: 'lg' },
    { key: 'checkIn', label: 'Kelish', align: 'right', render: (row) => <span className="tabular">{row.checkIn ?? '—'}</span> },
    { key: 'checkOut', label: 'Ketish', align: 'right', render: (row) => <span className="tabular">{row.checkOut ?? '—'}</span> },
    {
      key: 'hours',
      label: 'Ish vaqti',
      align: 'right',
      render: (row) => <span className="tabular">{row.hours ? formatHours(row.hours) : '—'}</span>,
    },
    {
      key: 'overtimeHours',
      label: 'Qo‘shimcha',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => (
        <span className={`tabular ${row.overtimeHours ? 'text-teal' : 'text-subtle'}`}>
          {row.overtimeHours ? formatHours(row.overtimeHours) : '—'}
        </span>
      ),
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="attendanceStatus" value={row.status} /> },
    { key: 'source', label: 'Manba', hideBelow: 'xl', render: (row) => <span className="text-subtle">{row.source}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Ofis davomati"
        subtitle="Bosh ofis va filial ofislarida turniket orqali qayd etilgan kelish-ketish vaqtlari, band joylar va ish soatlari."
        icon={Building2}
        actions={
          <>
            <Select
              className="w-44"
              size="sm"
              value={activeDate}
              onChange={(value) => setDate(value || dates?.[0] || '')}
              options={(dates ?? []).map((d) => ({ value: d, label: formatDate(d) }))}
              placeholder="Sana"
              searchable
            />
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
          </>
        }
      />

      {!offices ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard label="Ofisda" value={totals.inside} icon={DoorOpen} tone="success" hint={`${totals.total} ta yozuv`} compact />
          <StatCard label="Masofadan" value={totals.remote} icon={Users} tone="info" hint="Uydan ishlayotganlar" compact />
          <StatCard label="Yo‘q" value={totals.absent} icon={LogOut} tone="danger" hint="Kelmagan yoki ta’tilda" compact />
          <StatCard
            label="Bandlik"
            value={totals.capacity ? Math.round((totals.inside / totals.capacity) * 100) : 0}
            suffix="%"
            icon={Timer}
            tone="violet"
            hint={`Sig‘im ${totals.capacity} joy`}
            compact
          />
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
        className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-3"
      >
        {officesLoading && !offices ? (
          <Card className="lg:col-span-3">
            <SkeletonList rows={3} />
          </Card>
        ) : (
          (offices ?? []).map((office) => (
            <motion.div key={office.id} variants={fadeUp(12)} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{office.name}</p>
                  <p className="text-[11.5px] text-subtle">
                    {office.branch} · sig‘im {office.capacity}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
                  <Building2 className="size-4" strokeWidth={2} />
                </span>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-2">
                <div className="rounded-[9px] bg-white/[0.035] p-2">
                  <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Ofisda</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-success tabular">{office.inside}</p>
                </div>
                <div className="rounded-[9px] bg-white/[0.035] p-2">
                  <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Masofadan</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-info tabular">{office.remote}</p>
                </div>
                <div className="rounded-[9px] bg-white/[0.035] p-2">
                  <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Yo‘q</p>
                  <p className="mt-0.5 text-[15px] font-semibold text-danger tabular">{office.absent + office.leave}</p>
                </div>
              </div>

              <div className="mt-3">
                <ProgressBar value={office.occupancy} label="Bandlik" showValue size="sm" />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-3 text-[11.5px] text-subtle">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" strokeWidth={2} />
                  Birinchi: <span className="text-ink-2 tabular">{office.firstArrival ?? '—'}</span>
                </span>
                <span>
                  O‘rtacha: <span className="text-ink-2 tabular">{formatHours(office.avgHours)}</span>
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <Card className="mt-3.5" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Xodim, ofis, bo‘lim..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta yozuv · ${formatDate(activeDate)}` : ''}
        >
          <Select
            className="w-52"
            size="sm"
            value={table.filters.office}
            onChange={(v) => table.setFilter('office', v)}
            options={facets?.offices ?? []}
            allLabel="Barcha ofislar"
            placeholder="Ofis"
          />
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
            className="w-36"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={attendanceStatus.options()}
            allLabel="Barcha holatlar"
            placeholder="Holat"
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

export default OfficeAttendancePage
