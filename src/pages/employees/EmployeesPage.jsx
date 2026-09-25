import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Banknote,
  Download,
  Eye,
  Pencil,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { employeesService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatMoney, formatNumber, formatPercent, formatPhone } from '@/lib/format'
import { employeeStatus, level as levelDict } from '@/config/dictionaries'
import { optionsFrom } from '@/services/mock/tableUtils'
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
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { EmployeeDrawer } from './components/EmployeeDrawer'
import { EmployeeFormModal } from './components/EmployeeFormModal'

const EmployeesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const table = useTableState({
    initialFilters: searchParams.get('department') ? { department: searchParams.get('department') } : {},
    sortBy: 'fullName',
  })
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.employees, QK.payroll, QK.onboarding],
    () => employeesService.getEmployees(table.params),
    { deps: ['employees', table.params] },
  )
  const { data: facets } = useQuery(QK.employees, () => employeesService.getEmployeeFacets(), {
    deps: ['employee-facets'],
  })
  const { data: stats } = useQuery([QK.employees, QK.payroll], () => employeesService.getEmployeeStats(), {
    deps: ['employee-stats'],
  })

  const handleTerminate = async (row) => {
    const ok = await askConfirm({
      title: 'Xodimni bo‘shatish',
      description: `${row.fullName} "Bo‘shagan" holatiga o‘tkaziladi.`,
      confirmLabel: 'Bo‘shatish',
    })
    if (!ok) return
    await employeesService.terminateEmployee(row.id)
    toast({ tone: 'success', title: 'Xodim bo‘shatildi', description: row.fullName })
  }

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) return
    const csv = toCsv(
      [
        { label: 'Tabel', value: (r) => r.code },
        { label: 'F.I.Sh', value: (r) => r.fullName },
        { label: 'Lavozim', value: (r) => r.position },
        { label: 'Bo‘lim', value: (r) => r.department },
        { label: 'Filial', value: (r) => r.branch },
        { label: 'Telefon', value: (r) => formatPhone(r.phone) },
        { label: 'Holat', value: (r) => employeeStatus.label(r.status) },
        { label: 'KPI', value: (r) => r.kpi },
        { label: 'Davomat', value: (r) => r.attendanceRate },
        { label: 'Oylik', value: (r) => r.salary },
        { label: 'Qabul sanasi', value: (r) => formatDate(r.hiredAt) },
      ],
      rows,
    )
    download(`hri-xodimlar-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta yozuv eksport qilindi` })
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Xodim',
      width: '23%',
      render: (row) => (
        <PersonCell name={row.fullName} subtitle={`${row.code} · ${formatPhone(row.phone)}`} tone={row.avatarTone} status={row.status} />
      ),
    },
    {
      key: 'position',
      label: 'Lavozim',
      render: (row) => (
        <div>
          <p className="text-[12.5px] text-ink-2">{row.position}</p>
          <p className="text-[11px] text-subtle">{row.department}</p>
        </div>
      ),
    },
    { key: 'branch', label: 'Filial', hideBelow: 'lg' },
    {
      key: 'status',
      label: 'Holat',
      render: (row) => <StatusBadge kind="employeeStatus" value={row.status} />,
    },
    {
      key: 'kpi',
      label: 'KPI',
      align: 'right',
      width: '11%',
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12.5px] font-semibold text-ink tabular">{row.kpi}%</span>
          <ProgressBar value={row.kpi} size="xs" className="w-16" />
        </div>
      ),
    },
    {
      key: 'attendanceRate',
      label: 'Davomat',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="tabular">{formatPercent(row.attendanceRate)}</span>,
    },
    {
      key: 'payrollStatus',
      label: 'Payroll',
      hideBelow: 'xl',
      render: (row) =>
        row.payrollStatus ? <StatusBadge kind="payrollStatus" value={row.payrollStatus} size="xs" /> : <span className="text-subtle">—</span>,
    },
    {
      key: 'onboardingStage',
      label: 'Onboarding',
      hideBelow: 'xl',
      render: (row) =>
        !row.onboardingStage ? (
          <span className="text-subtle">—</span>
        ) : row.onboardingStage === 'started' ? (
          <StatusBadge label="Yakunlangan" tone="success" size="xs" />
        ) : (
          <StatusBadge kind="onboardingStage" value={row.onboardingStage} size="xs" />
        ),
    },
    {
      key: 'salary',
      label: 'Oylik',
      align: 'right',
      hideBelow: 'lg',
      render: (row) => <span className="tabular">{formatMoney(row.salary, { compact: true })}</span>,
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
            { label: 'Tez ko‘rish', icon: Eye, onClick: () => setSelectedId(row.id) },
            { label: 'To‘liq profil', icon: Users, onClick: () => navigate(`/employees/${row.id}`) },
            { label: 'Tahrirlash', icon: Pencil, onClick: () => { setEditing(row); setFormOpen(true) } },
            { divider: true },
            {
              label: row.status === 'terminated' ? 'Tiklash' : 'Bo‘shatish',
              icon: UserMinus,
              tone: row.status === 'terminated' ? undefined : 'danger',
              onClick: () =>
                row.status === 'terminated' ? employeesService.restoreEmployee(row.id) : handleTerminate(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Xodimlar"
        subtitle="Kompaniyaning barcha xodimlari, ularning samaradorligi, davomati va payroll holati bitta jadvalda."
        icon={Users}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Xodim qo‘shish
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
          <StatCard label="Jami xodimlar" value={stats.total} icon={Users} tone="brand" hint={`${stats.terminated} bo‘shagan`} compact />
          <StatCard
            label="Sinov muddatida"
            value={stats.probation}
            icon={UserPlus}
            tone="warning"
            hint={`${stats.newThisMonth} ta yangi (30 kun)`}
            compact
          />
          <StatCard label="O‘rtacha KPI" value={stats.avgKpi} suffix="%" icon={TrendingUp} tone="success" hint={`Davomat ${stats.avgAttendance}%`} compact />
          <StatCard
            label="Oylik fondi"
            value={stats.payrollMonthly}
            format={(v) => formatMoney(v, { compact: true, currency: '' })}
            suffix="so‘m"
            icon={Banknote}
            tone="violet"
            hint={`${stats.cashiers} kassir`}
            compact
          />
        </motion.div>
      )}

      <Card className="mt-4" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Ism, tabel, telefon, lavozim..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta xodim` : ''}
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
          <Select
            className="w-36"
            size="sm"
            value={table.filters.kpiBand}
            onChange={(v) => table.setFilter('kpiBand', v)}
            options={optionsFrom(['high', 'mid', 'low']).map((o) => ({
              value: o.value,
              label: { high: 'KPI 85%+', mid: 'KPI 70–84%', low: 'KPI < 70%' }[o.value],
            }))}
            allLabel="Barcha KPI"
            placeholder="KPI"
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
          onRowClick={(row) => setSelectedId(row.id)}
          query={table.query}
          onResetFilters={table.reset}
          pagination={{
            page: data?.page ?? 1,
            pages: data?.pages ?? 1,
            total: data?.total ?? 0,
            perPage: table.perPage,
            onChange: table.setPage,
            label: 'xodim',
          }}
        />
      </Card>

      <EmployeeDrawer employeeId={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
      <EmployeeFormModal open={formOpen} employee={editing} onClose={() => setFormOpen(false)} />
    </>
  )
}

export default EmployeesPage
