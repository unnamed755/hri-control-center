import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Filter,
  MapPin,
  MessageSquarePlus,
  Phone,
  Rocket,
  Star,
  UserRoundCheck,
  XCircle,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { candidatesService } from '@/services'
import { acceptCandidate, moveCandidateToScreening, rejectCandidate } from '@/services/workflow/hrWorkflow'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { askConfirm } from '@/store/uiStore'
import { formatDate, formatDateTime, formatExperience, formatMoney, formatPhone, relativeTime } from '@/lib/format'
import { candidateStatus } from '@/config/dictionaries'
import { Drawer } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CardRow, SectionTitle } from '@/components/ui/Card'
import { MetricTile } from '@/components/ui/StatCard'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Textarea } from '@/components/ui/Input'
import { ScheduleInterviewModal } from './ScheduleInterviewModal'

const REJECT_REASONS = [
  'Tajriba talabga mos emas',
  'Kutilgan oylik byudjetdan yuqori',
  'Suhbatga kelmadi',
  'Boshqa kompaniyani tanladi',
  'Ish grafigi mos kelmadi',
]

export const CandidateDrawer = ({ candidateId, open, onClose }) => {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const { data: candidate, loading } = useQuery(
    [QK.candidates, QK.interviews, QK.onboarding],
    () => candidatesService.getCandidateById(candidateId),
    { deps: ['candidate-drawer', candidateId], enabled: Boolean(candidateId && open) },
  )

  const { mutate: screen, pending: screening } = useMutation(() => moveCandidateToScreening(candidateId), {
    successMessage: 'Nomzod saralashga o‘tkazildi',
  })

  const { mutate: accept, pending: accepting } = useMutation(() => acceptCandidate(candidateId), {
    successMessage: (record) => `Qabul qilindi — onboarding ochildi (mas’ul: ${record.hrResponsibleName})`,
  })

  const { mutate: reject, pending: rejecting } = useMutation((reason) => rejectCandidate(candidateId, reason), {
    successMessage: 'Nomzod rad etildi',
  })

  const { mutate: addNote, pending: noting } = useMutation(
    () => candidatesService.addCandidateNote(candidateId, note.trim()),
    { successMessage: 'Izoh qo‘shildi', onSuccess: () => setNote('') },
  )

  const handleReject = async () => {
    const ok = await askConfirm({
      title: 'Nomzodni rad etish',
      description: `${candidate.fullName} rad etilganlar ro‘yxatiga o‘tkaziladi. Sabab: "${REJECT_REASONS[0]}".`,
      confirmLabel: 'Rad etish',
    })
    if (!ok) return
    reject(REJECT_REASONS[0])
  }

  const canScreen = candidate?.status === 'new'
  const canSchedule = ['new', 'screening', 'interview'].includes(candidate?.status)
  const canAccept = ['screening', 'interview'].includes(candidate?.status)

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={candidate?.fullName ?? 'Nomzod'}
        subtitle={candidate ? `${candidate.profession} · ${formatExperience(candidate.experienceYears)} · ${candidate.city}` : ''}
        badge={candidate && <StatusBadge kind="candidateStatus" value={candidate.status} size="xs" />}
        footer={
          candidate && (
            <>
              {candidate.status !== 'rejected' && candidate.status !== 'hired' && (
                <Button variant="danger" size="sm" icon={XCircle} loading={rejecting} onClick={handleReject}>
                  Rad etish
                </Button>
              )}
              {canScreen && (
                <Button variant="secondary" size="sm" icon={Filter} loading={screening} onClick={() => screen()}>
                  Saralashga
                </Button>
              )}
              {canSchedule && (
                <Button variant="secondary" size="sm" icon={CalendarClock} onClick={() => setScheduleOpen(true)}>
                  Suhbat belgilash
                </Button>
              )}
              {canAccept && (
                <Button variant="primary" size="sm" icon={CheckCircle2} loading={accepting} onClick={() => accept()}>
                  Qabul qilish
                </Button>
              )}
              {candidate.onboarding && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Rocket}
                  onClick={() => {
                    onClose()
                    navigate('/onboarding')
                  }}
                >
                  Onboardingga o‘tish
                </Button>
              )}
              {candidate.employeeId && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserRoundCheck}
                  onClick={() => {
                    onClose()
                    navigate(`/employees/${candidate.employeeId}`)
                  }}
                >
                  Xodim profili
                </Button>
              )}
            </>
          )
        }
      >
        {loading || !candidate ? (
          <SkeletonList rows={7} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={candidate.fullName} tone={candidate.avatarTone} size="2xl" />
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-ink">{candidate.fullName}</p>
                <p className="text-[12.5px] text-muted">
                  {candidate.profession} · {candidate.vacancyTitle}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge kind="level" value={candidate.level} size="xs" />
                  <span className="flex items-center gap-1 text-[11.5px] text-warning">
                    <Star className="size-3.5 fill-current" strokeWidth={0} />
                    {candidate.rating}
                  </span>
                  <span className="text-[11.5px] text-subtle">{candidate.source}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricTile label="Tajriba" value={formatExperience(candidate.experienceYears)} icon={UserRoundCheck} tone="brand" />
              <MetricTile
                label="Kutilgan oylik"
                value={formatMoney(candidate.expectedSalary, { compact: true })}
                icon={FileText}
                tone="violet"
              />
            </div>

            <div>
              <SectionTitle>Ma’lumotlar</SectionTitle>
              <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
                <CardRow
                  label={
                    <span className="flex items-center gap-2">
                      <Phone className="size-3.5 text-subtle" /> Telefon
                    </span>
                  }
                  value={formatPhone(candidate.phone)}
                />
                <CardRow
                  label={
                    <span className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-subtle" /> Shahar
                    </span>
                  }
                  value={candidate.city}
                />
                <CardRow label="Ma’lumoti" value={candidate.education} />
                <CardRow label="Tillar" value={(candidate.languages ?? []).join(', ') || '—'} />
                <CardRow label="Rekruter" value={candidate.recruiterName} />
                <CardRow label="Vakansiya" value={candidate.vacancy?.title ?? candidate.vacancyTitle} />
                <CardRow label="Filial" value={candidate.branch} />
                <CardRow label="Qo‘shilgan" value={formatDate(candidate.createdAt)} />
                {candidate.cv && <CardRow label="Rezyume" value={`${candidate.cv.fileName} (${candidate.cv.sizeKb} KB)`} />}
                {candidate.rejectReason && <CardRow label="Rad etish sababi" value={candidate.rejectReason} valueClassName="text-danger" />}
              </div>
            </div>

            {candidate.interviews?.length > 0 && (
              <div>
                <SectionTitle>Suhbatlar ({candidate.interviews.length})</SectionTitle>
                <div className="space-y-2">
                  {candidate.interviews.map((interview) => (
                    <div key={interview.id} className="rounded-[11px] border border-line bg-surface-2/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-medium text-ink">{formatDateTime(interview.scheduledAt)}</span>
                        <StatusBadge kind="interviewStatus" value={interview.status} size="xs" />
                      </div>
                      <p className="mt-1 text-[11.5px] text-muted">
                        {interview.interviewerName} · {interview.location}
                      </p>
                      {interview.feedback && <p className="mt-1.5 text-[11.5px] text-subtle">“{interview.feedback}”</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionTitle>Jarayon tarixi</SectionTitle>
              <ol className="relative space-y-0 pl-1">
                {candidate.timeline?.map((entry, index) => (
                  <li key={`${entry.stage}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {index !== candidate.timeline.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-[calc(100%-1rem)] w-px bg-line" />
                    )}
                    <span
                      className="relative z-10 mt-1 size-3.5 shrink-0 rounded-full border-2"
                      style={{
                        borderColor: `var(--color-${candidateStatus.tone(entry.stage) === 'neutral' ? 'subtle' : candidateStatus.tone(entry.stage)})`,
                        background: 'var(--color-surface)',
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-ink-2">{candidateStatus.label(entry.stage)}</p>
                      <p className="text-[11.5px] text-subtle">{entry.note}</p>
                      <p className="mt-0.5 text-[10.5px] text-faint">
                        {formatDateTime(entry.at)} · {entry.by}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <SectionTitle>Izohlar ({candidate.notes?.length ?? 0})</SectionTitle>
              <div className="space-y-2">
                {(candidate.notes ?? []).map((item) => (
                  <div key={item.id} className="rounded-[11px] border border-line bg-surface-2/60 p-3">
                    <p className="text-[12px] text-ink-2">{item.text}</p>
                    <p className="mt-1 text-[10.5px] text-faint">
                      {item.author} · {relativeTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 space-y-2">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Yangi izoh qo‘shish..." rows={2} />
                <Button
                  size="sm"
                  variant="secondary"
                  icon={MessageSquarePlus}
                  disabled={!note.trim()}
                  loading={noting}
                  onClick={() => addNote()}
                >
                  Izoh qo‘shish
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ScheduleInterviewModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} candidate={candidate} />
    </>
  )
}
