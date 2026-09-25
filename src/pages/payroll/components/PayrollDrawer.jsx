import { useNavigate } from 'react-router-dom'
import { CheckCircle2, PauseCircle, Receipt, UserRound } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { payrollService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { formatDate, formatMoney, formatMonthKey } from '@/lib/format'
import { Drawer } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CardRow, SectionTitle } from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { AreaTrend } from '@/components/charts/ChartKit'

export const PayrollDrawer = ({ recordId, open, onClose }) => {
  const navigate = useNavigate()
  const { data: record, loading } = useQuery(
    [QK.payroll, QK.employees],
    () => payrollService.getPayrollById(recordId),
    { deps: ['payroll-drawer', recordId], enabled: Boolean(recordId && open) },
  )

  const { mutate: setStatus, pending } = useMutation((status) => payrollService.setPayrollStatus(recordId, status), {
    successMessage: 'To‘lov holati yangilandi',
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      icon={Receipt}
      title={record?.fullName ?? 'To‘lov'}
      subtitle={record ? `${formatMonthKey(record.month, false)} · ${record.position}` : ''}
      badge={record && <StatusBadge kind="payrollStatus" value={record.status} size="xs" />}
      size="md"
      footer={
        record && (
          <>
            {record.status !== 'hold' && (
              <Button variant="warning" size="sm" icon={PauseCircle} loading={pending} onClick={() => setStatus('hold')}>
                To‘xtatish
              </Button>
            )}
            {record.status !== 'paid' && (
              <Button variant="primary" size="sm" icon={CheckCircle2} loading={pending} onClick={() => setStatus('paid')}>
                To‘langan
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={UserRound}
              onClick={() => {
                onClose()
                navigate(`/employees/${record.employeeId}`)
              }}
            >
              Xodim profili
            </Button>
          </>
        )
      }
    >
      {loading || !record ? (
        <SkeletonList rows={6} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={record.fullName} tone={record.avatarTone} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">{record.fullName}</p>
              <p className="text-[12px] text-muted">
                {record.employeeCode} · {record.department} · {record.branch}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[19px] font-semibold text-ink tabular">{formatMoney(record.net, { currency: '' })}</p>
              <p className="text-[11px] text-subtle">qo‘lga, so‘m</p>
            </div>
          </div>

          <div>
            <SectionTitle>Hisob-kitob</SectionTitle>
            <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
              <CardRow label="Oklad" value={formatMoney(record.baseSalary)} />
              <CardRow label="Bonus (KPI)" value={formatMoney(record.bonus)} valueClassName="text-success" />
              <CardRow label="Coins bonusi" value={formatMoney(record.coinsBonus)} valueClassName="text-success" />
              <CardRow label="Qo‘shimcha ish" value={formatMoney(record.overtime)} />
              <CardRow label="Kechikish ushlanmasi" value={formatMoney(record.lateDeduction)} valueClassName="text-danger" />
              <CardRow label="Yo‘qlik ushlanmasi" value={formatMoney(record.absenceDeduction)} valueClassName="text-danger" />
              <CardRow label="Jami (gross)" value={formatMoney(record.gross)} />
              <CardRow label="Daromad solig‘i (12%)" value={formatMoney(record.tax)} valueClassName="text-danger" />
              <CardRow label="INPS (0,1%)" value={formatMoney(record.pension)} valueClassName="text-danger" />
              <CardRow label="Qo‘lga" value={formatMoney(record.net)} valueClassName="text-success" />
            </div>
          </div>

          <div>
            <SectionTitle>To‘lov ma’lumotlari</SectionTitle>
            <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
              <CardRow label="Usul" value={record.method} />
              <CardRow label="Ishlangan kunlar" value={record.workedDays} />
              <CardRow label="To‘langan sana" value={record.paidAt ? formatDate(record.paidAt) : '—'} />
              {record.note && <CardRow label="Izoh" value={record.note} />}
            </div>
          </div>

          {record.history?.length > 1 && (
            <div>
              <SectionTitle>To‘lovlar tarixi</SectionTitle>
              <div className="rounded-[12px] border border-line bg-surface-2/50 p-3">
                <AreaTrend
                  data={[...record.history].reverse()}
                  xKey="month"
                  xFormatter={(v) => formatMonthKey(v)}
                  height={150}
                  valueFormatter={(v) => formatMoney(v, { compact: true })}
                  series={[{ key: 'net', label: 'Qo‘lga', color: 'var(--color-violet)' }]}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
