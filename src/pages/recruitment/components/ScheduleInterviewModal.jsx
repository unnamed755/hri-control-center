import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { scheduleCandidateInterview } from '@/services/workflow/hrWorkflow'
import { useMutation } from '@/hooks/useMutation'
import { interviewType } from '@/config/dictionaries'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'

const INTERVIEWERS = [
  { value: 'emp-004', label: 'Nazarov Rauf — Yetakchi rekruter' },
  { value: 'emp-008', label: 'Islomova Sabina — Rekruter' },
  { value: 'emp-009', label: 'Tursunov Bekzod — Junior rekruter' },
  { value: 'emp-003', label: 'Nazarova Nilufar — HR boshlig‘i' },
  { value: 'emp-011', label: 'Yo‘ldoshev Sardor — Operatsion direktor' },
  { value: 'emp-012', label: 'Mirzayev Javohir — IT rahbari' },
]

const MODES = [
  { value: 'office', label: 'Ofisda' },
  { value: 'online', label: 'Onlayn' },
]

const DURATIONS = [
  { value: 30, label: '30 daqiqa' },
  { value: 45, label: '45 daqiqa' },
  { value: 60, label: '1 soat' },
]

const defaultSlot = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(11, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const ScheduleInterviewModal = ({ open, onClose, candidate }) => {
  const [form, setForm] = useState({
    scheduledAt: defaultSlot(),
    interviewerId: 'emp-004',
    type: 'hr',
    mode: 'office',
    durationMin: 45,
    note: '',
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setForm((prev) => ({
        ...prev,
        scheduledAt: defaultSlot(),
        interviewerId: candidate?.department === 'IT' ? 'emp-012' : (candidate?.recruiterId === 'rec-002' ? 'emp-008' : 'emp-004'),
      }))
    }
  }, [open, candidate])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate, pending } = useMutation(
    () =>
      scheduleCandidateInterview({
        candidateId: candidate.id,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        interviewerId: form.interviewerId,
        type: form.type,
        mode: form.mode,
        durationMin: form.durationMin,
      }),
    { successMessage: 'Suhbat jadvalga qo‘shildi', onSuccess: onClose },
  )

  const submit = () => {
    if (!form.scheduledAt) {
      setError('Sana va vaqtni tanlang')
      return
    }
    if (new Date(form.scheduledAt).getTime() < Date.now() - 60000) {
      setError('O‘tgan vaqtga suhbat belgilab bo‘lmaydi')
      return
    }
    mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={CalendarClock}
      title="Suhbat belgilash"
      subtitle={candidate ? `${candidate.fullName} · ${candidate.profession}` : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={submit}>
            Belgilash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Sana va vaqt" required error={error} className="sm:col-span-2">
          <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} className="[color-scheme:dark]" />
        </Field>
        <Field label="Suhbat turi">
          <Select value={form.type} onChange={(v) => set('type', v)} options={interviewType.options()} />
        </Field>
        <Field label="Format">
          <Select value={form.mode} onChange={(v) => set('mode', v)} options={MODES} />
        </Field>
        <Field label="Suhbatdosh" className="sm:col-span-2">
          <Select value={form.interviewerId} onChange={(v) => set('interviewerId', v)} options={INTERVIEWERS} />
        </Field>
        <Field label="Davomiyligi">
          <Select value={form.durationMin} onChange={(v) => set('durationMin', Number(v))} options={DURATIONS} />
        </Field>
        <Field label="Izoh (ixtiyoriy)" className="sm:col-span-2">
          <Textarea value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Nomzodga eslatma yoki tayyorgarlik bo‘yicha izoh" />
        </Field>
      </div>
    </Modal>
  )
}
