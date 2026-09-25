import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Banknote,
  CalendarCheck2,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  Play,
  Rocket,
  TrendingUp,
  UserSearch,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { reportsService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { toast } from '@/store/uiStore'
import { cn, download, toCsv } from '@/lib/utils'
import { formatDateTime, formatNumber, monthKey } from '@/lib/format'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { Button } from '@/components/ui/Button'
import { DateRangeInput, Select } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/States'
import { SkeletonList } from '@/components/ui/Skeleton'
import { BarCompare } from '@/components/charts/ChartKit'

const ICONS = {
  UserSearch,
  Users,
  CalendarCheck2,
  Banknote,
  TrendingUp,
  Rocket,
}

const TONES = {
  recruitment: 'text-brand-2 bg-brand/12 border-brand/25',
  employees: 'text-teal bg-teal/12 border-teal/25',
  attendance: 'text-info bg-info/12 border-info/25',
  payroll: 'text-violet bg-violet/12 border-violet/25',
  kpi: 'text-success bg-success/12 border-success/25',
  onboarding: 'text-warning bg-warning/12 border-warning/25',
}

const ReportsPage = () => {
  const [selected, setSelected] = useState('recruitment')
  const [range, setRange] = useState({ from: '', to: '' })
  const [month, setMonth] = useState(monthKey())
  const [report, setReport] = useState(null)

  const { data: types } = useQuery([QK.reports], () => reportsService.getReportTypes(), { deps: ['report-types'] })

  const { mutate: generate, pending } = useMutation(
    () =>
      reportsService.generateReport({
        type: selected,
        from: range.from || undefined,
        to: range.to || undefined,
        filters: ['payroll', 'kpi'].includes(selected) ? { month } : {},
      }),
    {
      successMessage: 'Hisobot tayyorlandi',
      onSuccess: (result) => setReport(result),
    },
  )

  const exportReport = () => {
    if (!report?.rows?.length) {
      toast({ tone: 'warning', title: 'Avval hisobotni yarating' })
      return
    }
    const csv = toCsv(
      report.columns.map((column) => ({
        label: column.label,
        value: (row) => (column.format ? column.format(row[column.key]) : row[column.key]),
      })),
      report.rows,
    )
    download(`hri-${selected}-hisobot-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${report.rows.length} ta qator eksport qilindi` })
  }

  const tableColumns = (report?.columns ?? []).map((column) => ({
    key: column.key,
    label: column.label,
    align: column.align,
    render: (row) => {
      const value = row[column.key]
      const rendered = column.format ? column.format(value) : value
      return <span className={column.align === 'right' ? 'tabular' : ''}>{rendered ?? '—'}</span>
    },
  }))

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        subtitle="Modul bo‘yicha hisobot tanlang, davrni belgilang va demo hisobotni shakllantiring. Eksport lokal CSV fayl sifatida yuklab olinadi."
        icon={FileBarChart2}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportReport} disabled={!report}>
              CSV eksport
            </Button>
            <Button variant="primary" size="sm" icon={Play} loading={pending} onClick={() => generate()}>
              Hisobotni yaratish
            </Button>
          </>
        }
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {(types ?? []).map((type) => {
          const Icon = ICONS[type.icon] ?? FileBarChart2
          const active = selected === type.id
          return (
            <motion.button
              key={type.id}
              variants={fadeUp(10)}
              type="button"
              onClick={() => {
                setSelected(type.id)
                setReport(null)
              }}
              className={cn(
                'panel flex items-start gap-3 p-4 text-left transition-colors',
                active ? 'border-brand/50 bg-brand/[0.06]' : 'hover:border-brand/30',
              )}
            >
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-[11px] border', TONES[type.id])}>
                <Icon className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink">{type.title}</span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{type.description}</span>
              </span>
            </motion.button>
          )
        })}
        {!types && <SkeletonList rows={3} className="sm:col-span-2 xl:col-span-3" />}
      </motion.div>

      <Card className="mt-4" title="Hisobot parametrlari" subtitle="Davr va filtrlarni tanlang" icon={FileSpreadsheet}>
        <div className="flex flex-wrap items-end gap-3">
          {['payroll', 'kpi'].includes(selected) ? (
            <div>
              <p className="mb-1.5 text-[11.5px] font-medium uppercase tracking-[0.07em] text-subtle">Oy</p>
              <Select
                className="w-44"
                value={month}
                onChange={(value) => setMonth(value || monthKey())}
                options={Array.from({ length: 6 }, (_, i) => {
                  const d = new Date()
                  d.setMonth(d.getMonth() - i)
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  return { value: key, label: key }
                })}
              />
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-[11.5px] font-medium uppercase tracking-[0.07em] text-subtle">Davr</p>
              <DateRangeInput value={range} onChange={setRange} />
            </div>
          )}
          <Button variant="primary" icon={Play} loading={pending} onClick={() => generate()}>
            Shakllantirish
          </Button>
          {report && (
            <span className="text-[11.5px] text-subtle">
              Oxirgi yaratilgan: {formatDateTime(report.generatedAt)}
            </span>
          )}
        </div>
      </Card>

      {report ? (
        <>
          <motion.div
            variants={staggerContainer(0.05)}
            initial="initial"
            animate="animate"
            className="mt-3.5 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {report.summary.map((item) => (
              <motion.div key={item.label} variants={fadeUp(10)} className="panel p-4">
                <p className="text-[11px] uppercase tracking-[0.09em] text-subtle">{item.label}</p>
                <p className="mt-1.5 text-[20px] font-semibold text-ink tabular">{item.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {report.chart?.length > 0 && (
            <ChartCard
              className="mt-3.5"
              title={`${report.meta.title} — taqsimot`}
              subtitle="Asosiy kesim"
              icon={FileBarChart2}
              height={250}
            >
              <BarCompare
                data={report.chart}
                xKey="name"
                height={244}
                colorByPoint
                series={[{ key: 'value', label: 'Qiymat', color: 'var(--color-brand)' }]}
              />
            </ChartCard>
          )}

          <Card
            className="mt-3.5"
            title={report.meta.title}
            subtitle={`${formatNumber(report.rows.length)} ta qator`}
            icon={FileSpreadsheet}
            padded={false}
            action={
              <Button variant="ghost" size="xs" icon={Download} onClick={exportReport}>
                Eksport
              </Button>
            }
          >
            <DataTable
              columns={tableColumns}
              rows={report.rows.slice(0, 50)}
              dense
              rowKey={(row, index) => row.id ?? `report-${index}`}
              emptyState={<EmptyState title="Bu davr uchun ma’lumot yo‘q" compact />}
            />
            {report.rows.length > 50 && (
              <p className="border-t border-line-soft px-4 py-3 text-center text-[11.5px] text-subtle">
                Ko‘rinishda dastlabki 50 qator. To‘liq ma’lumot CSV eksportda.
              </p>
            )}
          </Card>
        </>
      ) : (
        <Card className="mt-3.5">
          <EmptyState
            icon={FileBarChart2}
            title="Hisobot hali yaratilmagan"
            description="Yuqoridan hisobot turini tanlang, davrni belgilang va “Shakllantirish” tugmasini bosing."
            action={
              <Button variant="primary" icon={Play} loading={pending} onClick={() => generate()}>
                Hisobotni yaratish
              </Button>
            }
          />
        </Card>
      )}
    </>
  )
}

export default ReportsPage
