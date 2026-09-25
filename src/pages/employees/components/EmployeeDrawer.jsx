import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  BadgeCheck,
  CalendarCheck2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  UserMinus,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { employeesService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { askConfirm, toast } from '@/store/uiStore'
import {
  formatDate,
  formatExperience,
  formatHours,
  formatMoney,
  formatPercent,
  formatPhone,
  monthKey,
} from '@/lib/format'
import { attendanceStatus, ATTENDANCE_COLORS } from '@/config/dictionaries'
import { Drawer } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { KpiRing, SegmentBar } from '@/components/ui/ProgressBar'
import { MetricTile } from '@/components/ui/StatCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { CardRow, SectionTitle } from '@/components/ui/Card'
import { Sparkline } from '@/components/charts/ChartKit'

export const EmployeeDrawer = ({ employeeId, open, onClose }) => {
  const navigate = useNavigate()
  const { data: employee, loading } = useQuery(
    [QK.employees, QK.payroll, QK.attendance, QK.kpi],
    () => employeesService.getEmployeeById(employeeId),
    { deps: ['employee-drawer', employeeId], enabled: Boolean(employeeId && open) },
  )

  const handleTerminate = async () => {
    const ok = await askConfirm({
      title: 'Xodimni bo‘shatish',
      description: `${employee.fullName} "Bo‘shagan" holatiga o‘tkaziladi va payroll hisobidan chiqariladi.`,
      confirmLabel: 'Bo‘shatish',
    })
    if (!ok) return
    await employeesService.terminateEmployee(employeeId)
    toast({ tone: 'success', title: 'Xodim bo‘shatildi', description: employee.fullName })
    onClose()
  }

  const attendanceSegments = Object.entries(employee?.attendanceSummary ?? {}).map(([key, value]) => ({
    key,
    label: attendanceStatus.label(key),
    value,
    color: ATTENDANCE_COLORS[key],
  }))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={employee?.fullName ?? 'Xodim'}
      subtitle={employee ? `${employee.position} · ${employee.department} · ${employee.branch}` : ''}
      badge={employee && <StatusBadge kind="employeeStatus" value={employee.status} size="xs" />}
      footer={
        employee && (
          <>
            {employee.status !== 'terminated' && (
              <Button variant="danger" size="sm" icon={UserMinus} onClick={handleTerminate}>
                Bo‘shatish
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={ExternalLink}
              onClick={() => {
                onClose()
                navigate(`/employees/${employee.id}`)
              }}
            >
              To‘liq profil
            </Button>
          </>
        )
      }
    >
      {loading || !employee ? (
        <SkeletonList rows={7} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={employee.fullName} tone={employee.avatarTone} size="2xl" status={employee.status} />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold text-ink">{employee.fullName}</p>
              <p className="text-[12.5px] text-muted">
                {employee.position} · {employee.code}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge kind="level" value={employee.level} size="xs" />
                <StatusBadge kind="employmentType" value={employee.employmentType} size="xs" />
              </div>
            </div>
            <KpiRing value={employee.kpi} size={78} sublabel="KPI" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              label="Oylik"
              value={formatMoney(employee.salary, { compact: true })}
              icon={Banknote}
              tone="violet"
              hint={employee.currentPayroll ? `Holat: ${employee.currentPayroll.status}` : 'Payroll yozuvi yo‘q'}
            />
            <MetricTile
              label="Davomat"
              value={formatPercent(employee.attendanceRate)}
              icon={CalendarCheck2}
              tone="success"
              hint={`${employee.lateCount} kechikish · ${employee.absentCount} yo‘qlik`}
            />
            <MetricTile
              label="Coins"
              value={employee.coins}
              icon={BadgeCheck}
              tone="warning"
              hint="Ichki motivatsiya"
            />
            <MetricTile
              label="Ish staji"
              value={formatExperience(employee.tenureDays / 365)}
              icon={Users}
              tone="brand"
              hint={`Qabul: ${formatDate(employee.hiredAt)}`}
            />
          </div>

          <div>
            <SectionTitle>KPI dinamikasi</SectionTitle>
            <div className="rounded-[12px] border border-line bg-surface-2/60 p-3">
              <Sparkline data={employee.kpiHistory} dataKey="kpi" height={56} />
              <div className="mt-1 flex items-center justify-between text-[11px] text-subtle">
                <span>{employee.kpiHistory[0]?.month}</span>
                <span className="font-semibold text-ink-2 tabular">
                  {employee.kpiHistory.at(-1)?.kpi ?? employee.kpi}%
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>Davomat taqsimoti (21 kun)</SectionTitle>
            <SegmentBar segments={attendanceSegments} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {attendanceSegments.map((segment) => (
                <span key={segment.key} className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="size-2 rounded-full" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                  <span className="font-semibold text-ink-2 tabular">{segment.value}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-subtle">
              Jami ishlangan: <span className="font-semibold text-ink-2">{formatHours(employee.attendanceHours)}</span>
            </p>
          </div>

          <div>
            <SectionTitle>Aloqa</SectionTitle>
            <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
              <CardRow
                label={
                  <span className="flex items-center gap-2">
                    <Phone className="size-3.5 text-subtle" /> Telefon
                  </span>
                }
                value={formatPhone(employee.phone)}
              />
              <CardRow
                label={
                  <span className="flex items-center gap-2">
                    <Mail className="size-3.5 text-subtle" /> Email
                  </span>
                }
                value={employee.email}
              />
              <CardRow
                label={
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-subtle" /> Manzil
                  </span>
                }
                value={employee.address}
              />
              <CardRow
                label={
                  <span className="flex items-center gap-2">
                    <Users className="size-3.5 text-subtle" /> Rahbar
                  </span>
                }
                value={employee.manager?.fullName ?? '—'}
              />
            </div>
          </div>

          {employee.currentPayroll && (
            <div>
              <SectionTitle>{monthKey()} payroll</SectionTitle>
              <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
                <CardRow label="Oklad" value={formatMoney(employee.currentPayroll.baseSalary)} />
                <CardRow label="Bonus" value={formatMoney(employee.currentPayroll.bonus)} />
                <CardRow label="Ushlanma" value={formatMoney(employee.currentPayroll.deductions)} />
                <CardRow
                  label="Qo‘lga"
                  value={formatMoney(employee.currentPayroll.net)}
                  valueClassName="text-success"
                />
                <CardRow
                  label="Holat"
                  value={<StatusBadge kind="payrollStatus" value={employee.currentPayroll.status} size="xs" />}
                />
              </div>
            </div>
          )}

          {employee.team?.length > 0 && (
            <div>
              <SectionTitle>Bo‘ysunuvchilar ({employee.team.length})</SectionTitle>
              <div className="space-y-1.5">
                {employee.team.slice(0, 5).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/employees/${member.id}`)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/50 px-3 py-2 text-left transition-colors hover:border-brand/40"
                  >
                    <Avatar name={member.fullName} tone={member.avatarTone} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{member.fullName}</span>
                    <span className="shrink-0 text-[11px] text-subtle">{member.position}</span>
                    <TrendingUp className="size-3.5 shrink-0 text-subtle" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
