import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, MessageSquarePlus, Rocket, UserRoundCheck } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { onboardingService } from '@/services'
import { advanceOnboarding, completeOnboarding } from '@/services/workflow/hrWorkflow'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { askConfirm } from '@/store/uiStore'
import { formatDate, formatDateTime, formatMoney, relativeTime } from '@/lib/format'
import { ONBOARDING_STAGES, onboardingStage } from '@/config/dictionaries'
import { Drawer } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CardRow, SectionTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Stepper } from '@/components/ui/Stepper'
import { Checkbox, Select, Textarea } from '@/components/ui/Input'
import { SkeletonList } from '@/components/ui/Skeleton'

const HR_TEAM = [
  { value: 'emp-005', label: 'Abdullayeva Madina' },
  { value: 'emp-006', label: 'Yusupova Kamola' },
  { value: 'emp-007', label: 'Ergashev Otabek' },
]

export const OnboardingDrawer = ({ recordId, open, onClose }) => {
  const navigate = useNavigate()
  const [note, setNote] = useState('')

  const { data: record, loading } = useQuery(
    [QK.onboarding, QK.candidates, QK.employees],
    () => onboardingService.getOnboardingById(recordId),
    { deps: ['onboarding-drawer', recordId], enabled: Boolean(recordId && open) },
  )

  const stageIndex = record ? ONBOARDING_STAGES.indexOf(record.stage) : 0
  const nextStage = ONBOARDING_STAGES[stageIndex + 1]

  const { mutate: toggleItem } = useMutation((itemId) => onboardingService.toggleChecklistItem(recordId, itemId), {
    toastOnSuccess: false,
  })

  const { mutate: advance, pending: advancing } = useMutation((stage) => advanceOnboarding(recordId, stage), {
    successMessage: (result) => `Bosqich yangilandi: ${onboardingStage.label(result.stage ?? result.record?.stage)}`,
  })

  const { mutate: finish, pending: finishing } = useMutation(() => completeOnboarding(recordId), {
    successMessage: (result) => `START! ${result.employee.fullName} xodimlar ro‘yxatiga qo‘shildi`,
  })

  const { mutate: assign } = useMutation((hrId) => onboardingService.assignHrResponsible(recordId, hrId), {
    successMessage: 'HR mas’ul yangilandi',
  })

  const { mutate: addNote, pending: noting } = useMutation(() => onboardingService.addNote(recordId, note.trim()), {
    successMessage: 'Izoh qo‘shildi',
    onSuccess: () => setNote(''),
  })

  const handleStart = async () => {
    const ok = await askConfirm({
      title: 'Onboardingni yakunlash (START)',
      description: `${record.fullName} xodim sifatida ro‘yxatga olinadi, payroll va KPI yozuvlari yaratiladi, vakansiya o‘rni band qilinadi.`,
      confirmLabel: 'START',
      tone: 'brand',
    })
    if (!ok) return
    finish()
  }

  const groupedChecklist = ONBOARDING_STAGES.filter((s) => s !== 'accepted' && s !== 'started').map((stage) => ({
    stage,
    items: (record?.checklist ?? []).filter((item) => item.stage === stage),
  }))

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={record?.fullName ?? 'Onboarding'}
      subtitle={record ? `${record.position} · ${record.department} · ${record.branch}` : ''}
      badge={record && <StatusBadge kind="onboardingStage" value={record.stage} size="xs" />}
      icon={Rocket}
      footer={
        record && (
          <>
            {record.employeeId && (
              <Button
                variant="secondary"
                size="sm"
                icon={UserRoundCheck}
                onClick={() => {
                  onClose()
                  navigate(`/employees/${record.employeeId}`)
                }}
              >
                Xodim profili
              </Button>
            )}
            {record.stage !== 'started' && nextStage && nextStage !== 'started' && (
              <Button variant="secondary" size="sm" icon={ChevronRight} loading={advancing} onClick={() => advance(nextStage)}>
                {onboardingStage.label(nextStage)}
              </Button>
            )}
            {record.stage === 'ready' && (
              <Button variant="primary" size="sm" icon={Rocket} loading={finishing} onClick={handleStart}>
                START — xodim qilish
              </Button>
            )}
            {record.stage !== 'started' && record.stage !== 'ready' && (
              <Button variant="primary" size="sm" icon={Rocket} loading={finishing} onClick={handleStart}>
                Yakunlash (START)
              </Button>
            )}
          </>
        )
      }
    >
      {loading || !record ? (
        <SkeletonList rows={8} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={record.fullName} tone={record.avatarTone} size="2xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold text-ink">{record.fullName}</p>
              <p className="text-[12.5px] text-muted">
                {record.position} · {record.vacancyTitle}
              </p>
              <p className="mt-1 text-[11.5px] text-subtle">
                {record.daysInProcess} kundan beri jarayonda · START sanasi: {formatDate(record.targetStartDate)}
              </p>
            </div>
          </div>

          <ProgressBar
            value={record.progress}
            label={`Checklist: ${record.checklistDone} / ${record.checklistTotal}`}
            showValue
          />

          <div>
            <SectionTitle>Bosqichlar</SectionTitle>
            <Stepper
              orientation="vertical"
              steps={ONBOARDING_STAGES.map((stage) => ({
                key: stage,
                label: onboardingStage.label(stage),
                hint:
                  record.history?.find((h) => h.stage === stage)
                    ? formatDate(record.history.find((h) => h.stage === stage).at)
                    : undefined,
              }))}
              currentIndex={stageIndex}
              onSelect={(stage) => {
                if (stage === 'started') handleStart()
                else advance(stage)
              }}
            />
          </div>

          <div>
            <SectionTitle>Checklist</SectionTitle>
            <div className="space-y-3.5">
              {groupedChecklist.map((group) => (
                <div key={group.stage} className="rounded-[12px] border border-line bg-surface-2/50 p-3">
                  <p className="mb-2 flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.07em] text-subtle">
                    <StatusBadge kind="onboardingStage" value={group.stage} size="xs" />
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <Checkbox
                        key={item.id}
                        checked={item.done}
                        onChange={() => toggleItem(item.id)}
                        label={
                          <span className={item.done ? 'text-muted line-through' : ''}>
                            {item.label}
                            {item.doneAt && <span className="ml-2 text-[10.5px] text-faint">{formatDate(item.doneAt)}</span>}
                          </span>
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Mas’ullar</SectionTitle>
            <div className="space-y-2.5">
              <Select value={record.hrResponsibleId} onChange={(value) => assign(value)} options={HR_TEAM} size="sm" />
              <div className="rounded-[12px] border border-line bg-surface-2/60 px-3.5">
                <CardRow label="Mentor" value={record.mentorName} />
                <CardRow label="Taklif qilingan oylik" value={formatMoney(record.salaryOffer)} />
                <CardRow label="Boshlangan" value={formatDate(record.createdAt)} />
                <CardRow label="Yakunlangan" value={record.completedAt ? formatDate(record.completedAt) : '—'} />
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>Izohlar ({record.notes?.length ?? 0})</SectionTitle>
            <div className="space-y-2">
              {(record.notes ?? []).map((item) => (
                <div key={item.id} className="rounded-[11px] border border-line bg-surface-2/60 p-3">
                  <p className="text-[12px] text-ink-2">{item.text}</p>
                  <p className="mt-1 text-[10.5px] text-faint">
                    {item.author} · {relativeTime(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 space-y-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Jarayon bo‘yicha izoh..." rows={2} />
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

          <div>
            <SectionTitle>Jarayon tarixi</SectionTitle>
            <div className="space-y-1.5">
              {(record.history ?? []).map((entry, index) => (
                <div key={`${entry.stage}-${index}`} className="flex items-center gap-2.5 text-[12px]">
                  <CheckCircle2 className="size-3.5 shrink-0 text-success" strokeWidth={2.2} />
                  <span className="text-ink-2">{onboardingStage.label(entry.stage)}</span>
                  <span className="ml-auto text-[11px] text-faint">{formatDateTime(entry.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
