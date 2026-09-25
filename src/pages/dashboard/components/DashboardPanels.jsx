import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarClock, Clock, Rocket, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { staggerContainer } from '@/lib/motion'
import { formatDate, formatDateTime, formatMoney, relativeTime } from '@/lib/format'
import { onboardingStage, taskPriority } from '@/config/dictionaries'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { SkeletonList } from '@/components/ui/Skeleton'

const PanelShell = ({ title, subtitle, icon, to, children, loading, empty, emptyText, linkLabel = 'Barchasi' }) => {
  const navigate = useNavigate()
  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={icon}
      padded={false}
      action={
        to && (
          <Button variant="ghost" size="xs" iconRight={ArrowUpRight} onClick={() => navigate(to)}>
            {linkLabel}
          </Button>
        )
      }
    >
      <div className="px-2 py-2">
        {loading ? (
          <div className="p-3">
            <SkeletonList rows={4} />
          </div>
        ) : empty ? (
          <EmptyState title={emptyText} compact />
        ) : (
          <motion.div variants={staggerContainer(0.05)} initial="initial" animate="animate" className="space-y-0.5">
            {children}
          </motion.div>
        )}
      </div>
    </Card>
  )
}

const Row = ({ children, onClick, className }) => (
  <motion.div
    variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }}
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors',
      onClick && 'cursor-pointer hover:bg-white/[0.035]',
      className,
    )}
  >
    {children}
  </motion.div>
)

export const UpcomingInterviewsPanel = ({ rows = [], loading }) => {
  const navigate = useNavigate()
  return (
    <PanelShell
      title="Yaqin suhbatlar"
      subtitle="Rejalashtirilgan HR va texnik suhbatlar"
      icon={CalendarClock}
      to="/interviews"
      loading={loading}
      empty={!rows.length}
      emptyText="Rejalashtirilgan suhbat yo‘q"
    >
      {rows.map((row) => (
        <Row key={row.id} onClick={() => navigate('/interviews')}>
          <Avatar name={row.candidateName} tone={row.avatarTone} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-ink">{row.candidateName}</p>
            <p className="truncate text-[11px] text-subtle">
              {row.vacancyTitle} · {row.interviewerName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11.5px] font-medium text-ink-2 tabular">{formatDateTime(row.scheduledAt)}</p>
            <StatusBadge kind="interviewType" value={row.type} size="xs" dot={false} className="mt-1" />
          </div>
        </Row>
      ))}
    </PanelShell>
  )
}

export const ReadyToStartPanel = ({ rows = [], loading, onStart, startingId }) => {
  const navigate = useNavigate()
  return (
    <PanelShell
      title="START kutayotganlar"
      subtitle="Onboarding checklisti yakunlangan nomzodlar"
      icon={Rocket}
      to="/onboarding"
      loading={loading}
      empty={!rows.length}
      emptyText="Hozircha START kutayotgan nomzod yo‘q"
    >
      {rows.map((row) => (
        <Row key={row.id}>
          <Avatar name={row.fullName} tone={row.avatarTone} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-ink">{row.fullName}</p>
            <p className="truncate text-[11px] text-subtle">
              {row.position} · {row.branch}
            </p>
          </div>
          <Button
            size="xs"
            variant="primary"
            loading={startingId === row.id}
            onClick={(event) => {
              event.stopPropagation()
              onStart?.(row)
            }}
          >
            START
          </Button>
          <Button size="xs" variant="ghost" onClick={() => navigate('/onboarding')}>
            Ko‘rish
          </Button>
        </Row>
      ))}
    </PanelShell>
  )
}

export const UrgentTasksPanel = ({ rows = [], loading }) => {
  const navigate = useNavigate()
  return (
    <PanelShell
      title="Muhim HR vazifalar"
      subtitle="Muddati yaqin yoki o‘tgan topshiriqlar"
      icon={Clock}
      to="/hr-tasks"
      loading={loading}
      empty={!rows.length}
      emptyText="Ochiq vazifa yo‘q"
    >
      {rows.map((row) => (
        <Row key={row.id} onClick={() => navigate('/hr-tasks')}>
          <span
            className={cn(
              'mt-0.5 size-2 shrink-0 rounded-full',
              row.overdue ? 'bg-danger' : row.priority === 'urgent' ? 'bg-warning' : 'bg-brand',
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-ink">{row.title}</p>
            <p className="truncate text-[11px] text-subtle">
              {row.assigneeName} · {formatDate(row.dueDate)}
            </p>
          </div>
          <StatusBadge
            kind="taskPriority"
            value={row.priority}
            size="xs"
            label={row.overdue ? 'Muddati o‘tgan' : taskPriority.label(row.priority)}
            tone={row.overdue ? 'danger' : undefined}
          />
        </Row>
      ))}
    </PanelShell>
  )
}

export const RecentHiresPanel = ({ rows = [], loading }) => {
  const navigate = useNavigate()
  return (
    <PanelShell
      title="Yangi xodimlar"
      subtitle="Oxirgi ishga qabul qilinganlar"
      icon={UserRound}
      to="/employees"
      loading={loading}
      empty={!rows.length}
      emptyText="Yangi xodim yo‘q"
    >
      {rows.map((row) => (
        <Row key={row.id} onClick={() => navigate(`/employees/${row.id}`)}>
          <Avatar name={row.fullName} tone={row.avatarTone} size="sm" status={row.status} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-ink">{row.fullName}</p>
            <p className="truncate text-[11px] text-subtle">
              {row.position} · {row.department}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11.5px] font-medium text-ink-2 tabular">{formatMoney(row.salary, { compact: true })}</p>
            <p className="text-[10.5px] text-faint">{relativeTime(row.hiredAt)}</p>
          </div>
        </Row>
      ))}
    </PanelShell>
  )
}

export const OnboardingStagesPanel = ({ rows = [], total = 0, loading }) => {
  const navigate = useNavigate()
  return (
    <Card
      title="Onboarding bosqichlari"
      subtitle={`${total} ta yozuv · jarayon holati`}
      icon={Rocket}
      action={
        <Button variant="ghost" size="xs" iconRight={ArrowUpRight} onClick={() => navigate('/onboarding')}>
          Onboarding
        </Button>
      }
    >
      {loading ? (
        <SkeletonList rows={5} />
      ) : (
        <div className="space-y-3.5">
          {rows.map((row, index) => (
            <div key={row.stage}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[12px] text-ink-2">
                  <StatusBadge kind="onboardingStage" value={row.stage} size="xs" />
                </span>
                <span className="text-[12px] font-semibold text-ink tabular">{row.value}</span>
              </div>
              <ProgressBar
                value={total ? (row.value / total) * 100 : 0}
                tone={onboardingStage.tone(row.stage)}
                size="sm"
                delay={index * 0.05}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
