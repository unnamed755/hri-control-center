import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCheck,
  Database,
  Download,
  Eye,
  Globe2,
  Percent,
  Plug,
  UserRoundCog,
  UserSearch,
  XCircle,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { recruiterWebService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatExperience, formatMoney, formatNumber, formatPhone, relativeTime } from '@/lib/format'
import { externalStatus, level as levelDict } from '@/config/dictionaries'
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
import { RankBars } from '@/components/charts/ChartKit'
import { ImportCandidateModal } from './components/ImportCandidateModal'

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Tajribasiz' },
  { value: '1-2', label: '1–2 yil' },
  { value: '3-5', label: '3–5 yil' },
  { value: '6+', label: '6+ yil' },
]

const FLOW = [
  { label: 'Tashqi manbalar', hint: 'OLX · hh.uz · Telegram · Sayt', icon: Globe2 },
  { label: 'Recruiter Web', hint: 'Arizalar oqimi va saralash', icon: Database },
  { label: 'Rekruter', hint: 'Mas’ul tayinlanadi', icon: UserRoundCog },
  { label: 'Nomzodlar bazasi', hint: 'Pipeline boshlanadi', icon: UserSearch },
]

const RecruiterWebPage = () => {
  const navigate = useNavigate()
  const table = useTableState({ sortBy: 'importedAt', sortDir: 'desc', perPage: 12 })
  const [importing, setImporting] = useState(null)

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.externalCandidates, QK.candidates],
    () => recruiterWebService.getExternalCandidates(table.params),
    { deps: ['external', table.params] },
  )
  const { data: stats } = useQuery([QK.externalCandidates], () => recruiterWebService.getExternalStats(), {
    deps: ['external-stats'],
  })
  const { data: facets } = useQuery([QK.externalCandidates], () => recruiterWebService.getExternalFacets(), {
    deps: ['external-facets'],
  })

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
        { label: 'Tajriba', value: (r) => r.experienceYears },
        { label: 'Manba', value: (r) => r.source },
        { label: 'Shahar', value: (r) => r.city },
        { label: 'Moslik', value: (r) => r.matchScore },
        { label: 'Holat', value: (r) => externalStatus.label(r.status) },
        { label: 'Kelgan sana', value: (r) => formatDate(r.importedAt) },
      ],
      rows,
    )
    download(`hri-recruiter-web-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta ariza eksport qilindi` })
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Nomzod',
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
    { key: 'level', label: 'Daraja', hideBelow: 'lg', render: (row) => <StatusBadge kind="level" value={row.level} size="xs" dot={false} /> },
    { key: 'city', label: 'Shahar', hideBelow: 'xl' },
    {
      key: 'source',
      label: 'Manba',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
          <Globe2 className="size-3.5 text-subtle" strokeWidth={2} />
          {row.source}
        </span>
      ),
    },
    {
      key: 'matchScore',
      label: 'Moslik',
      align: 'right',
      width: 110,
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12.5px] font-semibold text-ink tabular">{row.matchScore}%</span>
          <ProgressBar value={row.matchScore} size="xs" className="w-14" />
        </div>
      ),
    },
    {
      key: 'expectedSalary',
      label: 'Kutilgan oylik',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="tabular">{formatMoney(row.expectedSalary, { compact: true, currency: '' })}</span>,
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="externalStatus" value={row.status} /> },
    {
      key: 'importedAt',
      label: 'Kelgan',
      align: 'right',
      render: (row) => <span className="tabular text-subtle">{relativeTime(row.importedAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 190,
      sortable: false,
      render: (row) =>
        row.status === 'imported' ? (
          <Button
            size="xs"
            variant="ghost"
            icon={Eye}
            onClick={() => navigate(row.candidateId ? `/candidates?focus=${row.candidateId}` : '/candidates')}
          >
            Bazada ko‘rish
          </Button>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            {row.status === 'new' && (
              <Button size="xs" variant="ghost" icon={CheckCheck} onClick={() => recruiterWebService.markReviewed(row.id)}>
                Ko‘rildi
              </Button>
            )}
            {row.status !== 'rejected' && (
              <Button size="xs" variant="primary" icon={ArrowRight} onClick={() => setImporting(row)}>
                Bazaga
              </Button>
            )}
            {row.status !== 'rejected' && (
              <Button
                size="icon-sm"
                variant="ghost"
                icon={XCircle}
                title="Mos emas"
                onClick={async () => {
                  await recruiterWebService.rejectExternal(row.id, 'Mos emas')
                  toast({ tone: 'success', title: 'Ariza rad etildi' })
                }}
              />
            )}
          </div>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Recruiter Web"
        subtitle="Tashqi manbalardan kelgan arizalar oqimi. Bu DEMO manba — ertaga shu modulning o‘rniga real integratsiya (OLX / hh.uz / Telegram bot) ulanadi, sahifa va import oqimi o‘zgarmaydi."
        icon={Globe2}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
            <Button variant="subtle" size="sm" icon={Plug} onClick={() => toast({ tone: 'info', title: 'Integratsiya nuqtasi', description: 'services/api/recruiterWeb.js — real API shu yerda ulanadi.' })}>
              Integratsiya
            </Button>
          </>
        }
      />

      {/* flow strip */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial="initial"
        animate="animate"
        className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {FLOW.map((step, index) => (
          <motion.div
            key={step.label}
            variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
            className="panel-flat relative flex items-center gap-3 px-3.5 py-3"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
              <step.icon className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-medium text-ink">{step.label}</p>
              <p className="truncate text-[11px] text-subtle">{step.hint}</p>
            </div>
            {index < FLOW.length - 1 && (
              <ArrowRight className="absolute -right-3 top-1/2 hidden size-4 -translate-y-1/2 text-faint xl:block" strokeWidth={2} />
            )}
          </motion.div>
        ))}
      </motion.div>

      {!stats ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard label="Yangi arizalar" value={stats.new} icon={Globe2} tone="info" hint={`Jami ${stats.total} ta`} compact />
          <StatCard label="Ko‘rib chiqilgan" value={stats.reviewed} icon={CheckCheck} tone="violet" hint={`${stats.duplicates} ta dublikat`} compact />
          <StatCard label="Bazaga olingan" value={stats.imported} icon={Database} tone="success" hint={`${stats.withCv} ta rezyume bilan`} compact />
          <StatCard label="Konversiya" value={stats.conversion} suffix="%" icon={Percent} tone="teal" hint={`O‘rtacha moslik ${stats.avgMatch}%`} compact />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-4">
        <ChartCard
          className="xl:col-span-1"
          title="Manbalar samarasi"
          subtitle="Arizalar soni"
          icon={Globe2}
          loading={!stats}
          height={260}
          bodyClassName="px-5"
        >
          <RankBars data={(stats?.bySource ?? []).map((s) => ({ name: s.name, value: s.value }))} />
        </ChartCard>

        <Card className="xl:col-span-3" padded={false}>
          <FilterBar
            query={table.query}
            onQueryChange={table.setQuery}
            placeholder="Ism, telefon, kasb, tajriba..."
            activeCount={table.activeFilterCount}
            onReset={table.reset}
            resultLabel={data ? `${formatNumber(data.total)} ta ariza` : ''}
          >
            <Select
              className="w-36"
              size="sm"
              value={table.filters.source}
              onChange={(v) => table.setFilter('source', v)}
              options={(facets?.sources ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
              allLabel="Barcha manbalar"
              placeholder="Manba"
            />
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
              className="w-36"
              size="sm"
              value={table.filters.status}
              onChange={(v) => table.setFilter('status', v)}
              options={externalStatus.options()}
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
            pagination={{
              page: data?.page ?? 1,
              pages: data?.pages ?? 1,
              total: data?.total ?? 0,
              perPage: table.perPage,
              onChange: table.setPage,
              label: 'ariza',
            }}
          />
        </Card>
      </div>

      <ImportCandidateModal
        open={Boolean(importing)}
        external={importing}
        onClose={() => setImporting(null)}
        onImported={(candidate) =>
          toast({
            tone: 'success',
            title: 'Nomzod bazaga qo‘shildi',
            description: `${candidate.fullName} endi "Nomzodlar" sahifasida ko‘rinadi.`,
          })
        }
      />
    </>
  )
}

export default RecruiterWebPage
