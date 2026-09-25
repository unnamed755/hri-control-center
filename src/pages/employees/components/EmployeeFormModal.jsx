import { useEffect, useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { employeesService } from '@/services'
import { useMutation } from '@/hooks/useMutation'
import { BRANCH_NAMES, DEPARTMENT_NAMES, POSITIONS } from '@/data/mock/constants'
import { employmentType, level as levelDict } from '@/config/dictionaries'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { optionsFrom } from '@/services/mock/tableUtils'

const EMPTY = {
  fullName: '',
  phone: '',
  email: '',
  department: 'Savdo',
  position: 'Kassir',
  branch: 'Chilonzor',
  level: 'junior',
  employmentType: 'full',
  salary: 4000000,
  education: '',
}

export const EmployeeFormModal = ({ open, onClose, employee }) => {
  const isEdit = Boolean(employee)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      employee
        ? {
            fullName: employee.fullName,
            phone: employee.phone,
            email: employee.email,
            department: employee.department,
            position: employee.position,
            branch: employee.branch,
            level: employee.level,
            employmentType: employee.employmentType,
            salary: employee.salary,
            education: employee.education ?? '',
          }
        : EMPTY,
    )
  }, [open, employee])

  const positionOptions = useMemo(
    () => optionsFrom((POSITIONS[form.department] ?? []).map((p) => p.title)),
    [form.department],
  )

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate, pending } = useMutation(
    async () => {
      if (isEdit) return employeesService.updateEmployee(employee.id, form)
      return employeesService.createEmployee(form)
    },
    {
      successMessage: isEdit ? 'Xodim ma’lumotlari yangilandi' : 'Yangi xodim qo‘shildi',
      onSuccess: () => onClose(),
    },
  )

  const submit = () => {
    const next = {}
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2)
      next.fullName = 'F.I.Sh to‘liq kiriting (kamida 2 so‘z)'
    if (!/^\d{12}$/.test(String(form.phone).replace(/\D/g, ''))) next.phone = 'Telefon 998XXXXXXXXX formatida'
    if (!form.position) next.position = 'Lavozimni tanlang'
    if (!Number(form.salary)) next.salary = 'Oylikni kiriting'
    setErrors(next)
    if (Object.keys(next).length) return
    mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={UserPlus}
      title={isEdit ? 'Xodimni tahrirlash' : 'Yangi xodim qo‘shish'}
      subtitle={isEdit ? employee.code : 'Demo bazaga xodim qo‘shiladi va payroll yozuvi yaratiladi'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={submit}>
            {isEdit ? 'Saqlash' : 'Qo‘shish'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="F.I.Sh" required error={errors.fullName} className="sm:col-span-2">
          <Input
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Masalan: Karimov Azizbek"
          />
        </Field>
        <Field label="Telefon" required error={errors.phone}>
          <Input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="998901234567"
          />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="ism@hri-demo.uz" />
        </Field>
        <Field label="Bo‘lim">
          <Select
            value={form.department}
            onChange={(value) => {
              set('department', value)
              const first = POSITIONS[value]?.[0]
              if (first) {
                set('position', first.title)
                set('salary', first.band[0])
              }
            }}
            options={optionsFrom(DEPARTMENT_NAMES)}
          />
        </Field>
        <Field label="Lavozim" required error={errors.position}>
          <Select
            value={form.position}
            onChange={(value) => {
              set('position', value)
              const found = (POSITIONS[form.department] ?? []).find((p) => p.title === value)
              if (found) set('salary', found.band[0])
            }}
            options={positionOptions}
          />
        </Field>
        <Field label="Filial">
          <Select value={form.branch} onChange={(value) => set('branch', value)} options={optionsFrom(BRANCH_NAMES)} searchable />
        </Field>
        <Field label="Daraja">
          <Select value={form.level} onChange={(value) => set('level', value)} options={levelDict.options()} />
        </Field>
        <Field label="Bandlik turi">
          <Select
            value={form.employmentType}
            onChange={(value) => set('employmentType', value)}
            options={employmentType.options()}
          />
        </Field>
        <Field label="Oylik (so‘m)" required error={errors.salary}>
          <Input
            type="number"
            value={form.salary}
            onChange={(e) => set('salary', e.target.value)}
            placeholder="4000000"
          />
        </Field>
        <Field label="Ma’lumoti" className="sm:col-span-2">
          <Input value={form.education} onChange={(e) => set('education', e.target.value)} placeholder="Bakalavr — TDIU" />
        </Field>
      </div>
    </Modal>
  )
}
