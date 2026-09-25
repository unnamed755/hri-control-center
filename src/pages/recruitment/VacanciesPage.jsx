import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Archive,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  Rows3,
  UserRoundCog,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { vacanciesService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { level as levelDict, taskPriority, vacancyStatus } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { FilterBar } from '@/components/ui/FilterBar'
import { Select } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { NoResults, ErrorState } from '@/components/ui/States'
import { VacancyFormModal } from './components/VacancyFormModal'
import { VacancyDrawer } from './components/VacancyDrawer'

const VIEWS = [
  { value: 'cards', label: 'Kartalar', icon: LayoutGrid },
  { value: 'table', label: 'Jadval', icon: Rows3 },
]

const VacancyCard = ({ vacancy, onOpen, onEdit, onArchive }) => {
  const navigate = useNavigate()
  const urgent = vacancy.daysLeft <= 7 && vacancy.status === 'active'
  return (
    <motion.div
      variants={fadeUp(12)}
      whileHover={{ y: -3 }}
      className="panel group flex flex-col p-4 transition-colors hover:border-brand/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold text-ink">{vacancy.title}</h3>
            <StatusBadge kind="vacancyStatus" value={vacancy.status} size="xs" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-subtle">
            <MapPin className="size-3.5" strokeWidth={2} />
            {vacancy.branch} · {vacancy.department}
          </p>
        </div>
        <Dropdown
          items={[
            { label: 'Batafsil', icon: Eye, onClick: () => onOpen(vacancy.id) },
            { label: 'Nomzodlarni ko‘rish', icon: Users, onClick: () => navigate(`/candidates?vacancy=${vacancy.id}`) },
            { label: 'Tahrirlash', icon: Pencil, onClick: () => onEdit(vacancy) },
            { divider: true },
            { label: 'Arxivlash', icon: Archive, tone: 'danger', onClick: () => onArchive(vacancy) },
          ]}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-[9px] bg-white/[0.035] p-2">
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">O‘rin</p>
          <p className="mt-0.5 text-[14px] font-semibold text-ink tabular">{vacancy.openings}</p>
        </div>
        <div className="rounded-[9px] bg-white/[0.035] p-2">
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Nomzod</p>
          <p className="mt-0.5 text-[14px] font-semibold text-ink tabular">{vacancy.candidateCount}</p>
        </div>
        <div className="rounded-[9px] bg-white/[0.035] p-2">
          <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Suhbat</p>
          <p className="mt-0.5 text-[14px] font-semibold text-ink tabular">{vacancy.interviewCount}</p>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-muted">
        {formatMoney(vacancy.salaryFrom, { compact: true, currency: '' })} –{' '}
        {formatMoney(vacancy.salaryTo, { compact: true })}
      </p>

      <div className="mt-3">
        <ProgressBar value={vacancy.fillRate} label="To‘ldirilgan" showValue size="sm" />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-3 text-[11.5px]">
        <span className="flex items-center gap-1.5 text-subtle">
          <UserRoundCog className="size-3.5" strokeWidth={2} />
          {vacancy.recruiterName}
        </span>
        <span className={`flex items-center gap-1.5 ${urgent ? 'text-danger' : 'text-subtle'}`}>
          <CalendarClock className="size-3.5" strokeWidth={2} />
          {vacancy.status === 'active'
            ? vacancy.daysLeft >= 0
              ? `${vacancy.daysLeft} kun qoldi`
              : 'Muddati o‘tgan'
            : formatDate(vacancy.deadline)}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onOpen(vacancy.id)}>
          Batafsil
        </Button>
        <Button
          size="sm"
          variant="subtle"
          className="flex-1"
          onClick={() => navigate(`/candidates?vacancy=${vacancy.id}`)}
        >
          Nomzodlar
        </Button>
      </div>
    </motion.div>
  )
}

const VacanciesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const table = useTableState({ sortBy: 'createdAt', sortDir: 'desc', perPage: 12 })
  const [view, setView] = useState('cards')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    const focus = searchParams.get('focus')
    if (focus) {
      setSelectedId(focus)
      searchParams.delete('focus')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.vacancies, QK.candidates],
    () => vacanciesService.getVacancies(table.params),
    { deps: ['vacancies', table.params] },
  )
  const { data: facets } = useQuery(QK.vacancies, () => vacanciesService.getVacancyFacets(), { deps: ['vacancy-facets'] })
  const { data: stats } = useQuery([QK.vacancies, QK.candidates], () => vacanciesService.getVacancyStats(), {
    deps: ['vacancy-stats'],
  })

  const handleArchive = async (vacancy) => {
    const ok = await askConfirm({
      title: 'Vakansiyani arxivlash',
      description: `${vacancy.title} (${vacancy.branch}) arxivga o‘tkaziladi va yangi nomzod qabul qilinmaydi.`,
      confirmLabel: 'Arxivlash',
    })
    if (!ok) return
    await vacanciesService.setVacancyStatus(vacancy.id, 'archived')
    toast({ tone: 'success', title: 'Vakansiya arxivlandi', description: vacancy.title })
  }

  const columns = [
    {
      key: 'title',
      label: 'Vakansiya',
      render: (row) => (
        <div>
          <p className="text-[12.5px] font-medium text-ink">{row.title}</p>
          <p className="text-[11px] text-subtle">
            {row.code} · {row.department}
          </p>
        </div>
      ),
    },
    { key: 'branch', label: 'Filial', hideBelow: 'md' },
    { key: 'level', label: 'Daraja', hideBelow: 'lg', render: (row) => <StatusBadge kind="level" value={row.level} size="xs" dot={false} /> },
    { key: 'openings', label: 'O‘rin', align: 'right', width: 70 },
    {
      key: 'candidateCount',
      label: 'Nomzod',
      align: 'right',
      width: 84,
      render: (row) => (
        <span className="tabular">
          {row.candidateCount}
          <span className="ml-1 text-[11px] text-subtle">({row.activeCandidates} faol)</span>
        </span>
      ),
    },
    { key: 'recruiterName', label: 'Rekruter', hideBelow: 'xl' },
    {
      key: 'priority',
      label: 'Muhimlik',
      hideBelow: 'lg',
      render: (row) => <StatusBadge kind="taskPriority" value={row.priority} size="xs" />,
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="vacancyStatus" value={row.status} /> },
    {
      key: 'deadline',
      label: 'Muddat',
      align: 'right',
      render: (row) => (
        <span className={`tabular ${row.status === 'active' && row.daysLeft <= 7 ? 'text-danger' : 'text-muted'}`}>
          {formatDate(row.deadline)}
        </span>
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
            { label: 'Batafsil', icon: Eye, onClick: () => setSelectedId(row.id) },
            { label: 'Tahrirlash', icon: Pencil, onClick: () => { setEditing(row); setFormOpen(true) } },
            { divider: true },
            { label: 'Arxivlash', icon: Archive, tone: 'danger', onClick: () => handleArchive(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Vakansiyalar"
        subtitle="Ochiq, pauzadagi va yopilgan vakansiyalar; har biri bo‘yicha nomzodlar oqimi va rekruter mas’uliyati."
        icon={BriefcaseBusiness}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Vakansiya yaratish
          </Button>
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
          <StatCard label="Aktiv vakansiyalar" value={stats.active} icon={BriefcaseBusiness} tone="brand" hint={`${stats.openings} ta bo‘sh o‘rin`} compact />
          <StatCard label="Muddati yaqin" value={stats.expiringSoon} icon={Clock} tone="danger" hint="7 kun ichida" compact />
          <StatCard label="Yopilgan" value={stats.closed} icon={CheckCircle2} tone="success" hint={`${stats.paused} ta pauzada`} compact />
          <StatCard label="Nomzod / vakansiya" value={stats.candidatesPerVacancy} icon={Users} tone="teal" format={(v) => v.toFixed(1)} hint="O‘rtacha oqim" compact />
        </motion.div>
      )}

      <Card className="mt-4" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Vakansiya nomi, bo‘lim, filial..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta vakansiya` : ''}
          actions={<SegmentedControl id="vacancy-view" size="sm" items={VIEWS} value={view} onChange={setView} />}
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
            options={vacancyStatus.options()}
            allLabel="Barcha holatlar"
            placeholder="Holat"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.priority}
            onChange={(v) => table.setFilter('priority', v)}
            options={taskPriority.options()}
            allLabel="Barcha muhimlik"
            placeholder="Muhimlik"
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
          <Select
            className="w-32"
            size="sm"
            value={table.filters.level}
            onChange={(v) => table.setFilter('level', v)}
            options={levelDict.options()}
            allLabel="Barcha darajalar"
            placeholder="Daraja"
          />
        </FilterBar>

        {view === 'table' ? (
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
              label: 'vakansiya',
            }}
          />
        ) : (
          <div className="p-4">
            {error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : loading && !data ? (
              <SkeletonList rows={6} />
            ) : !data?.rows.length ? (
              <NoResults query={table.query} onReset={table.reset} />
            ) : (
              <motion.div
                variants={staggerContainer(0.05)}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              >
                {data.rows.map((vacancy) => (
                  <VacancyCard
                    key={vacancy.id}
                    vacancy={vacancy}
                    onOpen={setSelectedId}
                    onEdit={(v) => {
                      setEditing(v)
                      setFormOpen(true)
                    }}
                    onArchive={handleArchive}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </Card>

      <VacancyDrawer
        vacancyId={selectedId}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onEdit={(v) => {
          setSelectedId(null)
          setEditing(v)
          setFormOpen(true)
        }}
      />
      <VacancyFormModal open={formOpen} vacancy={editing} onClose={() => setFormOpen(false)} />
    </>
  )
}

export default VacanciesPage
