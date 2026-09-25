import { useEffect, useState } from 'react'
import { CalendarClock, ClipboardCheck } from 'lucide-react'
import { interviewsService } from '@/services'
import { completeCandidateInterview } from '@/services/workflow/hrWorkflow'
import { useMutation } from '@/hooks/useMutation'
import { formatDateTime } from '@/lib/format'
import { interviewResult } from '@/config/dictionaries'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'

const toLocalInput = (iso) => {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const InterviewResultModal = ({ open, onClose, interview }) => {
  const [form, setForm] = useState({ result: 'passed', score: 85, feedback: '' })

  useEffect(() => {
    if (open) setForm({ result: 'passed', score: 85, feedback: '' })
  }, [open])

  const { mutate, pending } = useMutation(
    () =>
      completeCandidateInterview(interview.id, {
        result: form.result,
        score: Number(form.score),
        feedback: form.feedback.trim() || null,
      }),
    { successMessage: 'Suhbat natijasi saqlandi', onSuccess: onClose },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={ClipboardCheck}
      title="Suhbat natijasi"
      subtitle={interview ? `${interview.candidateName} · ${formatDateTime(interview.scheduledAt)}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={() => mutate()}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Natija">
          <Select
            value={form.result}
            onChange={(v) => setForm((p) => ({ ...p, result: v, score: v === 'passed' ? 85 : v === 'failed' ? 45 : 65 }))}
            options={interviewResult.options().filter((o) => o.value !== 'pending')}
          />
        </Field>
        <Field label="Ball (0–100)">
          <Input
            type="number"
            min="0"
            max="100"
            value={form.score}
            onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
          />
        </Field>
        <Field label="Izoh / xulosa" className="sm:col-span-2">
          <Textarea
            value={form.feedback}
            onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))}
            placeholder="Nomzod bo‘yicha qisqacha xulosa..."
            rows={3}
          />
        </Field>
      </div>
      <p className="mt-4 rounded-[10px] border border-line bg-surface-2/50 p-3 text-[11.5px] leading-relaxed text-subtle">
        “O‘tmadi” natijasi tanlansa, nomzod avtomatik ravishda rad etilganlar ro‘yxatiga o‘tadi va pipeline yangilanadi.
      </p>
    </Modal>
  )
}

export const RescheduleModal = ({ open, onClose, interview }) => {
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open && interview) {
      setValue(toLocalInput(interview.scheduledAt))
      setReason('')
    }
  }, [open, interview])

  const { mutate, pending } = useMutation(
    () => interviewsService.rescheduleInterview(interview.id, new Date(value).toISOString(), { reason: reason.trim() || null }),
    { successMessage: 'Suhbat vaqti ko‘chirildi', onSuccess: onClose },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={CalendarClock}
      title="Suhbatni ko‘chirish"
      subtitle={interview ? interview.candidateName : ''}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={() => mutate()}>
            Ko‘chirish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Yangi sana va vaqt" required>
          <Input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} className="[color-scheme:dark]" />
        </Field>
        <Field label="Sabab">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Masalan: nomzod so‘rovi bo‘yicha" />
        </Field>
      </div>
    </Modal>
  )
}
