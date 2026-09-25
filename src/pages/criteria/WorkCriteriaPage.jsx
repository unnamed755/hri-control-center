import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Gauge,
  Pencil,
  Plus,
  Scale,
  SlidersHorizontal,
  Target,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { workCriteriaService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useMutation } from '@/hooks/useMutation'
import { askConfirm, toast } from '@/store/uiStore'
import { formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'

const METRICS = [
  { value: 'attendance', label: 'Davomat' },
  { value: 'late', label: 'Kechikish' },
  { value: 'tasks', label: 'Vazifalar' },
  { value: 'sales', label: 'Savdo rejasi' },
  { value: 'quality', label: 'Sifat' },
  { value: 'discrepancy', label: 'Kassa farqi' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'training', label: 'Trening' },
  { value: 'experience', label: 'Tajriba' },
  { value: 'coins', label: 'Coins' },
  { value: 'safety', label: 'Xavfsizlik' },
]

const GROUPS = ['Intizom', 'Samaradorlik', 'Sifat', 'Moslashuv', 'Lavozim talabi', 'Motivatsiya']

const EMPTY_CRITERION = {
  name: '',
  group: 'Samaradorlik',
  metric: 'tasks',
  weight: 10,
  target: 90,
  unit: '%',
  direction: 'higher',
  appliesTo: 'all',
  description: '',
  enabled: true,
}

const CriterionModal = ({ open, onClose, criterion }) => {
  const isEdit = Boolean(criterion)
  const [form, setForm] = useState(EMPTY_CRITERION)

  useEffect(() => {
    if (!open) return
    setForm(criterion ? { ...EMPTY_CRITERION, ...criterion } : EMPTY_CRITERION)
  }, [open, criterion])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate, pending } = useMutation(
    () =>
      isEdit
        ? workCriteriaService.updateCriterion(criterion.id, {
            name: form.name,
            group: form.group,
            metric: form.metric,
            weight: Number(form.weight),
            target: Number(form.target),
            unit: form.unit,
            direction: form.direction,
            appliesTo: form.appliesTo,
            description: form.description,
            enabled: form.enabled,
          })
        : workCriteriaService.createCriterion({ ...form, weight: Number(form.weight), target: Number(form.target) }),
    { successMessage: isEdit ? 'Mezon yangilandi' : 'Yangi mezon qo‘shildi', onSuccess: onClose },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={SlidersHorizontal}
      title={isEdit ? 'Mezonni tahrirlash' : 'Yangi ish mezoni'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button variant="primary" loading={pending} onClick={() => mutate()} disabled={!form.name.trim()}>
            {isEdit ? 'Saqlash' : 'Qo‘shish'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Mezon nomi" required className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Masalan: Xizmat sifati" />
        </Field>
        <Field label="Guruh">
          <Select value={form.group} onChange={(v) => set('group', v)} options={GROUPS.map((g) => ({ value: g, label: g }))} />
        </Field>
        <Field label="Ko‘rsatkich manbasi">
          <Select value={form.metric} onChange={(v) => set('metric', v)} options={METRICS} />
        </Field>
        <Field label="Vazn (%)">
          <Input type="number" min="0" max="100" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
        </Field>
        <Field label="Maqsad (target)">
          <Input type="number" value={form.target} onChange={(e) => set('target', e.target.value)} />
        </Field>
        <Field label="O‘lchov birligi">
          <Input value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="%" />
        </Field>
        <Field label="Yo‘nalish">
          <Select
            value={form.direction}
            onChange={(v) => set('direction', v)}
            options={[
              { value: 'higher', label: 'Yuqori — yaxshi' },
              { value: 'lower', label: 'Past — yaxshi' },
            ]}
          />
        </Field>
        <Field label="Qo‘llaniladi" className="sm:col-span-2">
          <Input value={form.appliesTo} onChange={(e) => set('appliesTo', e.target.value)} placeholder="all / Savdo / Yangi xodimlar" />
        </Field>
        <Field label="Tavsif" className="sm:col-span-2">
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
        </Field>
        <div className="sm:col-span-2">
          <Switch checked={form.enabled} onChange={(v) => set('enabled', v)} label="Mezon faol" />
        </div>
      </div>
    </Modal>
  )
}

const WorkCriteriaPage = () => {
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: groups, loading } = useQuery(
    [QK.workCriteria, QK.employees, QK.attendance, QK.kpi],
    () => workCriteriaService.getWorkCriteriaGrouped(),
    { deps: ['criteria-grouped'] },
  )
  const { data: summary } = useQuery([QK.workCriteria], () => workCriteriaService.getWorkCriteriaSummary(), {
    deps: ['criteria-summary'],
  })

  const handleDelete = async (criterion) => {
    const ok = await askConfirm({
      title: 'Mezonni o‘chirish',
      description: `"${criterion.name}" mezoni o‘chiriladi va KPI hisobidan chiqariladi.`,
      confirmLabel: 'O‘chirish',
    })
    if (!ok) return
    await workCriteriaService.deleteCriterion(criterion.id)
    toast({ tone: 'success', title: 'Mezon o‘chirildi' })
  }

  return (
    <>
      <PageHeader
        title="Ish mezoni"
        subtitle="KPI va samaradorlik hisobiga ta’sir qiluvchi mezonlar. Har bir mezonning joriy qiymati tegishli moduldan (davomat, vazifalar, kassa, onboarding) real vaqtda hisoblanadi."
        icon={SlidersHorizontal}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            Mezon qo‘shish
          </Button>
        }
      />

      {!summary ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard label="Faol mezonlar" value={summary.enabled} icon={CheckCircle2} tone="brand" hint={`Jami ${summary.total} ta`} compact />
          <StatCard label="Umumiy vazn" value={summary.totalWeight} suffix="%" icon={Scale} tone="violet" hint={`${summary.groups} ta guruh`} compact />
          <StatCard label="Bajarilmoqda" value={summary.achieved} icon={Target} tone="success" hint={`${summary.atRisk} ta xavf ostida`} compact />
          <StatCard label="Umumiy ball" value={summary.overallScore} suffix="%" icon={Gauge} tone="teal" hint="Barcha mezonlar bo‘yicha" compact />
        </motion.div>
      )}

      <motion.div
        variants={staggerContainer(0.06)}
        initial="initial"
        animate="animate"
        className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-2"
      >
        {loading && !groups ? (
          <Card className="xl:col-span-2">
            <SkeletonList rows={8} />
          </Card>
        ) : (
          (groups ?? []).map((group) => (
            <motion.div key={group.group} variants={fadeUp(12)}>
              <Card
                title={group.group}
                subtitle={`${group.total} ta faol mezon · umumiy vazn ${group.weight}%`}
                icon={Scale}
                action={<StatusBadge label={`${group.score}% ball`} tone={group.score >= 90 ? 'success' : group.score >= 70 ? 'brand' : 'warning'} size="sm" />}
                padded={false}
              >
                <div className="divide-y divide-line-soft">
                  {group.criteria.map((criterion) => (
                    <div key={criterion.id} className={cn('p-4', !criterion.enabled && 'opacity-55')}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[12.5px] font-medium text-ink">{criterion.name}</p>
                            {criterion.achieved ? (
                              <StatusBadge label="Bajarilmoqda" tone="success" size="xs" />
                            ) : (
                              <StatusBadge label="Ortda" tone="warning" size="xs" />
                            )}
                            {!criterion.enabled && <StatusBadge label="O‘chirilgan" tone="neutral" size="xs" dot={false} />}
                          </div>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{criterion.description}</p>
                          <p className="mt-1 text-[11px] text-subtle">
                            Manba: {criterion.source} · Qo‘llaniladi: {criterion.appliesTo}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Switch
                            checked={criterion.enabled}
                            onChange={async () => {
                              await workCriteriaService.toggleCriterion(criterion.id)
                            }}
                          />
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            icon={Pencil}
                            onClick={() => {
                              setEditing(criterion)
                              setModalOpen(true)
                            }}
                          />
                          <Button size="icon-sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(criterion)} />
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Maqsad</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-ink tabular">
                            {formatNumber(criterion.target)} {criterion.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Joriy</p>
                          <p
                            className={cn(
                              'mt-0.5 text-[13px] font-semibold tabular',
                              criterion.achieved ? 'text-success' : 'text-warning',
                            )}
                          >
                            {formatNumber(criterion.actual)} {criterion.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10.5px] uppercase tracking-[0.08em] text-subtle">Vazn</p>
                          <p className="mt-0.5 text-[13px] font-semibold text-ink tabular">{criterion.weight}%</p>
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <ProgressBar
                          value={Math.min(100, criterion.ratio)}
                          size="sm"
                          tone={criterion.achieved ? 'success' : criterion.ratio > 70 ? 'warning' : 'danger'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {summary && summary.atRisk > 0 && (
        <Card className="mt-3.5" title="Diqqat talab qiladigan mezonlar" icon={TriangleAlert}>
          <p className="text-[12.5px] leading-relaxed text-muted">
            {summary.atRisk} ta mezon maqsadli qiymatdan ortda qolmoqda. Ular KPI hisobida{' '}
            {formatPercent((summary.atRisk / Math.max(1, summary.enabled)) * 100)} ulushni egallaydi va bo‘limlar samaradorligiga
            bevosita ta’sir qiladi.
          </p>
        </Card>
      )}

      <CriterionModal open={modalOpen} criterion={editing} onClose={() => setModalOpen(false)} />
    </>
  )
}

export default WorkCriteriaPage
