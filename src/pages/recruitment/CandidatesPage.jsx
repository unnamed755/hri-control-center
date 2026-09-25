import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  Percent,
  UserPlus,
  UserSearch,
  Users,
  XCircle,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { candidatesService } from '@/services'
import { acceptCandidate, rejectCandidate } from '@/services/workflow/hrWorkflow'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatExperience, formatMoney, formatNumber, formatPhone } from '@/lib/format'
import { candidateStatus, level as levelDict } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { DateRangeInput, Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PersonCell } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { CandidateDrawer } from './components/CandidateDrawer'
import { CandidateFormModal } from './components/CandidateFormModal'

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Tajribasiz' },
  { value: '1-2', label: '1–2 yil' },
  { value: '3-5', label: '3–5 yil' },
  { value: '6+', label: '6+ yil' },
]

const CandidatesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const table = useTableState({
    initialFilters: {
      ...(searchParams.get('status') ? { status: searchParams.get('status') } : {}),
      ...(searchParams.get('vacancy') ? { vacancyId: searchParams.get('vacancy') } : {}),
      ...(searchParams.get('recruiter') ? { recruiterId: searchParams.get('recruiter') } : {}),
    },
    sortBy: 'createdAt',
    sortDir: 'desc',
  })
  const [selectedId, setSelectedId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  // deep link: /candidates?focus=cnd-012 opens the drawer straight away
  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus) {
      setSelectedId(focus)
      searchParams.delete('focus')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.candidates, QK.interviews, QK.onboarding],
    () => candidatesService.getCandidates(table.params),
    { deps: ['candidates', table.params] },
  )
  const { data: facets } = useQuery([QK.candidates, QK.vacancies], () => candidatesService.getCandidateFacets(), {
    deps: ['candidate-facets'],
  })
  const { data: stats } = useQuery([QK.candidates], () => candidatesService.getCandidateStats(), {
    deps: ['candidate-stats'],
  })

  const handleAccept = async (row) => {
    const ok = await askConfirm({
      title: 'Nomzodni qabul qilish',
      description: `${row.fullName} qabul qilinadi va avtomatik ravishda Onboarding jarayoniga o‘tkaziladi. HR mas’ul tayinlanadi va vazifa yaratiladi.`,
      confirmLabel: 'Qabul qilish',
      tone: 'brand',
    })
    if (!ok) return
    const record = await acceptCandidate(row.id)
    toast({
      tone: 'success',
      title: 'Nomzod qabul qilindi',
      description: `Onboarding ochildi · mas’ul: ${record.hrResponsibleName}`,
    })
  }

  const handleReject = async (row) => {
    const ok = await askConfirm({
      title: 'Nomzodni rad etish',
      description: `${row.fullName} rad etilganlar ro‘yxatiga o‘tkaziladi.`,
      confirmLabel: 'Rad etish',
    })
    if (!ok) return
    await rejectCandidate(row.id, 'Talablarga mos emas')
    toast({ tone: 'success', title: 'Nomzod rad etildi', description: row.fullName })
  }

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'F.I.Sh', value: (r) => r.fullName },
        { label: 'Telefon', value: (r) => formatPhone(r.phone) },
        { label: 'Kasb', value: (r) => r.profession },
        { label: 'Tajriba (yil)', value: (r) => r.experienceYears },
        { label: 'Daraja', value: (r) => levelDict.label(r.level) },
        { label: 'Vakansiya', value: (r) => r.vacancyTitle },
        { label: 'Rekruter', value: (r) => r.recruiterName },
        { label: 'Holat', value: (r) => candidateStatus.label(r.status) },
        { label: 'Suhbat', value: (r) => (r.interviewAt ? formatDate(r.interviewAt) : '') },
        { label: 'Manba', value: (r) => r.source },
        { label: 'Qo‘shilgan', value: (r) => formatDate(r.createdAt) },
      ],
      rows,
    )
    download(`hri-nomzodlar-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta nomzod eksport qilindi` })
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Nomzod',
      width: '20%',
      render: (row) => <PersonCell name={row.fullName} subtitle={formatPhone(row.phone)} tone={row.avatarTone} size="sm" />,
    },
    {
      key: 'profession',
      label: 'Kasb',
      render: (row) => (
        <div>
          <p className="text-[12.5px] text-ink-2">{row.profession}</p>
          <p className="text-[11px] text-subtle">{row.department}</p>
        </div>
      ),
    },
    {
      key: 'experienceYears',
      label: 'Tajriba',
      align: 'right',
      width: 92,
      render: (row) => <span className="tabular">{formatExperience(row.experienceYears)}</span>,
    },
    {
      key: 'level',
      label: 'Daraja',
      hideBelow: 'lg',
      render: (row) => <StatusBadge kind="level" value={row.level} size="xs" dot={false} />,
    },
    { key: 'vacancyTitle', label: 'Vakansiya', hideBelow: 'xl' },
    { key: 'recruiterName', label: 'Rekruter', hideBelow: 'xl' },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="candidateStatus" value={row.status} /> },
    {
      key: 'interviewAt',
      label: 'Suhbat',
      hideBelow: 'lg',
      render: (row) =>
        row.interviewAt ? (
          <span className="flex items-center gap-1.5 text-[12px] text-ink-2 tabular">
            <CalendarClock className="size-3.5 text-subtle" strokeWidth={2} />
            {formatDate(row.interviewAt)}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    { key: 'source', label: 'Manba', hideBelow: 'xl' },
    {
      key: 'createdAt',
      label: 'Sana',
      align: 'right',
      render: (row) => <span className="tabular text-subtle">{formatDate(row.createdAt)}</span>,
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
            { label: 'Batafsil', icon: Eye, onClick: () => setSelectedId(row.id) },
            ...(['screening', 'interview'].includes(row.status)
              ? [{ label: 'Qabul qilish', icon: CheckCircle2, onClick: () => handleAccept(row) }]
              : []),
            ...(!['rejected', 'hired'].includes(row.status)
              ? [{ label: 'Rad etish', icon: XCircle, tone: 'danger', onClick: () => handleReject(row) }]
              : []),
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Nomzodlar"
        subtitle="Rekruting pipeline’idagi barcha nomzodlar. Qidiruv kasb, tajriba, daraja va vakansiya bo‘yicha birga ishlaydi — masalan “haydovchi 3”."
        icon={UserSearch}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
            <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setFormOpen(true)}>
              Nomzod qo‘shish
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
          <StatCard label="Faol nomzodlar" value={stats.active} icon={Users} tone="brand" hint={`Jami ${stats.total} ta yozuv`} compact />
          <StatCard label="Suhbat bosqichida" value={stats.interview} icon={CalendarClock} tone="warning" hint={`${stats.thisWeek} ta yangi (7 kun)`} compact />
          <StatCard label="Qabul qilingan" value={stats.accepted + stats.onboarding} icon={CheckCircle2} tone="success" hint={`${stats.hired} ta ishga olingan`} compact />
          <StatCard label="Konversiya" value={stats.conversion} suffix="%" icon={Percent} tone="teal" hint={`${stats.rejected} ta rad etilgan`} compact />
        </motion.div>
      )}

      <Card className="mt-4" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Ism, telefon, kasb, tajriba... (masalan: haydovchi 3)"
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta nomzod` : ''}
        >
          <Select
            className="w-40"
            size="sm"
            value={table.filters.profession}
            onChange={(v) => table.setFilter('profession', v)}
            options={(facets?.professions ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha kasblar"
            placeholder="Kasb"
            searchable
          />
          <Select
            className="w-32"
            size="sm"
            value={table.filters.experience}
            onChange={(v) => table.setFilter('experience', v)}
            options={EXPERIENCE_OPTIONS}
            allLabel="Har qanday tajriba"
            placeholder="Tajriba"
          />
          <Select
            className="w-32"
            size="sm"
            value={table.filters.level}
            onChange={(v) => table.setFilter('level', v)}
            options={levelDict.options()}
            allLabel="Barcha darajalar"
            placeholder="Daraja"
          />
          <Select
            className="w-44"
            size="sm"
            value={table.filters.vacancyId}
            onChange={(v) => table.setFilter('vacancyId', v)}
            options={facets?.vacancies ?? []}
            allLabel="Barcha vakansiyalar"
            placeholder="Vakansiya"
            searchable
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={[{ value: 'active', label: 'Faol pipeline' }, ...candidateStatus.options()]}
            allLabel="Barcha holatlar"
            placeholder="Holat"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.recruiterId}
            onChange={(v) => table.setFilter('recruiterId', v)}
            options={facets?.recruiters ?? []}
            allLabel="Barcha rekruterlar"
            placeholder="Rekruter"
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
          onRowClick={(row) => setSelectedId(row.id)}
          query={table.query}
          onResetFilters={table.reset}
          pagination={{
            page: data?.page ?? 1,
            pages: data?.pages ?? 1,
            total: data?.total ?? 0,
            perPage: table.perPage,
            onChange: table.setPage,
            label: 'nomzod',
          }}
        />
      </Card>

      <CandidateDrawer candidateId={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
      <CandidateFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}

export default CandidatesPage
