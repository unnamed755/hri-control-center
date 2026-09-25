import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import { tasksService } from '@/services'
import { useMutation } from '@/hooks/useMutation'
import { taskPriority, taskStatus } from '@/config/dictionaries'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'

const ASSIGNEES = [
  { value: 'emp-003', label: 'Nazarova Nilufar — HR bo‘lim boshlig‘i' },
  { value: 'emp-004', label: 'Nazarov Rauf — Yetakchi rekruter' },
  { value: 'emp-005', label: 'Abdullayeva Madina — Onboarding' },
  { value: 'emp-006', label: 'Yusupova Kamola — HR mutaxassis' },
  { value: 'emp-007', label: 'Ergashev Otabek — Ta’lim' },
  { value: 'emp-008', label: 'Islomova Sabina — Rekruter' },
  { value: 'emp-009', label: 'Tursunov Bekzod — Junior rekruter' },
  { value: 'emp-010', label: 'Rahimov Anvar — Bosh buxgalter' },
]

const MODULES = [
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'employees', label: 'Xodimlar' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'analytics', label: 'Analitika' },
]

const isoDay = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const EMPTY = {
  title: '',
  description: '',
  module: 'recruitment',
  priority: 'medium',
  status: 'pending',
  assigneeId: 'emp-004',
  dueDate: isoDay(7),
}

export const TaskFormModal = ({ open, onClose, task }) => {
  const isEdit = Boolean(task)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      task
        ? {
            title: task.title,
            description: task.description ?? '',
            module: task.module,
            priority: task.priority,
            status: task.status,
            assigneeId: task.assigneeId,
            dueDate: String(task.dueDate).slice(0, 10),
          }
        : EMPTY,
    )
  }, [open, task])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate, pending } = useMutation(
    () => {
      const payload = { ...form, dueDate: new Date(form.dueDate).toISOString() }
      return isEdit ? tasksService.updateTask(task.id, payload) : tasksService.createTask(payload)
    },
    { successMessage: isEdit ? 'Vazifa yangilandi' : 'Vazifa yaratildi', onSuccess: onClose },
  )

  const submit = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Sarlavhani kiriting'
    if (!form.dueDate) next.dueDate = 'Muddatni tanlang'
    setErrors(next)
    if (Object.keys(next).length) return
    mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={ListChecks}
      title={isEdit ? 'Vazifani tahrirlash' : 'Yangi HR vazifa'}
      subtitle={isEdit ? task.code : 'Vazifa HR bo‘lim boshlig‘i nomidan yaratiladi'}
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
        <Field label="Sarlavha" required error={errors.title} className="sm:col-span-2">
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Masalan: Chilonzor filiali uchun 6 kassir yopilishi" />
        </Field>
        <Field label="Tavsif" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
        </Field>
        <Field label="Mas’ul">
          <Select value={form.assigneeId} onChange={(v) => set('assigneeId', v)} options={ASSIGNEES} />
        </Field>
        <Field label="Yo‘nalish">
          <Select value={form.module} onChange={(v) => set('module', v)} options={MODULES} />
        </Field>
        <Field label="Muhimlik">
          <Select value={form.priority} onChange={(v) => set('priority', v)} options={taskPriority.options()} />
        </Field>
        <Field label="Holat">
          <Select
            value={form.status}
            onChange={(v) => set('status', v)}
            options={taskStatus.options().filter((o) => o.value !== 'overdue')}
          />
        </Field>
        <Field label="Muddat" required error={errors.dueDate} className="sm:col-span-2">
          <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="[color-scheme:dark]" />
        </Field>
      </div>
    </Modal>
  )
}
