import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  MessagesSquare,
  Percent,
  Plus,
  RefreshCcw,
  Video,
  XCircle,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { candidatesService, interviewsService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatDateTime, formatNumber, formatPhone, formatTime } from '@/lib/format'
import { interviewResult, interviewStatus, interviewType } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { DateRangeInput, Select } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PersonCell } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { ScheduleInterviewModal } from '@/pages/recruitment/components/ScheduleInterviewModal'
import { CandidateDrawer } from '@/pages/recruitment/components/CandidateDrawer'
import { InterviewResultModal, RescheduleModal } from './components/InterviewModals'

const InterviewsPage = () => {
  const table = useTableState({ sortBy: 'scheduledAt', sortDir: 'desc', perPage: 12 })
  const [tab, setTab] = useState('all')
  const [resultTarget, setResultTarget] = useState(null)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [scheduleFor, setScheduleFor] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [candidateId, setCandidateId] = useState(null)

  const params = {
    ...table.params,
    filters: { ...table.params.filters, ...(tab !== 'all' ? { status: tab } : {}) },
  }

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.interviews, QK.candidates],
    () => interviewsService.getInterviews(params),
    { deps: ['interviews', params] },
  )
  const { data: stats } = useQuery([QK.interviews], () => interviewsService.getInterviewStats(), {
    deps: ['interview-stats'],
  })
  const { data: facets } = useQuery([QK.interviews], () => interviewsService.getInterviewFacets(), {
    deps: ['interview-facets'],
  })
  const { data: candidates } = useQuery(
    [QK.candidates],
    () => candidatesService.getCandidates({ filters: { status: 'active' }, perPage: 100 }),
    { deps: ['interview-candidate-picker'], enabled: pickerOpen },
  )

  const handleCancel = async (row) => {
    const ok = await askConfirm({
      title: 'Suhbatni bekor qilish',
      description: `${row.candidateName} bilan ${formatDateTime(row.scheduledAt)} dagi suhbat bekor qilinadi.`,
      confirmLabel: 'Bekor qilish',
    })
    if (!ok) return
    await interviewsService.cancelInterview(row.id, 'HR tomonidan bekor qilindi')
    toast({ tone: 'success', title: 'Suhbat bekor qilindi' })
  }

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'Nomzod', value: (r) => r.candidateName },
        { label: 'Telefon', value: (r) => formatPhone(r.phone) },
        { label: 'Vakansiya', value: (r) => r.vacancyTitle },
        { label: 'Suhbatdosh', value: (r) => r.interviewerName },
        { label: 'Turi', value: (r) => interviewType.label(r.type) },
        { label: 'Sana', value: (r) => formatDateTime(r.scheduledAt) },
        { label: 'Holat', value: (r) => interviewStatus.label(r.status) },
        { label: 'Natija', value: (r) => interviewResult.label(r.result) },
        { label: 'Ball', value: (r) => r.score ?? '' },
      ],
      rows,
    )
    download(`hri-suhbatlar-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta suhbat eksport qilindi` })
  }

  const columns = [
    {
      key: 'candidateName',
      label: 'Nomzod',
      render: (row) => <PersonCell name={row.candidateName} subtitle={formatPhone(row.phone)} tone={row.avatarTone} size="sm" />,
    },
    { key: 'vacancyTitle', label: 'Vakansiya', hideBelow: 'md' },
    {
      key: 'type',
      label: 'Turi',
      render: (row) => <StatusBadge kind="interviewType" value={row.type} size="xs" dot={false} />,
    },
    {
      key: 'mode',
      label: 'Format',
      hideBelow: 'xl',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          {row.mode === 'online' ? <Video className="size-3.5" strokeWidth={2} /> : <CalendarDays className="size-3.5" strokeWidth={2} />}
          {row.mode === 'online' ? 'Onlayn' : 'Ofisda'}
        </span>
      ),
    },
    { key: 'interviewerName', label: 'Suhbatdosh', hideBelow: 'lg' },
    {
      key: 'scheduledAt',
      label: 'Sana / vaqt',
      render: (row) => (
        <div>
          <p className="text-[12.5px] text-ink-2 tabular">{formatDate(row.scheduledAt)}</p>
          <p className="text-[11px] text-subtle tabular">
            {formatTime(row.scheduledAt)} · {row.durationMin} daq.
          </p>
        </div>
      ),
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="interviewStatus" value={row.status} /> },
    {
      key: 'result',
      label: 'Natija',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge kind="interviewResult" value={row.result} size="xs" />
          {row.score !== null && row.score !== undefined && (
            <span className="text-[11.5px] text-subtle tabular">{row.score}</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 56,
      sortable: false,
      render: (row) => (
        <Dropdown
          items={[
            { label: 'Nomzodni ochish', icon: MessagesSquare, onClick: () => setCandidateId(row.candidateId) },
            ...(row.status === 'scheduled' || row.status === 'rescheduled'
              ? [
                  { label: 'Natijani kiritish', icon: ClipboardCheck, onClick: () => setResultTarget(row) },
                  { label: 'Vaqtini ko‘chirish', icon: RefreshCcw, onClick: () => setRescheduleTarget(row) },
                  { divider: true },
                  { label: 'Bekor qilish', icon: XCircle, tone: 'danger', onClick: () => handleCancel(row) },
                ]
              : []),
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Suhbatlar"
        subtitle="Rejalashtirilgan va o‘tkazilgan suhbatlar. Natija kiritilganda nomzod holati avtomatik yangilanadi."
        icon={MessagesSquare}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setPickerOpen(true)}>
              Suhbat belgilash
            </Button>
          </>
        }
      />

      {!stats ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard label="Yaqin suhbatlar" value={stats.upcoming} icon={CalendarClock} tone="brand" hint={`Bugun ${stats.today} ta`} compact />
          <StatCard label="O‘tkazilgan" value={stats.completed} icon={CheckCircle2} tone="success" hint={`${stats.passed} ta o‘tdi`} compact />
          <StatCard label="O‘tish foizi" value={stats.passRate} suffix="%" icon={Percent} tone="teal" hint={`O‘rtacha ball ${stats.avgScore}`} compact />
          <StatCard label="Bekor / kelmadi" value={stats.cancelled} icon={XCircle} tone="danger" hint={`Jami ${stats.total} ta yozuv`} compact />
        </motion.div>
      )}

      <Card className="mt-4" padded={false}>
        <div className="px-4 pt-2">
          <Tabs
            id="interviews"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'all', label: 'Barchasi', count: stats?.total },
              { value: 'upcoming', label: 'Yaqinlashayotgan', count: stats?.upcoming, icon: CalendarClock },
              { value: 'today', label: 'Bugun', count: stats?.today },
              { value: 'completed', label: 'O‘tkazilgan', count: stats?.completed, icon: CheckCircle2 },
            ]}
          />
        </div>

        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Nomzod, vakansiya, suhbatdosh..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta suhbat` : ''}
        >
          <Select
            className="w-40"
            size="sm"
            value={table.filters.interviewerId}
            onChange={(v) => table.setFilter('interviewerId', v)}
            options={facets?.interviewers ?? []}
            allLabel="Barcha suhbatdoshlar"
            placeholder="Suhbatdosh"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.type}
            onChange={(v) => table.setFilter('type', v)}
            options={interviewType.options()}
            allLabel="Barcha turlar"
            placeholder="Turi"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.result}
            onChange={(v) => table.setFilter('result', v)}
            options={interviewResult.options()}
            allLabel="Barcha natijalar"
            placeholder="Natija"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.department}
            onChange={(v) => table.setFilter('department', v)}
            options={(facets?.departments ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha bo‘limlar"
            placeholder="Bo‘lim"
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
          onRowClick={(row) => setCandidateId(row.candidateId)}
          query={table.query}
          onResetFilters={table.reset}
          pagination={{
            page: data?.page ?? 1,
            pages: data?.pages ?? 1,
            total: data?.total ?? 0,
            perPage: table.perPage,
            onChange: table.setPage,
            label: 'suhbat',
          }}
        />
      </Card>

      {/* candidate picker → schedule */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        icon={MessagesSquare}
        title="Nomzodni tanlang"
        subtitle="Faol pipeline’dagi nomzodlar"
        size="sm"
      >
        <div className="space-y-1.5">
          {(candidates?.rows ?? []).map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => {
                setScheduleFor(candidate)
                setPickerOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/60 px-3 py-2 text-left transition-colors hover:border-brand/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] text-ink">{candidate.fullName}</span>
                <span className="block truncate text-[11px] text-subtle">
                  {candidate.profession} · {candidate.recruiterName}
                </span>
              </span>
              <StatusBadge kind="candidateStatus" value={candidate.status} size="xs" />
            </button>
          ))}
          {!candidates?.rows?.length && <p className="py-6 text-center text-[12px] text-subtle">Nomzod topilmadi</p>}
        </div>
      </Modal>

      <ScheduleInterviewModal open={Boolean(scheduleFor)} candidate={scheduleFor} onClose={() => setScheduleFor(null)} />
      <InterviewResultModal open={Boolean(resultTarget)} interview={resultTarget} onClose={() => setResultTarget(null)} />
      <RescheduleModal open={Boolean(rescheduleTarget)} interview={rescheduleTarget} onClose={() => setRescheduleTarget(null)} />
      <CandidateDrawer candidateId={candidateId} open={Boolean(candidateId)} onClose={() => setCandidateId(null)} />
    </>
  )
}

export default InterviewsPage
