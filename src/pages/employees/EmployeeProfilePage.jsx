import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Banknote,
  BadgeCheck,
  CalendarCheck2,
  FileText,
  IdCard,
  Pencil,
  Rocket,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { employeesService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import {
  formatDate,
  formatDateLong,
  formatExperience,
  formatHours,
  formatMoney,
  formatMonthKey,
  formatNumber,
  formatPercent,
  formatPhone,
} from '@/lib/format'
import { attendanceStatus, ATTENDANCE_COLORS, onboardingStage, ONBOARDING_STAGES } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardRow, SectionTitle } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KpiRing, ProgressBar, SegmentBar } from '@/components/ui/ProgressBar'
import { MetricTile } from '@/components/ui/StatCard'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable } from '@/components/ui/DataTable'
import { Stepper } from '@/components/ui/Stepper'
import { ErrorState, EmptyState } from '@/components/ui/States'
import { SkeletonList, SkeletonStatCards } from '@/components/ui/Skeleton'
import { AreaTrend, BarCompare } from '@/components/charts/ChartKit'
import { EmployeeFormModal } from './components/EmployeeFormModal'

const TABS = [
  { value: 'overview', label: 'Umumiy', icon: UserRound },
  { value: 'personal', label: 'Shaxsiy', icon: IdCard },
  { value: 'attendance', label: 'Davomat', icon: CalendarCheck2 },
  { value: 'kpi', label: 'KPI', icon: TrendingUp },
  { value: 'payroll', label: 'Payroll', icon: Banknote },
  { value: 'documents', label: 'Hujjatlar', icon: FileText },
  { value: 'onboarding', label: 'Onboarding', icon: Rocket },
]

const EmployeeProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)

  const { data: employee, loading, error, refetch } = useQuery(
    [QK.employees, QK.payroll, QK.attendance, QK.kpi, QK.onboarding],
    () => employeesService.getEmployeeById(id),
    { deps: ['employee-profile', id] },
  )

  if (error) {
    return (
      <>
        <PageHeader title="Xodim profili" icon={UserRound} />
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  if (loading && !employee) {
    return (
      <>
        <PageHeader title="Yuklanmoqda…" icon={UserRound} />
        <SkeletonStatCards count={4} />
        <div className="mt-4 panel p-5">
          <SkeletonList rows={6} />
        </div>
      </>
    )
  }

  const attendanceSegments = Object.entries(employee.attendanceSummary ?? {}).map(([key, value]) => ({
    key,
    label: attendanceStatus.label(key),
    value,
    color: ATTENDANCE_COLORS[key],
  }))

  const attendanceColumns = [
    { key: 'date', label: 'Sana', render: (row) => formatDate(row.date) },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="attendanceStatus" value={row.status} size="xs" /> },
    { key: 'checkIn', label: 'Kirish', render: (row) => row.checkIn ?? '—' },
    { key: 'checkOut', label: 'Chiqish', render: (row) => row.checkOut ?? '—' },
    { key: 'hours', label: 'Soat', align: 'right', render: (row) => (row.hours ? formatHours(row.hours) : '—') },
    { key: 'lateMinutes', label: 'Kechikish', align: 'right', render: (row) => (row.lateMinutes ? `${row.lateMinutes} daq.` : '—') },
    { key: 'source', label: 'Manba', hideBelow: 'lg' },
  ]

  const payrollColumns = [
    { key: 'month', label: 'Oy', render: (row) => formatMonthKey(row.month, false) },
    { key: 'baseSalary', label: 'Oklad', align: 'right', render: (row) => formatMoney(row.baseSalary, { currency: '' }) },
    { key: 'bonus', label: 'Bonus', align: 'right', render: (row) => formatMoney(row.bonus, { currency: '' }) },
    { key: 'deductions', label: 'Ushlanma', align: 'right', render: (row) => formatMoney(row.deductions, { currency: '' }) },
    { key: 'tax', label: 'Soliq', align: 'right', hideBelow: 'lg', render: (row) => formatMoney(row.tax, { currency: '' }) },
    {
      key: 'net',
      label: 'Qo‘lga',
      align: 'right',
      render: (row) => <span className="font-semibold text-ink">{formatMoney(row.net, { currency: '' })}</span>,
    },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="payrollStatus" value={row.status} size="xs" /> },
  ]

  return (
    <>
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.position} · ${employee.department} · ${employee.branch}`}
        icon={UserRound}
        actions={
          <>
            <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/employees')}>
              Ro‘yxatga qaytish
            </Button>
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
              Tahrirlash
            </Button>
          </>
        }
      />

      <motion.div variants={staggerContainer(0.06)} initial="initial" animate="animate" className="space-y-3.5">
        {/* identity card */}
        <Card padded>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar name={employee.fullName} tone={employee.avatarTone} size="2xl" status={employee.status} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[18px] font-semibold text-ink">{employee.fullName}</h2>
                  <StatusBadge kind="employeeStatus" value={employee.status} size="sm" />
                  <StatusBadge kind="level" value={employee.level} size="sm" />
                </div>
                <p className="mt-1 text-[12.5px] text-muted">
                  {employee.code} · {formatPhone(employee.phone)} · {employee.email}
                </p>
                <p className="mt-1 text-[11.5px] text-subtle">
                  Rahbar: {employee.manager?.fullName ?? '—'} · Qabul: {formatDateLong(employee.hiredAt)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <KpiRing value={employee.kpi} size={92} sublabel="KPI" />
              <KpiRing value={employee.attendanceRate} size={92} sublabel="davomat" tone="teal" />
            </div>
          </div>
        </Card>

        {/* quick metrics */}
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <MetricTile label="Oylik" value={formatMoney(employee.salary, { compact: true })} icon={Banknote} tone="violet" hint={`${employee.employmentType === 'full' ? 'To‘liq stavka' : 'Qisman'}`} />
          <MetricTile label="Coins" value={formatNumber(employee.coins)} icon={BadgeCheck} tone="warning" hint="Joriy balans" />
          <MetricTile label="Ish staji" value={formatExperience(employee.tenureDays / 365)} icon={UserRound} tone="brand" hint={formatDate(employee.hiredAt)} />
          <MetricTile
            label="Kechikish / yo‘qlik"
            value={`${employee.lateCount} / ${employee.absentCount}`}
            icon={CalendarCheck2}
            tone={employee.lateCount > 3 ? 'danger' : 'success'}
            hint="Oxirgi davr"
          />
        </div>

        <Tabs items={TABS} value={tab} onChange={setTab} id="employee-profile" />

        {/* ---------------- OVERVIEW ---------------- */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
            <ChartCard title="KPI dinamikasi" subtitle="Oxirgi 6 oy" icon={TrendingUp} className="xl:col-span-2" height={220}>
              <AreaTrend
                data={employee.kpiHistory}
                xKey="month"
                xFormatter={(v) => formatMonthKey(v)}
                height={216}
                yFormatter={(v) => `${v}%`}
                series={[{ key: 'kpi', label: 'KPI', color: 'var(--color-brand)' }]}
              />
            </ChartCard>

            <Card title="Ish ma’lumotlari" icon={IdCard}>
              <div className="-my-2">
                <CardRow label="Lavozim" value={employee.position} />
                <CardRow label="Bo‘lim" value={employee.department} />
                <CardRow label="Filial" value={employee.branch} />
                <CardRow label="Bandlik" value={<StatusBadge kind="employmentType" value={employee.employmentType} size="xs" />} />
                <CardRow label="Shartnoma" value={employee.contractNo} />
                <CardRow label="Rahbar" value={employee.manager?.fullName ?? '—'} />
                <CardRow label="Jamoa" value={`${employee.team?.length ?? 0} nafar`} />
              </div>
            </Card>

            <Card title="Davomat taqsimoti" subtitle="Oxirgi 21 kun" icon={CalendarCheck2} className="xl:col-span-2">
              <SegmentBar segments={attendanceSegments} />
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {attendanceSegments.map((segment) => (
                  <div key={segment.key} className="rounded-[10px] border border-line bg-surface-2/60 p-2.5">
                    <p className="flex items-center gap-1.5 text-[11px] text-muted">
                      <span className="size-2 rounded-full" style={{ backgroundColor: segment.color }} />
                      {segment.label}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-ink tabular">{segment.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-subtle">
                Jami ishlangan vaqt: <span className="font-semibold text-ink-2">{formatHours(employee.attendanceHours)}</span>
              </p>
            </Card>

            <Card title="Joriy payroll" icon={Banknote}>
              {employee.currentPayroll ? (
                <div className="-my-2">
                  <CardRow label="Oy" value={formatMonthKey(employee.currentPayroll.month, false)} />
                  <CardRow label="Oklad" value={formatMoney(employee.currentPayroll.baseSalary)} />
                  <CardRow label="Bonus" value={formatMoney(employee.currentPayroll.bonus)} />
                  <CardRow label="Ushlanma" value={formatMoney(employee.currentPayroll.deductions)} />
                  <CardRow label="Soliq" value={formatMoney(employee.currentPayroll.tax)} />
                  <CardRow label="Qo‘lga" value={formatMoney(employee.currentPayroll.net)} valueClassName="text-success" />
                  <CardRow label="Holat" value={<StatusBadge kind="payrollStatus" value={employee.currentPayroll.status} size="xs" />} />
                </div>
              ) : (
                <EmptyState title="Payroll yozuvi yo‘q" compact />
              )}
            </Card>
          </div>
        )}

        {/* ---------------- PERSONAL ---------------- */}
        {tab === 'personal' && (
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <Card title="Shaxsiy ma’lumotlar" icon={IdCard}>
              <div className="-my-2">
                <CardRow label="F.I.Sh" value={employee.fullName} />
                <CardRow label="Jinsi" value={employee.gender === 'male' ? 'Erkak' : 'Ayol'} />
                <CardRow label="Tug‘ilgan sana" value={formatDate(employee.birthDate)} />
                <CardRow label="Passport" value={employee.passport} />
                <CardRow label="Manzil" value={employee.address} />
                <CardRow label="Ma’lumoti" value={employee.education} />
                <CardRow label="Bank kartasi" value={employee.bankCard} />
                <CardRow label="Favqulodda aloqa" value={formatPhone(employee.emergencyContact)} />
              </div>
            </Card>
            <Card title="Aloqa va tizim" icon={UserRound}>
              <div className="-my-2">
                <CardRow label="Telefon" value={formatPhone(employee.phone)} />
                <CardRow label="Email" value={employee.email} />
                <CardRow label="Tabel raqami" value={employee.code} />
                <CardRow label="Shartnoma" value={employee.contractNo} />
                <CardRow label="Nomzod yozuvi" value={employee.candidate ? employee.candidate.fullName : 'Bevosita qabul'} />
                <CardRow label="Manba" value={employee.candidate?.source ?? '—'} />
              </div>
            </Card>
          </div>
        )}

        {/* ---------------- ATTENDANCE ---------------- */}
        {tab === 'attendance' && (
          <Card padded={false} title="Davomat yozuvlari" subtitle="Oxirgi 30 kun" icon={CalendarCheck2}>
            <DataTable columns={attendanceColumns} rows={employee.attendance} dense />
          </Card>
        )}

        {/* ---------------- KPI ---------------- */}
        {tab === 'kpi' && (
          <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
            <ChartCard title="KPI va sifat" subtitle="Oylik dinamika" icon={TrendingUp} height={240}>
              <AreaTrend
                data={employee.kpiHistory}
                xKey="month"
                xFormatter={(v) => formatMonthKey(v)}
                height={236}
                yFormatter={(v) => `${v}%`}
                series={[
                  { key: 'kpi', label: 'KPI', color: 'var(--color-brand)' },
                  { key: 'qualityScore', label: 'Sifat', color: 'var(--color-teal)' },
                ]}
              />
            </ChartCard>
            <ChartCard title="Coins to‘plami" subtitle="Oylar bo‘yicha" icon={BadgeCheck} height={240}>
              <BarCompare
                data={employee.kpiHistory}
                xKey="month"
                xFormatter={(v) => formatMonthKey(v)}
                height={236}
                series={[{ key: 'coins', label: 'Coins', color: 'var(--color-warning)' }]}
              />
            </ChartCard>
            <Card title="Joriy ko‘rsatkichlar" icon={TrendingUp} className="xl:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'KPI', value: employee.kpi },
                  { label: 'Sifat', value: employee.kpiHistory.at(-1)?.qualityScore ?? 0 },
                  { label: 'Intizom', value: employee.kpiHistory.at(-1)?.disciplineScore ?? 0 },
                  { label: 'Davomat', value: employee.attendanceRate },
                ].map((metric, index) => (
                  <div key={metric.label}>
                    <ProgressBar value={metric.value} label={metric.label} showValue delay={index * 0.06} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ---------------- PAYROLL ---------------- */}
        {tab === 'payroll' && (
          <Card padded={false} title="To‘lovlar tarixi" subtitle="Oxirgi 6 oy" icon={Banknote}>
            <DataTable columns={payrollColumns} rows={employee.payroll} dense />
          </Card>
        )}

        {/* ---------------- DOCUMENTS ---------------- */}
        {tab === 'documents' && (
          <Card title="Hujjatlar" subtitle={`${employee.documents.length} ta yozuv`} icon={FileText}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {employee.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-[11px] border border-line bg-surface-2/60 p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-brand/10 text-brand-2">
                    <FileText className="size-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-ink-2">{doc.name}</p>
                    <p className="text-[11px] text-subtle">{formatDate(doc.updatedAt)}</p>
                  </div>
                  <StatusBadge kind="documentStatus" value={doc.status} size="xs" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ---------------- ONBOARDING ---------------- */}
        {tab === 'onboarding' && (
          <Card title="Onboarding tarixi" icon={Rocket}>
            {employee.onboarding ? (
              <div className="space-y-5">
                <Stepper
                  steps={ONBOARDING_STAGES.map((stage) => ({ key: stage, label: onboardingStage.label(stage) }))}
                  currentIndex={ONBOARDING_STAGES.indexOf(employee.onboarding.stage)}
                />
                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                  <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
                    <CardRow label="HR mas’ul" value={employee.onboarding.hrResponsibleName} />
                    <CardRow label="Mentor" value={employee.onboarding.mentorName} />
                    <CardRow label="Boshlangan" value={formatDate(employee.onboarding.createdAt)} />
                    <CardRow label="Yakunlangan" value={formatDate(employee.onboarding.completedAt)} />
                  </div>
                  <div className="space-y-1.5">
                    {employee.onboarding.checklist?.slice(0, 8).map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5 text-[12px]">
                        <span
                          className={`grid size-4 place-items-center rounded-full ${
                            item.done ? 'bg-success/16 text-success' : 'bg-white/[0.06] text-subtle'
                          }`}
                        >
                          {item.done ? '✓' : '·'}
                        </span>
                        <span className={item.done ? 'text-ink-2' : 'text-subtle'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Rocket}
                title="Onboarding yozuvi yo‘q"
                description="Bu xodim tizimga bevosita qo‘shilgan yoki onboarding jarayonidan o‘tmagan."
                compact
              />
            )}
          </Card>
        )}
      </motion.div>

      <EmployeeFormModal open={editOpen} employee={employee} onClose={() => setEditOpen(false)} />
    </>
  )
}

export default EmployeeProfilePage
