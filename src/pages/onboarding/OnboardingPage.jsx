import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  LayoutGrid,
  Rocket,
  Rows3,
  Timer,
  UserRoundCheck,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { onboardingService } from '@/services'
import { advanceOnboarding, completeOnboarding } from '@/services/workflow/hrWorkflow'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { formatDate, formatNumber } from '@/lib/format'
import { ONBOARDING_STAGES, onboardingStage } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { FilterBar } from '@/components/ui/FilterBar'
import { Select } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar, PersonCell } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Stepper } from '@/components/ui/Stepper'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { ErrorState, NoResults } from '@/components/ui/States'
import { OnboardingDrawer } from './components/OnboardingDrawer'

const VIEWS = [
  { value: 'cards', label: 'Kartalar', icon: LayoutGrid },
  { value: 'table', label: 'Jadval', icon: Rows3 },
]

const OnboardingCard = ({ record, onOpen, onAdvance, onStart, busyId }) => {
  const stageIndex = ONBOARDING_STAGES.indexOf(record.stage)
  const nextStage = ONBOARDING_STAGES[stageIndex + 1]
  const isReady = record.stage === 'ready'
  const isDone = record.stage === 'started'

  return (
    <motion.div variants={fadeUp(12)} whileHover={{ y: -3 }} className="panel flex flex-col p-4 transition-colors hover:border-brand/40">
      <div className="flex items-start gap-3">
        <Avatar name={record.fullName} tone={record.avatarTone} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-ink">{record.fullName}</p>
          <p className="truncate text-[11.5px] text-subtle">
            {record.position} · {record.branch}
          </p>
        </div>
        <StatusBadge kind="onboardingStage" value={record.stage} size="xs" />
      </div>

      <div className="mt-3.5">
        <Stepper
          steps={ONBOARDING_STAGES.map((stage) => ({ key: stage, label: onboardingStage.label(stage) }))}
          currentIndex={stageIndex}
        />
      </div>

      <div className="mt-3">
        <ProgressBar value={record.progress} label={`Checklist ${record.checklistDone}/${record.checklistTotal}`} showValue size="sm" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
        <span className="text-subtle">
          HR mas’ul
          <span className="mt-0.5 block truncate text-ink-2">{record.hrResponsibleName}</span>
        </span>
        <span className="text-subtle">
          START sanasi
          <span className="mt-0.5 block text-ink-2 tabular">{formatDate(record.targetStartDate)}</span>
        </span>
      </div>

      <div className="mt-3.5 flex items-center gap-2 border-t border-line-soft pt-3">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onOpen(record.id)}>
          Ochish
        </Button>
        {isDone ? (
          <Button size="sm" variant="success" className="flex-1" icon={UserRoundCheck} onClick={() => onOpen(record.id)}>
            Yakunlangan
          </Button>
        ) : isReady ? (
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            icon={Rocket}
            loading={busyId === record.id}
            onClick={() => onStart(record)}
          >
            START
          </Button>
        ) : (
          <Button
            size="sm"
            variant="subtle"
            className="flex-1"
            iconRight={ChevronRight}
            loading={busyId === record.id}
            onClick={() => onAdvance(record, nextStage)}
          >
            {onboardingStage.label(nextStage)}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

const OnboardingPage = () => {
  const table = useTableState({ sortBy: 'createdAt', sortDir: 'desc', perPage: 12 })
  const [view, setView] = useState('cards')
  const [selectedId, setSelectedId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.onboarding, QK.candidates, QK.employees],
    () => onboardingService.getOnboardingRecords(table.params),
    { deps: ['onboarding', table.params] },
  )
  const { data: stats } = useQuery([QK.onboarding], () => onboardingService.getOnboardingStats(), {
    deps: ['onboarding-stats'],
  })
  const { data: facets } = useQuery([QK.onboarding], () => onboardingService.getOnboardingFacets(), {
    deps: ['onboarding-facets'],
  })

  const handleAdvance = async (record, stage) => {
    setBusyId(record.id)
    try {
      await advanceOnboarding(record.id, stage)
      toast({ tone: 'success', title: `Bosqich: ${onboardingStage.label(stage)}`, description: record.fullName })
    } finally {
      setBusyId(null)
    }
  }

  const handleStart = async (record) => {
    const ok = await askConfirm({
      title: 'START — xodim qilish',
      description: `${record.fullName} xodimlar ro‘yxatiga qo‘shiladi, payroll va KPI yozuvlari yaratiladi.`,
      confirmLabel: 'START',
      tone: 'brand',
    })
    if (!ok) return
    setBusyId(record.id)
    try {
      const result = await completeOnboarding(record.id)
      toast({
        tone: 'success',
        title: 'Onboarding yakunlandi',
        description: `${result.employee.fullName} · ${result.employee.position} — xodim sifatida faollashtirildi.`,
      })
    } catch (err) {
      toast({ tone: 'danger', title: 'Xatolik', description: err.message })
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Nomzod',
      render: (row) => <PersonCell name={row.fullName} subtitle={row.position} tone={row.avatarTone} size="sm" />,
    },
    { key: 'department', label: 'Bo‘lim', hideBelow: 'md' },
    { key: 'branch', label: 'Filial', hideBelow: 'lg' },
    { key: 'stage', label: 'Bosqich', render: (row) => <StatusBadge kind="onboardingStage" value={row.stage} /> },
    {
      key: 'progress',
      label: 'Progress',
      align: 'right',
      width: 130,
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12px] font-semibold text-ink tabular">{row.progress}%</span>
          <ProgressBar value={row.progress} size="xs" className="w-20" />
        </div>
      ),
    },
    { key: 'hrResponsibleName', label: 'HR mas’ul', hideBelow: 'xl' },
    { key: 'mentorName', label: 'Mentor', hideBelow: 'xl' },
    {
      key: 'targetStartDate',
      label: 'START sanasi',
      align: 'right',
      render: (row) => <span className="tabular">{formatDate(row.targetStartDate)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 130,
      sortable: false,
      render: (row) =>
        row.stage === 'started' ? (
          <StatusBadge label="Yakunlangan" tone="success" size="xs" />
        ) : row.stage === 'ready' ? (
          <Button size="xs" variant="primary" icon={Rocket} loading={busyId === row.id} onClick={() => handleStart(row)}>
            START
          </Button>
        ) : (
          <Button
            size="xs"
            variant="ghost"
            iconRight={ChevronRight}
            loading={busyId === row.id}
            onClick={() => handleAdvance(row, ONBOARDING_STAGES[ONBOARDING_STAGES.indexOf(row.stage) + 1])}
          >
            Keyingi
          </Button>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Onboarding"
        subtitle="Qabul qilingan nomzodlarning moslashuv jarayoni: hujjatlar, HR tekshiruvi, orientatsiya, trening va START. START bosilganda nomzod avtomatik xodimga aylanadi."
        icon={Rocket}
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
          <StatCard label="Jarayonda" value={stats.active} icon={Clock} tone="brand" hint={`O‘rtacha progress ${stats.avgProgress}%`} compact />
          <StatCard label="START kutmoqda" value={stats.readyToStart} icon={Rocket} tone="warning" hint={`${stats.startingThisWeek} ta shu hafta`} compact />
          <StatCard label="Yakunlangan" value={stats.completed} icon={CheckCircle2} tone="success" hint={`${stats.completionRate}% yakunlanish`} compact />
          <StatCard label="O‘rtacha muddat" value={stats.avgDays} suffix="kun" icon={Timer} tone="teal" hint="Qabuldan STARTgacha" compact />
        </motion.div>
      )}

      {/* stage strip — clickable filters */}
      {stats && (
        <motion.div
          variants={staggerContainer(0.04)}
          initial="initial"
          animate="animate"
          className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7"
        >
          {stats.byStage.map((entry) => {
            const active = table.filters.stage === entry.stage
            return (
              <motion.button
                key={entry.stage}
                variants={fadeUp(8)}
                type="button"
                onClick={() => table.setFilter('stage', active ? '' : entry.stage)}
                className={`panel-flat px-3 py-2.5 text-left transition-colors ${
                  active ? 'border-brand/50 bg-brand/8' : 'hover:border-brand/30'
                }`}
              >
                <p className="truncate text-[11px] text-subtle">{onboardingStage.label(entry.stage)}</p>
                <p className="mt-0.5 text-[18px] font-semibold text-ink tabular">{entry.value}</p>
              </motion.button>
            )
          })}
        </motion.div>
      )}

      <Card className="mt-3.5" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Ism, lavozim, HR mas’ul..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta yozuv` : ''}
          actions={<SegmentedControl id="onboarding-view" size="sm" items={VIEWS} value={view} onChange={setView} />}
        >
          <Select
            className="w-44"
            size="sm"
            value={table.filters.stage}
            onChange={(v) => table.setFilter('stage', v)}
            options={[{ value: 'active', label: 'Faol jarayonlar' }, ...onboardingStage.options()]}
            allLabel="Barcha bosqichlar"
            placeholder="Bosqich"
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
            className="w-44"
            size="sm"
            value={table.filters.hrResponsibleId}
            onChange={(v) => table.setFilter('hrResponsibleId', v)}
            options={facets?.hrResponsibles ?? []}
            allLabel="Barcha HR mas’ullar"
            placeholder="HR mas’ul"
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
              label: 'yozuv',
            }}
          />
        ) : (
          <div className="p-4">
            {error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : loading && !data ? (
              <SkeletonList rows={5} />
            ) : !data?.rows.length ? (
              <NoResults query={table.query} onReset={table.reset} />
            ) : (
              <motion.div
                variants={staggerContainer(0.05)}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 gap-3.5 md:grid-cols-2 2xl:grid-cols-3"
              >
                {data.rows.map((record) => (
                  <OnboardingCard
                    key={record.id}
                    record={record}
                    busyId={busyId}
                    onOpen={setSelectedId}
                    onAdvance={handleAdvance}
                    onStart={handleStart}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </Card>

      <OnboardingDrawer recordId={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
    </>
  )
}

export default OnboardingPage
