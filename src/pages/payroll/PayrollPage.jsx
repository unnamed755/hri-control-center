import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  Landmark,
  Receipt,
  Wallet2,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { payrollService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatMoney, formatMonthKey, formatNumber, monthKey } from '@/lib/format'
import { payrollStatus } from '@/config/dictionaries'
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
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards } from '@/components/ui/Skeleton'
import { BarCompare, RankBars } from '@/components/charts/ChartKit'
import { PayrollDrawer } from './components/PayrollDrawer'

const PayrollPage = () => {
  const [month, setMonth] = useState(monthKey())
  const table = useTableState({ sortBy: 'net', sortDir: 'desc', perPage: 12 })
  const [selectedId, setSelectedId] = useState(null)

  const params = { ...table.params, filters: { ...table.params.filters, month } }

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.payroll, QK.employees],
    () => payrollService.getPayroll(params),
    { deps: ['payroll', params] },
  )
  const { data: summary } = useQuery([QK.payroll], () => payrollService.getPayrollSummary(month), {
    deps: ['payroll-summary', month],
  })
  const { data: facets } = useQuery([QK.payroll], () => payrollService.getPayrollFacets(), { deps: ['payroll-facets'] })

  const handlePay = async (row) => {
    await payrollService.setPayrollStatus(row.id, 'paid')
    toast({ tone: 'success', title: 'To‘lov amalga oshirildi', description: `${row.fullName} · ${formatMoney(row.net)}` })
  }

  const handlePayAll = async () => {
    const ok = await askConfirm({
      title: 'Barcha to‘lovlarni yakunlash',
      description: `${formatMonthKey(month, false)} oyidagi ${summary?.pendingCount ?? 0} ta kutilayotgan to‘lov "To‘langan" holatiga o‘tkaziladi.`,
      confirmLabel: 'To‘lash',
      tone: 'brand',
    })
    if (!ok) return
    const count = await payrollService.payAll(month)
    toast({ tone: 'success', title: `${count} ta to‘lov yakunlandi` })
  }

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'Xodim', value: (r) => r.fullName },
        { label: 'Tabel', value: (r) => r.employeeCode },
        { label: 'Bo‘lim', value: (r) => r.department },
        { label: 'Filial', value: (r) => r.branch },
        { label: 'Oklad', value: (r) => r.baseSalary },
        { label: 'Bonus', value: (r) => r.bonus },
        { label: 'Coins bonus', value: (r) => r.coinsBonus },
        { label: 'Ushlanma', value: (r) => r.deductions },
        { label: 'Soliq', value: (r) => r.tax },
        { label: 'Qo‘lga', value: (r) => r.net },
        { label: 'Holat', value: (r) => payrollStatus.label(r.status) },
      ],
      rows,
    )
    download(`hri-payroll-${month}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta yozuv eksport qilindi` })
  }

  const columns = [
    {
      key: 'fullName',
      label: 'Xodim',
      render: (row) => <PersonCell name={row.fullName} subtitle={`${row.employeeCode} · ${row.position}`} tone={row.avatarTone} size="sm" />,
    },
    { key: 'department', label: 'Bo‘lim', hideBelow: 'md' },
    { key: 'branch', label: 'Filial', hideBelow: 'xl' },
    {
      key: 'baseSalary',
      label: 'Oklad',
      align: 'right',
      render: (row) => <span className="tabular">{formatMoney(row.baseSalary, { compact: true, currency: '' })}</span>,
    },
    {
      key: 'bonus',
      label: 'Bonus',
      align: 'right',
      hideBelow: 'lg',
      render: (row) => (
        <span className="tabular text-success">
          +{formatMoney(row.bonus + row.coinsBonus, { compact: true, currency: '' })}
        </span>
      ),
    },
    {
      key: 'deductions',
      label: 'Ushlanma',
      align: 'right',
      hideBelow: 'lg',
      render: (row) => (
        <span className={`tabular ${row.deductions ? 'text-danger' : 'text-subtle'}`}>
          {row.deductions ? `−${formatMoney(row.deductions, { compact: true, currency: '' })}` : '—'}
        </span>
      ),
    },
    {
      key: 'tax',
      label: 'Soliq',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="tabular text-muted">{formatMoney(row.tax, { compact: true, currency: '' })}</span>,
    },
    {
      key: 'net',
      label: 'Qo‘lga',
      align: 'right',
      render: (row) => <span className="font-semibold text-ink tabular">{formatMoney(row.net, { compact: true, currency: '' })}</span>,
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="payrollStatus" value={row.status} /> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 56,
      sortable: false,
      render: (row) => (
        <Dropdown
          items={[
            { label: 'Batafsil', icon: Receipt, onClick: () => setSelectedId(row.id) },
            ...(row.status !== 'paid'
              ? [{ label: 'To‘langan deb belgilash', icon: CheckCircle2, onClick: () => handlePay(row) }]
              : []),
            ...(row.status !== 'hold'
              ? [{ label: 'To‘xtatib turish', icon: Clock, tone: 'danger', onClick: () => payrollService.setPayrollStatus(row.id, 'hold') }]
              : []),
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle="Oylik to‘lov fondi: oklad, bonus, ushlanma va soliqlar. Barcha summalar xodimlar bazasidan hisoblanadi — hech qanday haqiqiy to‘lov amalga oshirilmaydi."
        icon={Banknote}
        actions={
          <>
            <Select
              className="w-40"
              size="sm"
              value={month}
              onChange={(value) => setMonth(value || monthKey())}
              options={(facets?.months ?? [monthKey()]).map((m) => ({ value: m, label: formatMonthKey(m, false) }))}
            />
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
              Eksport
            </Button>
            <Button variant="primary" size="sm" icon={CheckCircle2} onClick={handlePayAll} disabled={!summary?.pendingCount}>
              Barchasini to‘lash
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
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard
            label="Jami to‘lov"
            value={summary.total}
            change={summary.changePercent}
            format={(v) => formatMoney(v, { compact: true, currency: '' })}
            suffix="so‘m"
            icon={Wallet2}
            tone="brand"
            hint={`${summary.employees} ta xodim`}
            compact
          />
          <StatCard
            label="To‘langan"
            value={summary.paid}
            format={(v) => formatMoney(v, { compact: true, currency: '' })}
            suffix="so‘m"
            icon={CheckCircle2}
            tone="success"
            hint={`${summary.paidCount} ta to‘lov`}
            compact
          />
          <StatCard
            label="Kutilmoqda"
            value={summary.pending}
            format={(v) => formatMoney(v, { compact: true, currency: '' })}
            suffix="so‘m"
            icon={Clock}
            tone="warning"
            hint={`${summary.pendingCount} ta to‘lov`}
            compact
          />
          <StatCard
            label="Soliq va ushlanma"
            value={summary.tax + summary.deductions}
            format={(v) => formatMoney(v, { compact: true, currency: '' })}
            suffix="so‘m"
            icon={Landmark}
            tone="violet"
            hint={`O‘rtacha oylik ${formatMoney(summary.avgSalary, { compact: true })}`}
            compact
          />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="To‘lov fondi dinamikasi"
          subtitle="Oxirgi oylar (net)"
          icon={CircleDollarSign}
          loading={!summary}
          height={230}
          legend={[
            { label: 'Jami', color: 'var(--color-brand)' },
            { label: 'To‘langan', color: 'var(--color-success)' },
          ]}
        >
          <BarCompare
            data={summary?.trend ?? []}
            xKey="month"
            xFormatter={(v) => formatMonthKey(v)}
            height={226}
            valueFormatter={(v) => formatMoney(v, { compact: true })}
            series={[
              { key: 'value', label: 'Jami', color: 'var(--color-brand)' },
              { key: 'paid', label: 'To‘langan', color: 'var(--color-success)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Bo‘limlar bo‘yicha"
          subtitle={formatMonthKey(month, false)}
          icon={Banknote}
          loading={!summary}
          height={230}
          bodyClassName="px-5"
        >
          <RankBars
            data={(summary?.byDepartment ?? []).map((row) => ({ name: row.name, value: row.value }))}
            valueFormatter={(v) => formatMoney(v, { compact: true, currency: '' })}
          />
        </ChartCard>
      </div>

      <Card className="mt-3.5" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Xodim, tabel, lavozim..."
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
            className="w-40"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={payrollStatus.options()}
            allLabel="Barcha holatlar"
            placeholder="Holat"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.method}
            onChange={(v) => table.setFilter('method', v)}
            options={(facets?.methods ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha usullar"
            placeholder="To‘lov usuli"
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
            label: 'yozuv',
          }}
        />
      </Card>

      <PayrollDrawer recordId={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
    </>
  )
}

export default PayrollPage
