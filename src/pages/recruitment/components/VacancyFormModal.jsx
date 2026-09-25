import { useEffect, useState } from 'react'
import { BriefcaseBusiness } from 'lucide-react'
import { vacanciesService } from '@/services'
import { useMutation } from '@/hooks/useMutation'
import { BRANCH_NAMES, DEPARTMENT_NAMES, PROFESSIONS } from '@/data/mock/constants'
import { level as levelDict, taskPriority, vacancyStatus } from '@/config/dictionaries'
import { optionsFrom } from '@/services/mock/tableUtils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'

const RECRUITERS = [
  { value: 'rec-001', label: 'Nazarov Rauf' },
  { value: 'rec-002', label: 'Islomova Sabina' },
  { value: 'rec-003', label: 'Tursunov Bekzod' },
]

const isoDay = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const EMPTY = {
  title: 'Kassir',
  department: 'Savdo',
  branch: 'Chilonzor',
  level: 'junior',
  openings: 1,
  salaryFrom: 3200000,
  salaryTo: 4600000,
  priority: 'medium',
  status: 'active',
  recruiterId: 'rec-001',
  deadline: isoDay(30),
  schedule: 'Smenali 2/2',
  description: '',
  requirements: '',
}

export const VacancyFormModal = ({ open, onClose, vacancy }) => {
  const isEdit = Boolean(vacancy)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      vacancy
        ? {
            title: vacancy.title,
            department: vacancy.department,
            branch: vacancy.branch,
            level: vacancy.level,
            openings: vacancy.openings,
            salaryFrom: vacancy.salaryFrom,
            salaryTo: vacancy.salaryTo,
            priority: vacancy.priority,
            status: vacancy.status,
            recruiterId: vacancy.recruiterId,
            deadline: String(vacancy.deadline).slice(0, 10),
            schedule: vacancy.schedule,
            description: vacancy.description ?? '',
            requirements: (vacancy.requirements ?? []).join('\n'),
          }
        : EMPTY,
    )
  }, [open, vacancy])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate, pending } = useMutation(
    () => {
      const payload = {
        ...form,
        openings: Number(form.openings),
        salaryFrom: Number(form.salaryFrom),
        salaryTo: Number(form.salaryTo),
        deadline: new Date(form.deadline).toISOString(),
        requirements: form.requirements
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      }
      return isEdit ? vacanciesService.updateVacancy(vacancy.id, payload) : vacanciesService.createVacancy(payload)
    },
    { successMessage: isEdit ? 'Vakansiya yangilandi' : 'Vakansiya yaratildi', onSuccess: onClose },
  )

  const submit = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Lavozim nomini kiriting'
    if (Number(form.openings) < 1) next.openings = 'Kamida 1 o‘rin'
    if (Number(form.salaryTo) < Number(form.salaryFrom)) next.salaryTo = 'Yuqori chegara kichik bo‘lmasligi kerak'
    setErrors(next)
    if (Object.keys(next).length) return
    mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={BriefcaseBusiness}
      title={isEdit ? 'Vakansiyani tahrirlash' : 'Yangi vakansiya'}
      subtitle={isEdit ? vacancy.code : 'Vakansiya ochilgach rekruterga biriktiriladi'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={submit}>
            {isEdit ? 'Saqlash' : 'Yaratish'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Lavozim" required error={errors.title}>
          <Select
            value={form.title}
            onChange={(value) => {
              set('title', value)
              const found = PROFESSIONS.find((p) => p.title === value)
              if (found) {
                set('department', found.department)
                set('salaryFrom', found.band[0])
                set('salaryTo', found.band[1])
              }
            }}
            options={optionsFrom(PROFESSIONS.map((p) => p.title))}
            searchable
          />
        </Field>
        <Field label="Bo‘lim">
          <Select value={form.department} onChange={(v) => set('department', v)} options={optionsFrom(DEPARTMENT_NAMES)} />
        </Field>
        <Field label="Filial">
          <Select value={form.branch} onChange={(v) => set('branch', v)} options={optionsFrom(BRANCH_NAMES)} searchable />
        </Field>
        <Field label="Daraja">
          <Select value={form.level} onChange={(v) => set('level', v)} options={levelDict.options()} />
        </Field>
        <Field label="O‘rinlar soni" required error={errors.openings}>
          <Input type="number" min="1" value={form.openings} onChange={(e) => set('openings', e.target.value)} />
        </Field>
        <Field label="Muddat">
          <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className="[color-scheme:dark]" />
        </Field>
        <Field label="Oylik (dan)">
          <Input type="number" value={form.salaryFrom} onChange={(e) => set('salaryFrom', e.target.value)} />
        </Field>
        <Field label="Oylik (gacha)" error={errors.salaryTo}>
          <Input type="number" value={form.salaryTo} onChange={(e) => set('salaryTo', e.target.value)} />
        </Field>
        <Field label="Muhimlik">
          <Select value={form.priority} onChange={(v) => set('priority', v)} options={taskPriority.options()} />
        </Field>
        <Field label="Holat">
          <Select value={form.status} onChange={(v) => set('status', v)} options={vacancyStatus.options()} />
        </Field>
        <Field label="Rekruter">
          <Select value={form.recruiterId} onChange={(v) => set('recruiterId', v)} options={RECRUITERS} />
        </Field>
        <Field label="Ish grafigi">
          <Input value={form.schedule} onChange={(e) => set('schedule', e.target.value)} />
        </Field>
        <Field label="Tavsif" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        </Field>
        <Field label="Talablar (har qatorda bittadan)" className="sm:col-span-2">
          <Textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} rows={4} />
        </Field>
      </div>
    </Modal>
  )
}
