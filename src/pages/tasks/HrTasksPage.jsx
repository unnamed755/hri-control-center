import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Columns3,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Rows3,
  Trash2,
  UserRound,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { tasksService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { askConfirm, toast } from '@/store/uiStore'
import { formatDate, formatNumber, relativeTime } from '@/lib/format'
import { taskPriority, taskStatus } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Select } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/Tabs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { TaskFormModal } from './components/TaskFormModal'

const VIEWS = [
  { value: 'board', label: 'Doska', icon: Columns3 },
  { value: 'table', label: 'Jadval', icon: Rows3 },
]

const MODULE_LABEL = {
  recruitment: 'Recruitment',
  onboarding: 'Onboarding',
  employees: 'Xodimlar',
  payroll: 'Payroll',
  analytics: 'Analitika',
}

const BOARD_COLUMNS = [
  { key: 'pending', label: 'Kutilmoqda', tone: 'info' },
  { key: 'in_progress', label: 'Jarayonda', tone: 'warning' },
  { key: 'completed', label: 'Bajarildi', tone: 'success' },
]

const TaskCard = ({ task, onEdit, onStatus, onDelete }) => (
  <motion.div
    variants={fadeUp(10)}
    whileHover={{ y: -2 }}
    className={`rounded-[12px] border bg-surface-2/70 p-3.5 transition-colors ${
      task.overdue ? 'border-danger/35' : 'border-line hover:border-brand/35'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-ink">{task.title}</p>
      <Dropdown
        items={[
          { label: 'Tahrirlash', icon: Pencil, onClick: () => onEdit(task) },
          ...(task.status !== 'in_progress'
            ? [{ label: 'Jarayonga olish', icon: Play, onClick: () => onStatus(task, 'in_progress') }]
            : []),
          ...(task.status !== 'completed'
            ? [{ label: 'Bajarildi', icon: CheckCircle2, onClick: () => onStatus(task, 'completed') }]
            : [{ label: 'Qayta ochish', icon: Clock, onClick: () => onStatus(task, 'pending') }]),
          { divider: true },
          { label: 'O‘chirish', icon: Trash2, tone: 'danger', onClick: () => onDelete(task) },
        ]}
      />
    </div>
    {task.description && <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{task.description}</p>}

    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <StatusBadge kind="taskPriority" value={task.priority} size="xs" />
      <StatusBadge label={MODULE_LABEL[task.module] ?? task.module} tone="neutral" size="xs" dot={false} />
      {task.overdue && <StatusBadge label="Muddati o‘tgan" tone="danger" size="xs" />}
    </div>

    {task.status === 'in_progress' && (
      <div className="mt-2.5">
        <ProgressBar value={task.progress} size="xs" />
      </div>
    )}

    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar name={task.assigneeName} tone="var(--color-brand)" size="xs" />
        <span className="truncate text-[11px] text-muted">{task.assigneeName}</span>
      </span>
      <span className={`shrink-0 text-[11px] tabular ${task.overdue ? 'text-danger' : 'text-subtle'}`}>
        {formatDate(task.dueDate)}
      </span>
    </div>
  </motion.div>
)

const HrTasksPage = () => {
  const table = useTableState({ sortBy: 'dueDate', perPage: 100 })
  const [view, setView] = useState('board')
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.tasks],
    () => tasksService.getTasks(table.params),
    { deps: ['tasks', table.params] },
  )
  const { data: stats } = useQuery([QK.tasks], () => tasksService.getTaskStats(), { deps: ['task-stats'] })
  const { data: facets } = useQuery([QK.tasks], () => tasksService.getTaskFacets(), { deps: ['task-facets'] })

  const handleStatus = async (task, status) => {
    await tasksService.setTaskStatus(task.id, status)
    toast({ tone: 'success', title: `Holat: ${taskStatus.label(status)}`, description: task.title })
  }

  const handleDelete = async (task) => {
    const ok = await askConfirm({
      title: 'Vazifani o‘chirish',
      description: `"${task.title}" vazifasi o‘chiriladi.`,
      confirmLabel: 'O‘chirish',
    })
    if (!ok) return
    await tasksService.deleteTask(task.id)
    toast({ tone: 'success', title: 'Vazifa o‘chirildi' })
  }

  const rows = data?.rows ?? []

  const columns = [
    {
      key: 'title',
      label: 'Vazifa',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-ink">{row.title}</p>
          <p className="truncate text-[11px] text-subtle">
            {row.code} · {MODULE_LABEL[row.module] ?? row.module}
          </p>
        </div>
      ),
    },
    {
      key: 'assigneeName',
      label: 'Mas’ul',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.assigneeName} tone="var(--color-brand)" size="xs" />
          <div className="min-w-0">
            <p className="truncate text-[12px] text-ink-2">{row.assigneeName}</p>
            <p className="truncate text-[10.5px] text-subtle">{row.assigneeRole}</p>
          </div>
        </div>
      ),
    },
    { key: 'priority', label: 'Muhimlik', render: (row) => <StatusBadge kind="taskPriority" value={row.priority} /> },
    {
      key: 'status',
      label: 'Holat',
      render: (row) => <StatusBadge kind="taskStatus" value={row.effectiveStatus} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      align: 'right',
      hideBelow: 'lg',
      width: 120,
      render: (row) => (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[12px] text-ink-2 tabular">{row.progress}%</span>
          <ProgressBar value={row.progress} size="xs" className="w-16" />
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Muddat',
      align: 'right',
      render: (row) => (
        <span className={`tabular ${row.overdue ? 'text-danger' : 'text-muted'}`}>{formatDate(row.dueDate)}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Yaratilgan',
      align: 'right',
      hideBelow: 'xl',
      render: (row) => <span className="text-subtle">{relativeTime(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      width: 56,
      sortable: false,
      render: (row) => (
        <Dropdown
          items={[
            { label: 'Tahrirlash', icon: Pencil, onClick: () => { setEditing(row); setFormOpen(true) } },
            ...(row.status !== 'in_progress'
              ? [{ label: 'Jarayonga olish', icon: Play, onClick: () => handleStatus(row, 'in_progress') }]
              : []),
            ...(row.status !== 'completed'
              ? [{ label: 'Bajarildi', icon: CheckCircle2, onClick: () => handleStatus(row, 'completed') }]
              : [{ label: 'Qayta ochish', icon: Clock, onClick: () => handleStatus(row, 'pending') }]),
            { divider: true },
            { label: 'O‘chirish', icon: Trash2, tone: 'danger', onClick: () => handleDelete(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="HR vazifalar"
        subtitle="HR bo‘lim boshlig‘i topshiriqlari: rekruting, onboarding, payroll va analitika yo‘nalishlari bo‘yicha nazorat."
        icon={ListChecks}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Vazifa yaratish
          </Button>
        }
      />

      {!stats ? (
        <SkeletonStatCards count={4} />
      ) : (
        <motion.div
          variants={staggerContainer(0.06)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
        >
          <StatCard label="Kutilmoqda" value={stats.pending} icon={Clock} tone="info" hint={`Jami ${stats.total} ta vazifa`} compact />
          <StatCard label="Jarayonda" value={stats.inProgress} icon={Play} tone="warning" hint={`${stats.urgent} ta shoshilinch`} compact />
          <StatCard label="Muddati o‘tgan" value={stats.overdue} icon={AlertTriangle} tone="danger" hint="Darhol e’tibor talab qiladi" compact />
          <StatCard label="Bajarilgan" value={stats.completed} icon={CheckCircle2} tone="success" hint={`${stats.completionRate}% bajarilish`} compact />
        </motion.div>
      )}

      <Card className="mt-4" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Vazifa nomi, tavsif, mas’ul..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta vazifa` : ''}
          actions={<SegmentedControl id="task-view" size="sm" items={VIEWS} value={view} onChange={setView} />}
        >
          <Select
            className="w-40"
            size="sm"
            value={table.filters.assigneeId}
            onChange={(v) => table.setFilter('assigneeId', v)}
            options={(facets?.assignees ?? []).filter((a) => a.value)}
            allLabel="Barcha mas’ullar"
            placeholder="Mas’ul"
          />
          <Select
            className="w-40"
            size="sm"
            value={table.filters.module}
            onChange={(v) => table.setFilter('module', v)}
            options={(facets?.modules ?? []).map((f) => ({ value: f.value, label: MODULE_LABEL[f.value] ?? f.label, count: f.count }))}
            allLabel="Barcha yo‘nalishlar"
            placeholder="Yo‘nalish"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.priority}
            onChange={(v) => table.setFilter('priority', v)}
            options={taskPriority.options()}
            allLabel="Barcha muhimlik"
            placeholder="Muhimlik"
          />
          <Select
            className="w-40"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={[{ value: 'open', label: 'Ochiq vazifalar' }, ...taskStatus.options()]}
            allLabel="Barcha holatlar"
            placeholder="Holat"
          />
        </FilterBar>

        {view === 'table' ? (
          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            refetching={refetching}
            error={error}
            onRetry={refetch}
            sort={table.sort}
            onSort={table.toggleSort}
            query={table.query}
            onResetFilters={table.reset}
          />
        ) : (
          <div className="p-4">
            {error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : loading && !data ? (
              <SkeletonList rows={6} />
            ) : (
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
                {BOARD_COLUMNS.map((column) => {
                  const columnRows = rows.filter((row) =>
                    column.key === 'completed' ? row.status === 'completed' : row.status === column.key,
                  )
                  return (
                    <div key={column.key} className="panel-flat flex min-h-[220px] flex-col overflow-hidden">
                      <div className="flex items-center justify-between gap-2 border-b border-line-soft bg-surface-2/50 px-3.5 py-2.5">
                        <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                          <StatusBadge label={column.label} tone={column.tone} size="xs" />
                        </span>
                        <span className="text-[11.5px] text-subtle tabular">{columnRows.length}</span>
                      </div>
                      <motion.div
                        variants={staggerContainer(0.04)}
                        initial="initial"
                        animate="animate"
                        className="scroll-area max-h-[560px] flex-1 space-y-2.5 overflow-y-auto p-3"
                      >
                        {columnRows.length === 0 ? (
                          <EmptyState title="Vazifa yo‘q" compact />
                        ) : (
                          columnRows.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onEdit={(t) => {
                                setEditing(t)
                                setFormOpen(true)
                              }}
                              onStatus={handleStatus}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {stats?.byAssignee?.length > 0 && (
        <Card className="mt-3.5" title="Mas’ullar bo‘yicha yuklama" subtitle="Ochiq va bajarilgan vazifalar" icon={UserRound}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.byAssignee.map((person) => (
              <div key={person.name} className="rounded-[12px] border border-line bg-surface-2/60 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={person.name} tone="var(--color-brand)" size="sm" />
                  <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{person.name}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11.5px]">
                  <span className="text-subtle">
                    Ochiq <span className="font-semibold text-ink-2 tabular">{person.open}</span>
                  </span>
                  <span className="text-subtle">
                    Bajarilgan <span className="font-semibold text-success tabular">{person.done}</span>
                  </span>
                  {person.overdue > 0 && (
                    <span className="text-subtle">
                      Kechikkan <span className="font-semibold text-danger tabular">{person.overdue}</span>
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <ProgressBar value={person.total ? (person.done / person.total) * 100 : 0} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <TaskFormModal open={formOpen} task={editing} onClose={() => setFormOpen(false)} />
    </>
  )
}

export default HrTasksPage
