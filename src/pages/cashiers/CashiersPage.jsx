import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Coins,
  CreditCard,
  Download,
  Eye,
  LayoutGrid,
  Receipt,
  Rows3,
  TrendingUp,
  UserPlus,
  Wallet2,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer, fadeUp } from '@/lib/motion'
import { cashiersService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDateTime, formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { employeeStatus, level as levelDict } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { FilterBar } from '@/components/ui/FilterBar'
import { DateRangeInput, Select } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar, PersonCell } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { NoResults, ErrorState } from '@/components/ui/States'
import { EmployeeDrawer } from '@/pages/employees/components/EmployeeDrawer'
import { EmployeeFormModal } from '@/pages/employees/components/EmployeeFormModal'

const VIEWS = [
  { value: 'groups', label: 'Filiallar', icon: LayoutGrid },
  { value: 'table', label: 'Jadval', icon: Rows3 },
]

const CashierCard = ({ cashier, onView }) => (
  <motion.div
    variants={fadeUp(10)}
    whileHover={{ y: -3 }}
    className="group rounded-[13px] border border-line bg-surface-2/70 p-3.5 transition-colors hover:border-brand/40"
  >
    <div className="flex items-start gap-3">
      <Avatar name={cashier.fullName} tone={cashier.avatarTone} size="md" status={cashier.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{cashier.fullName}</p>
        <p className="truncate text-[11px] text-subtle">
          {cashier.terminalId} · {cashier.shift}
        </p>
      </div>
      <StatusBadge kind="level" value={cashier.level} size="xs" dot={false} />
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2.5">
      <div className="rounded-[9px] bg-white/[0.035] p-2">
        <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Savdo</p>
        <p className="mt-0.5 text-[13px] font-semibold text-ink tabular">{formatMoney(cashier.sales, { compact: true })}</p>
      </div>
      <div className="rounded-[9px] bg-white/[0.035] p-2">
        <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Tranzaksiya</p>
        <p className="mt-0.5 text-[13px] font-semibold text-ink tabular">{formatNumber(cashier.transactions)}</p>
      </div>
    </div>

    <div className="mt-3 space-y-2">
      <ProgressBar value={cashier.kpi} label="KPI" showValue size="sm" />
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="flex items-center gap-1.5 text-muted">
          <Coins className="size-3.5 text-warning" strokeWidth={2} />
          {formatNumber(cashier.coins)} coins
        </span>
        <span className={cashier.cashDiscrepancy ? 'text-danger' : 'text-subtle'}>
          {cashier.cashDiscrepancy ? formatMoney(cashier.cashDiscrepancy, { compact: true }) : 'Farqsiz'}
        </span>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-3">
      <span className="truncate text-[10.5px] text-faint">
        Oxirgi smena: {cashier.lastShiftAt ? formatDateTime(cashier.lastShiftAt) : '—'}
      </span>
      <Button size="xs" variant="subtle" icon={Eye} onClick={() => onView(cashier.employeeId)}>
        Ko‘rish
      </Button>
    </div>
  </motion.div>
)

const CashiersPage = () => {
  const table = useTableState({ sortBy: 'sales', sortDir: 'desc', perPage: 20 })
  const [view, setView] = useState('groups')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const { data: groups, loading: groupsLoading, error: groupsError, refetch } = useQuery(
    [QK.cashiers, QK.employees],
    () => cashiersService.getCashiersByBranch(table.params),
    { deps: ['cashier-groups', table.params], enabled: view === 'groups' },
  )
  const { data: rows, loading: rowsLoading, refetching, error: rowsError } = useQuery(
    [QK.cashiers, QK.employees],
    () => cashiersService.getCashiers(table.params),
    { deps: ['cashier-rows', table.params], enabled: view === 'table' },
  )
  const { data: stats } = useQuery([QK.cashiers], () => cashiersService.getCashierStats(), { deps: ['cashier-stats'] })
  const { data: facets } = useQuery([QK.cashiers], () => cashiersService.getCashierFacets(), { deps: ['cashier-facets'] })

  const exportCsv = () => {
    const list = view === 'groups' ? (groups ?? []).flatMap((g) => g.cashiers) : (rows?.rows ?? [])
    if (!list.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'F.I.Sh', value: (r) => r.fullName },
        { label: 'Filial', value: (r) => r.branch },
        { label: 'Terminal', value: (r) => r.terminalId },
        { label: 'Smena', value: (r) => r.shift },
        { label: 'Savdo', value: (r) => r.sales },
        { label: 'Tranzaksiya', value: (r) => r.transactions },
        { label: 'O‘rtacha chek', value: (r) => r.avgTicket },
        { label: 'KPI', value: (r) => r.kpi },
        { label: 'Coins', value: (r) => r.coins },
        { label: 'Kassa farqi', value: (r) => r.cashDiscrepancy },
      ],
      list,
    )
    download(`hri-kassirlar-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${list.length} ta kassir eksport qilindi` })
  }

  const tableColumns = [
    {
      key: 'fullName',
      label: 'Kassir',
      render: (row) => <PersonCell name={row.fullName} subtitle={row.terminalId} tone={row.avatarTone} size="sm" status={row.status} />,
    },
    { key: 'branch', label: 'Filial' },
    { key: 'shift', label: 'Smena', hideBelow: 'lg' },
    { key: 'sales', label: 'Savdo', align: 'right', render: (row) => <span className="tabular">{formatMoney(row.sales, { compact: true })}</span> },
    { key: 'transactions', label: 'Tranzaksiya', align: 'right', render: (row) => <span className="tabular">{formatNumber(row.transactions)}</span> },
    {
      key: 'avgTicket',
      label: 'O‘rtacha chek',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="tabular">{formatMoney(row.avgTicket, { compact: true })}</span>,
    },
    {
      key: 'kpi',
      label: 'KPI',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12.5px] font-semibold text-ink tabular">{row.kpi}%</span>
          <ProgressBar value={row.kpi} size="xs" className="w-14" />
        </div>
      ),
    },
    { key: 'coins', label: 'Coins', align: 'right', hideBelow: 'lg', render: (row) => <span className="tabular">{formatNumber(row.coins)}</span> },
    {
      key: 'cashDiscrepancy',
      label: 'Kassa farqi',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => (
        <span className={`tabular ${row.cashDiscrepancy ? 'text-danger' : 'text-subtle'}`}>
          {row.cashDiscrepancy ? formatMoney(row.cashDiscrepancy, { compact: true, currency: '' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      sortable: false,
      width: 90,
      render: (row) => (
        <Button size="xs" variant="ghost" icon={Eye} onClick={() => setSelectedEmployee(row.employeeId)}>
          Ko‘rish
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Kassirlar"
        subtitle="Filiallar kesimida kassirlar, ularning savdo ko‘rsatkichlari, KPI va coins natijalari."
        icon={Wallet2}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
            <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setFormOpen(true)}>
              Kassir qo‘shish
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
          <StatCard label="Jami kassirlar" value={stats.total} icon={Wallet2} tone="brand" hint={`${stats.branches} filialda`} compact />
          <StatCard
            label="Umumiy savdo"
            value={stats.sales}
            format={(v) => formatMoney(v, { compact: true, currency: '' })}
            suffix="so‘m"
            icon={CreditCard}
            tone="success"
            hint={`Eng yuqori: ${stats.topBranch}`}
            compact
          />
          <StatCard
            label="Tranzaksiyalar"
            value={stats.transactions}
            icon={Receipt}
            tone="info"
            hint={`O‘rtacha chek ${formatMoney(stats.avgTicket, { compact: true })}`}
            compact
          />
          <StatCard
            label="O‘rtacha KPI"
            value={stats.avgKpi}
            suffix="%"
            icon={TrendingUp}
            tone="warning"
            hint={`${stats.withDiscrepancy} ta kassa farqi`}
            compact
          />
        </motion.div>
      )}

      <Card className="mt-4" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Kassir ismi, telefon, terminal..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          actions={<SegmentedControl id="cashier-view" size="sm" items={VIEWS} value={view} onChange={setView} />}
        >
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
            value={table.filters.shift}
            onChange={(v) => table.setFilter('shift', v)}
            options={(facets?.shifts ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha smenalar"
            placeholder="Smena"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={employeeStatus.options()}
            allLabel="Barcha holatlar"
            placeholder="Holat"
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
          <DateRangeInput value={table.range} onChange={table.setRange} className="[&_input]:h-8.5 [&_input]:text-[12.5px]" />
        </FilterBar>

        {view === 'table' ? (
          <DataTable
            columns={tableColumns}
            rows={rows?.rows ?? []}
            loading={rowsLoading}
            refetching={refetching}
            error={rowsError}
            sort={table.sort}
            onSort={table.toggleSort}
            onRowClick={(row) => setSelectedEmployee(row.employeeId)}
            query={table.query}
            onResetFilters={table.reset}
            pagination={{
              page: rows?.page ?? 1,
              pages: rows?.pages ?? 1,
              total: rows?.total ?? 0,
              perPage: table.perPage,
              onChange: table.setPage,
              label: 'kassir',
            }}
          />
        ) : (
          <div className="p-4">
            {groupsError ? (
              <ErrorState error={groupsError} onRetry={refetch} />
            ) : groupsLoading && !groups ? (
              <SkeletonList rows={6} />
            ) : !groups?.length ? (
              <NoResults query={table.query} onReset={table.reset} />
            ) : (
              <motion.div variants={staggerContainer(0.07)} initial="initial" animate="animate" className="space-y-3.5">
                {groups.map((group) => (
                  <motion.div key={group.branch} variants={fadeUp(12)} className="panel-flat overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-surface-2/50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
                          <Building2 className="size-4" strokeWidth={2} />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink">{group.branch}</p>
                          <p className="text-[11.5px] text-subtle">{group.count} ta kassir</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                        <span className="text-[11.5px] text-subtle">
                          Savdo <span className="ml-1 font-semibold text-ink tabular">{formatMoney(group.sales, { compact: true })}</span>
                        </span>
                        <span className="text-[11.5px] text-subtle">
                          Tranzaksiya <span className="ml-1 font-semibold text-ink tabular">{formatNumber(group.transactions)}</span>
                        </span>
                        <span className="text-[11.5px] text-subtle">
                          KPI <span className="ml-1 font-semibold text-ink tabular">{formatPercent(group.avgKpi)}</span>
                        </span>
                        <span className="text-[11.5px] text-subtle">
                          Coins <span className="ml-1 font-semibold text-warning tabular">{formatNumber(group.coins)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {group.cashiers.map((cashier) => (
                        <CashierCard key={cashier.id} cashier={cashier} onView={setSelectedEmployee} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </Card>

      <EmployeeDrawer employeeId={selectedEmployee} open={Boolean(selectedEmployee)} onClose={() => setSelectedEmployee(null)} />
      <EmployeeFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}

export default CashiersPage
