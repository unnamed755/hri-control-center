import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { candidatesService, vacanciesService } from '@/services'
import { useMutation } from '@/hooks/useMutation'
import { useQuery } from '@/hooks/useQuery'
import { QK } from '@/lib/queryBus'
import { PROFESSIONS, SOURCE_NAMES } from '@/data/mock/constants'
import { level as levelDict } from '@/config/dictionaries'
import { optionsFrom } from '@/services/mock/tableUtils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'

const RECRUITERS = [
  { value: 'rec-001', label: 'Nazarov Rauf' },
  { value: 'rec-002', label: 'Islomova Sabina' },
  { value: 'rec-003', label: 'Tursunov Bekzod' },
]

const EMPTY = {
  fullName: '',
  phone: '',
  profession: 'Kassir',
  experienceYears: 1,
  level: 'junior',
  vacancyId: '',
  recruiterId: 'rec-001',
  source: 'Korporativ sayt',
  city: 'Toshkent',
  expectedSalary: 4000000,
  note: '',
}

export const CandidateFormModal = ({ open, onClose }) => {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const { data: vacancies } = useQuery(QK.vacancies, () => vacanciesService.getVacancies({ filters: { status: 'active' } }), {
    deps: ['candidate-form-vacancies'],
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
    }
  }, [open])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate, pending } = useMutation(
    () =>
      candidatesService.createCandidate({
        ...form,
        department: PROFESSIONS.find((p) => p.title === form.profession)?.department,
        notes: form.note ? [{ id: 'note-1', author: 'Super Admin', text: form.note, createdAt: new Date().toISOString() }] : [],
      }),
    { successMessage: 'Nomzod bazaga qo‘shildi', onSuccess: onClose },
  )

  const submit = () => {
    const next = {}
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2) next.fullName = 'F.I.Sh to‘liq kiriting'
    if (!/^\d{12}$/.test(String(form.phone).replace(/\D/g, ''))) next.phone = 'Telefon 998XXXXXXXXX formatida'
    setErrors(next)
    if (Object.keys(next).length) return
    mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      title="Yangi nomzod"
      subtitle="Nomzod bazaga qo‘shiladi va rekruter pipeline’ida ko‘rinadi"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={submit}>
            Qo‘shish
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="F.I.Sh" required error={errors.fullName} className="sm:col-span-2">
          <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Masalan: Yusupov Jasur" />
        </Field>
        <Field label="Telefon" required error={errors.phone}>
          <Input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="998901234567"
          />
        </Field>
        <Field label="Shahar">
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Kasb">
          <Select
            value={form.profession}
            onChange={(value) => {
              set('profession', value)
              const found = PROFESSIONS.find((p) => p.title === value)
              if (found) set('expectedSalary', found.band[0])
            }}
            options={optionsFrom(PROFESSIONS.map((p) => p.title))}
            searchable
          />
        </Field>
        <Field label="Tajriba (yil)">
          <Input
            type="number"
            min="0"
            max="30"
            value={form.experienceYears}
            onChange={(e) => set('experienceYears', Number(e.target.value))}
          />
        </Field>
        <Field label="Daraja">
          <Select value={form.level} onChange={(v) => set('level', v)} options={levelDict.options()} />
        </Field>
        <Field label="Vakansiya">
          <Select
            value={form.vacancyId}
            onChange={(v) => set('vacancyId', v)}
            options={(vacancies?.rows ?? []).map((v) => ({ value: v.id, label: `${v.title} · ${v.branch}` }))}
            allLabel="Tanlanmagan"
            placeholder="Vakansiya"
            searchable
          />
        </Field>
        <Field label="Rekruter">
          <Select value={form.recruiterId} onChange={(v) => set('recruiterId', v)} options={RECRUITERS} />
        </Field>
        <Field label="Manba">
          <Select value={form.source} onChange={(v) => set('source', v)} options={optionsFrom(SOURCE_NAMES)} />
        </Field>
        <Field label="Kutilgan oylik (so‘m)">
          <Input type="number" value={form.expectedSalary} onChange={(e) => set('expectedSalary', Number(e.target.value))} />
        </Field>
        <Field label="Izoh" className="sm:col-span-2">
          <Textarea value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Rekruter izohi..." rows={2} />
        </Field>
      </div>
    </Modal>
  )
}
