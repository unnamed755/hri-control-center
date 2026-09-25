import { useNavigate } from 'react-router-dom'
import { ClipboardList, Download, FileSpreadsheet } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { employeesService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { download, toCsv } from '@/lib/utils'
import { formatDate, formatMoney, formatNumber, formatPhone } from '@/lib/format'
import { employeeStatus, employmentType, level as levelDict } from '@/config/dictionaries'
import { PageHeader, HeaderMeta } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { DateRangeInput, Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PersonCell } from '@/components/ui/Avatar'
import { SegmentedControl } from '@/components/ui/Tabs'

const PER_PAGE_OPTIONS = [
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
]

const EmployeeRegisterPage = () => {
  const navigate = useNavigate()
  const table = useTableState({ perPage: 15, sortBy: 'code' })

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.employees, QK.payroll],
    () => employeesService.getEmployees(table.params),
    { deps: ['employee-register', table.params] },
  )
  const { data: facets } = useQuery(QK.employees, () => employeesService.getEmployeeFacets(), {
    deps: ['register-facets'],
  })

  const exportCsv = () => {
    const rows = data?.rows ?? []
    if (!rows.length) {
      toast({ tone: 'warning', title: 'Eksport uchun yozuv yo‘q' })
      return
    }
    const csv = toCsv(
      [
        { label: 'Tabel', value: (r) => r.code },
        { label: 'F.I.Sh', value: (r) => r.fullName },
        { label: 'Lavozim', value: (r) => r.position },
        { label: 'Bo‘lim', value: (r) => r.department },
        { label: 'Filial', value: (r) => r.branch },
        { label: 'Daraja', value: (r) => levelDict.label(r.level) },
        { label: 'Bandlik', value: (r) => employmentType.label(r.employmentType) },
        { label: 'Holat', value: (r) => employeeStatus.label(r.status) },
        { label: 'Telefon', value: (r) => formatPhone(r.phone) },
        { label: 'Qabul sanasi', value: (r) => formatDate(r.hiredAt) },
        { label: 'Bo‘shagan sana', value: (r) => (r.terminatedAt ? formatDate(r.terminatedAt) : '') },
        { label: 'Oylik', value: (r) => r.salary },
        { label: 'Shartnoma', value: (r) => r.contractNo },
      ],
      rows,
    )
    download(`hri-reestr-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
    toast({ tone: 'success', title: `${rows.length} ta yozuv eksport qilindi` })
  }

  const columns = [
    { key: 'code', label: 'Tabel', width: 92, render: (row) => <span className="tabular text-subtle">{row.code}</span> },
    {
      key: 'fullName',
      label: 'Xodim',
      render: (row) => <PersonCell name={row.fullName} subtitle={formatPhone(row.phone)} tone={row.avatarTone} size="sm" status={row.status} />,
    },
    { key: 'position', label: 'Lavozim' },
    { key: 'department', label: 'Bo‘lim', hideBelow: 'md' },
    { key: 'branch', label: 'Filial', hideBelow: 'lg' },
    {
      key: 'level',
      label: 'Daraja',
      hideBelow: 'xl',
      render: (row) => <StatusBadge kind="level" value={row.level} size="xs" dot={false} />,
    },
    {
      key: 'employmentType',
      label: 'Bandlik',
      hideBelow: 'xl',
      render: (row) => <span className="text-[12px] text-muted">{employmentType.label(row.employmentType)}</span>,
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="employeeStatus" value={row.status} /> },
    { key: 'hiredAt', label: 'Qabul', align: 'right', render: (row) => <span className="tabular">{formatDate(row.hiredAt)}</span> },
    {
      key: 'terminatedAt',
      label: 'Bo‘shagan',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="tabular text-subtle">{row.terminatedAt ? formatDate(row.terminatedAt) : '—'}</span>,
    },
    {
      key: 'salary',
      label: 'Oylik',
      align: 'right',
      render: (row) => <span className="tabular">{formatMoney(row.salary, { compact: true, currency: '' })}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Xodimlar reestri"
        subtitle="To‘liq kadrlar reestri: faol, sinovdagi, ta’tildagi va bo‘shagan xodimlar. Saralash, filtr va eksport qo‘llab-quvvatlanadi."
        icon={ClipboardList}
        meta={
          data ? (
            <>
              <HeaderMeta icon={FileSpreadsheet} label="Yozuvlar:" value={formatNumber(data.total)} />
              <HeaderMeta label="Sahifa:" value={`${data.page} / ${data.pages}`} />
            </>
          ) : null
        }
        actions={
          <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
            CSV eksport
          </Button>
        }
      />

      <Card padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Tabel, ism, lavozim, telefon..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          actions={
            <SegmentedControl
              id="register-size"
              size="sm"
              items={PER_PAGE_OPTIONS}
              value={table.perPage}
              onChange={table.setPerPage}
            />
          }
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
            className="w-44"
            size="sm"
            value={table.filters.position}
            onChange={(v) => table.setFilter('position', v)}
            options={(facets?.positions ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha lavozimlar"
            placeholder="Lavozim"
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
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
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

export default EmployeeRegisterPage
