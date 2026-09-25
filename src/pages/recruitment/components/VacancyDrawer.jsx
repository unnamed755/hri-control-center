import { useNavigate } from 'react-router-dom'
import { Archive, CheckCircle2, ListChecks, Pause, Pencil, Play, UserRoundCog, Users } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { vacanciesService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { candidateStatus, RECRUITMENT_PIPELINE } from '@/config/dictionaries'
import { Drawer } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CardRow, SectionTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/States'
import { Select } from '@/components/ui/Input'
import { FunnelStages } from '@/components/charts/ChartKit'

const RECRUITERS = [
  { value: 'rec-001', label: 'Nazarov Rauf' },
  { value: 'rec-002', label: 'Islomova Sabina' },
  { value: 'rec-003', label: 'Tursunov Bekzod' },
]

export const VacancyDrawer = ({ vacancyId, open, onClose, onEdit }) => {
  const navigate = useNavigate()
  const { data: vacancy, loading } = useQuery(
    [QK.vacancies, QK.candidates, QK.interviews],
    () => vacanciesService.getVacancyById(vacancyId),
    { deps: ['vacancy-drawer', vacancyId], enabled: Boolean(vacancyId && open) },
  )

  const { mutate: setStatus, pending: statusPending } = useMutation(
    (status) => vacanciesService.setVacancyStatus(vacancyId, status),
    { successMessage: 'Vakansiya holati yangilandi' },
  )

  const { mutate: assign } = useMutation((recruiterId) => vacanciesService.assignRecruiter(vacancyId, recruiterId), {
    successMessage: 'Rekruter biriktirildi',
  })

  const pipeline = RECRUITMENT_PIPELINE.map((stage) => ({
    ...stage,
    value: vacancy?.pipeline?.[stage.key] ?? 0,
  }))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={vacancy?.title ?? 'Vakansiya'}
      subtitle={vacancy ? `${vacancy.code} · ${vacancy.department} · ${vacancy.branch}` : ''}
      badge={vacancy && <StatusBadge kind="vacancyStatus" value={vacancy.status} size="xs" />}
      footer={
        vacancy && (
          <>
            {vacancy.status === 'active' ? (
              <Button variant="warning" size="sm" icon={Pause} loading={statusPending} onClick={() => setStatus('paused')}>
                Pauza
              </Button>
            ) : vacancy.status === 'paused' ? (
              <Button variant="success" size="sm" icon={Play} loading={statusPending} onClick={() => setStatus('active')}>
                Faollashtirish
              </Button>
            ) : null}
            {vacancy.status !== 'archived' && (
              <Button variant="danger" size="sm" icon={Archive} loading={statusPending} onClick={() => setStatus('archived')}>
                Arxivlash
              </Button>
            )}
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit?.(vacancy)}>
              Tahrirlash
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Users}
              onClick={() => {
                onClose()
                navigate(`/candidates?vacancy=${vacancy.id}`)
              }}
            >
              Nomzodlar ({vacancy.candidateCount})
            </Button>
          </>
        )
      }
    >
      {loading || !vacancy ? (
        <SkeletonList rows={7} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'O‘rinlar', value: vacancy.openings },
              { label: 'Nomzodlar', value: vacancy.candidateCount },
              { label: 'Ishga olingan', value: vacancy.hiredCount },
            ].map((metric) => (
              <div key={metric.label} className="rounded-[12px] border border-line bg-surface-2/60 p-3">
                <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">{metric.label}</p>
                <p className="mt-1 text-[19px] font-semibold text-ink tabular">{metric.value}</p>
              </div>
            ))}
          </div>

          <ProgressBar value={vacancy.fillRate} label="To‘ldirilganlik" showValue />

          <div>
            <SectionTitle>Nomzodlar oqimi</SectionTitle>
            <FunnelStages data={pipeline} />
          </div>

          <div>
            <SectionTitle>Vakansiya ma’lumotlari</SectionTitle>
            <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
              <CardRow label="Daraja" value={<StatusBadge kind="level" value={vacancy.level} size="xs" dot={false} />} />
              <CardRow label="Muhimlik" value={<StatusBadge kind="taskPriority" value={vacancy.priority} size="xs" />} />
              <CardRow
                label="Oylik"
                value={`${formatMoney(vacancy.salaryFrom, { currency: '' })} – ${formatMoney(vacancy.salaryTo)}`}
              />
              <CardRow label="Grafik" value={vacancy.schedule} />
              <CardRow label="Ochilgan" value={formatDate(vacancy.createdAt)} />
              <CardRow label="Muddat" value={formatDate(vacancy.deadline)} />
              <CardRow label="Ko‘rishlar" value={formatNumber(vacancy.views)} />
            </div>
          </div>

          <div>
            <SectionTitle>Rekruter</SectionTitle>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
                <UserRoundCog className="size-4" strokeWidth={2} />
              </span>
              <Select
                className="flex-1"
                size="sm"
                value={vacancy.recruiterId}
                onChange={(value) => assign(value)}
                options={RECRUITERS}
              />
            </div>
          </div>

          {vacancy.description && (
            <div>
              <SectionTitle>Tavsif</SectionTitle>
              <p className="text-[12.5px] leading-relaxed text-muted">{vacancy.description}</p>
            </div>
          )}

          {vacancy.requirements?.length > 0 && (
            <div>
              <SectionTitle>Talablar</SectionTitle>
              <ul className="space-y-1.5">
                {vacancy.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12.5px] text-ink-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <SectionTitle action={<span className="text-[11px] text-subtle">{vacancy.candidates.length} ta</span>}>
              Oxirgi nomzodlar
            </SectionTitle>
            {vacancy.candidates.length === 0 ? (
              <EmptyState icon={ListChecks} title="Nomzod yo‘q" compact />
            ) : (
              <div className="space-y-1.5">
                {vacancy.candidates.slice(0, 6).map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/candidates?focus=${candidate.id}`)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/50 px-3 py-2 text-left transition-colors hover:border-brand/40"
                  >
                    <Avatar name={candidate.fullName} tone={candidate.avatarTone} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{candidate.fullName}</span>
                    <StatusBadge kind="candidateStatus" value={candidate.status} size="xs" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}
