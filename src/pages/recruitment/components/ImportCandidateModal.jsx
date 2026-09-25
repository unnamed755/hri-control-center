import { useEffect, useState } from 'react'
import { ArrowRight, Globe2 } from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { vacanciesService } from '@/services'
import { importExternalCandidate } from '@/services/workflow/hrWorkflow'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { formatExperience, formatMoney, formatPhone } from '@/lib/format'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'

const RECRUITERS = [
  { value: 'rec-001', label: 'Nazarov Rauf — Yetakchi rekruter' },
  { value: 'rec-002', label: 'Islomova Sabina — Rekruter' },
  { value: 'rec-003', label: 'Tursunov Bekzod — Junior rekruter' },
]

export const ImportCandidateModal = ({ open, onClose, external, onImported }) => {
  const [recruiterId, setRecruiterId] = useState('rec-001')
  const [vacancyId, setVacancyId] = useState('')

  const { data: vacancies } = useQuery(QK.vacancies, () => vacanciesService.getVacancies({ filters: { status: 'active' } }), {
    deps: ['import-vacancies'],
    enabled: open,
  })

  useEffect(() => {
    if (!open || !external) return
    setRecruiterId('rec-001')
    const match = (vacancies?.rows ?? []).find((v) => v.title === external.profession)
    setVacancyId(match?.id ?? '')
  }, [open, external, vacancies])

  const { mutate, pending } = useMutation(
    () => importExternalCandidate(external, { recruiterId, vacancyId: vacancyId || undefined }),
    {
      successMessage: (candidate) => `${candidate.fullName} nomzodlar bazasiga qo‘shildi`,
      onSuccess: (candidate) => {
        onImported?.(candidate)
        onClose()
      },
    },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Globe2}
      title="Nomzodni bazaga olish"
      subtitle="Recruiter Web → Rekruter → Nomzodlar bazasi"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} icon={ArrowRight} onClick={() => mutate()}>
            Bazaga olish
          </Button>
        </>
      }
    >
      {external && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-[12px] border border-line bg-surface-2/60 p-3.5">
            <Avatar name={external.fullName} tone={external.avatarTone} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{external.fullName}</p>
              <p className="truncate text-[12px] text-muted">
                {external.profession} · {formatExperience(external.experienceYears)} · {external.city}
              </p>
              <p className="mt-1 text-[11.5px] text-subtle">
                {formatPhone(external.phone)} · Kutilgan oylik {formatMoney(external.expectedSalary, { compact: true })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <StatusBadge kind="externalStatus" value={external.status} size="xs" />
              <p className="mt-1.5 text-[11px] text-subtle">Manba: {external.source}</p>
              <p className="text-[11px] text-teal">Moslik: {external.matchScore}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Mas’ul rekruter">
              <Select value={recruiterId} onChange={setRecruiterId} options={RECRUITERS} />
            </Field>
            <Field label="Vakansiya" hint="Ixtiyoriy — keyinroq ham biriktirish mumkin">
              <Select
                value={vacancyId}
                onChange={setVacancyId}
                options={(vacancies?.rows ?? []).map((v) => ({ value: v.id, label: `${v.title} · ${v.branch}` }))}
                allLabel="Tanlanmagan"
                placeholder="Vakansiya"
                searchable
              />
            </Field>
          </div>

          {external.note && (
            <p className="rounded-[10px] border border-line bg-surface-2/50 p-3 text-[12px] text-muted">
              <span className="text-subtle">Web izohi: </span>
              {external.note}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
