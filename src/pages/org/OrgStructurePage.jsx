import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building2,
  ChevronRight,
  Crown,
  ExternalLink,
  Layers,
  Network,
  Users,
  UsersRound,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { EASE, fadeUp, staggerContainer } from '@/lib/motion'
import { orgService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { cn } from '@/lib/utils'
import { formatMoney, formatNumber, formatPhone } from '@/lib/format'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/States'
import { RankBars } from '@/components/charts/ChartKit'

const NODE_ICON = { person: Crown, module: Layers, department: Building2, unit: UsersRound }

const OrgNode = ({ node, depth = 0, defaultOpen }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(defaultOpen ?? depth < 2)
  const hasChildren = (node.children ?? []).length > 0
  const Icon = NODE_ICON[node.type] ?? UsersRound

  return (
    <div className={cn('relative', depth > 0 && 'pl-5 sm:pl-7')}>
      {depth > 0 && <span className="absolute left-0 top-0 h-full w-px bg-line" />}
      {depth > 0 && <span className="absolute left-0 top-6 h-px w-5 bg-line sm:w-7" />}

      <motion.div
        variants={fadeUp(8)}
        className={cn(
          'relative mb-2 rounded-[12px] border bg-surface-2/60 p-3 transition-colors',
          node.type === 'person' && depth === 0 && 'border-brand/40 bg-brand/[0.07]',
          node.type === 'module' && 'border-teal/25 bg-teal/[0.05]',
          node.type === 'department' && 'border-line',
          'hover:border-brand/40',
        )}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => hasChildren && setOpen((v) => !v)}
            className={cn(
              'mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border transition-colors',
              hasChildren ? 'border-line-strong bg-surface-3 text-muted hover:text-ink' : 'border-transparent text-transparent',
            )}
          >
            {hasChildren && (
              <ChevronRight className={cn('size-3.5 transition-transform duration-200', open && 'rotate-90')} strokeWidth={2.4} />
            )}
          </button>

          {node.type === 'person' ? (
            <Avatar name={node.name} tone={node.avatarTone} size="md" />
          ) : (
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-3 text-brand-2">
              <Icon className="size-4" strokeWidth={2} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[13px] font-semibold text-ink">{node.name}</p>
              {node.type === 'person' && node.kpi ? <StatusBadge label={`KPI ${node.kpi}%`} tone="brand" size="xs" dot={false} /> : null}
              {node.type === 'module' && <StatusBadge label="HR moduli" tone="teal" size="xs" dot={false} />}
            </div>
            <p className="truncate text-[11.5px] text-muted">
              {node.title ?? node.note ?? node.ownerRole ?? ''}
            </p>
            {node.subtitle && <p className="truncate text-[11px] text-subtle">{node.subtitle}</p>}
            {node.type === 'module' && (
              <p className="mt-0.5 truncate text-[11px] text-subtle">Mas’ul: {node.ownerName}</p>
            )}
            {node.type === 'department' && (
              <p className="mt-0.5 truncate text-[11px] text-subtle">
                Rahbar: {node.leadName} · O‘rtacha KPI {node.avgKpi}%
              </p>
            )}
            {node.type === 'person' && node.phone && (
              <p className="mt-0.5 truncate text-[11px] text-subtle">{formatPhone(node.phone)}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {(node.headcount ?? 0) > 0 && (
              <span className="rounded-full border border-line bg-surface-3 px-2 py-0.5 text-[11px] text-muted tabular">
                {node.headcount} xodim
              </span>
            )}
            {node.route && (
              <Button size="icon-sm" variant="ghost" icon={ExternalLink} title="Modulga o‘tish" onClick={() => navigate(node.route)} />
            )}
            {node.employeeId && (
              <Button
                size="icon-sm"
                variant="ghost"
                icon={ExternalLink}
                title="Profilni ochish"
                onClick={() => navigate(`/employees/${node.employeeId}`)}
              />
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <motion.div variants={staggerContainer(0.04)} initial="initial" animate="animate">
              {node.children.map((child) => (
                <OrgNode key={child.id} node={child} depth={depth + 1} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const OrgStructurePage = () => {
  const { data: tree, loading, error, refetch } = useQuery([QK.org, QK.employees], () => orgService.getOrgStructure(), {
    deps: ['org-tree'],
  })
  const { data: summary } = useQuery([QK.org, QK.employees], () => orgService.getOrgSummary(), { deps: ['org-summary'] })

  return (
    <>
      <PageHeader
        title="Tashkiliy struktura"
        subtitle="CEO → HR Owner → HR bo‘lim boshlig‘i → HR modullari. Har bir tugun jonli xodimlar bazasidan hisoblangan shtat soni va KPI ko‘rsatkichini ko‘rsatadi."
        icon={Network}
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
          <StatCard label="Jami shtat" value={summary.headcount} icon={Users} tone="brand" hint={`${summary.departments} ta bo‘lim`} compact />
          <StatCard label="Filiallar" value={summary.branches} icon={Building2} tone="teal" hint="Faoliyat nuqtalari" compact />
          <StatCard label="Rahbarlar" value={summary.managers} icon={Crown} tone="violet" hint={`O‘rtacha ${summary.avgSpan} bo‘ysunuvchi`} compact />
          <StatCard label="Bo‘limlar" value={summary.departments} icon={Layers} tone="warning" hint="Tashkiliy birliklar" compact />
        </motion.div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Ierarxiya" subtitle="Tugunlarni ochib-yopish mumkin" icon={Network}>
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : loading && !tree ? (
            <SkeletonList rows={7} />
          ) : (
            <motion.div variants={staggerContainer(0.05)} initial="initial" animate="animate">
              <OrgNode node={tree} defaultOpen />
            </motion.div>
          )}
        </Card>

        <div className="space-y-3.5">
          <Card title="Bo‘limlar shtati" subtitle="Xodimlar soni" icon={Users}>
            {!summary ? (
              <SkeletonList rows={5} />
            ) : (
              <RankBars
                data={summary.byDepartment.map((row) => ({
                  name: row.department,
                  value: row.headcount,
                  color: row.color,
                  hint: `Rahbar: ${row.lead} · KPI ${row.avgKpi}%`,
                }))}
              />
            )}
          </Card>

          <Card title="Oylik fondi taqsimoti" subtitle="Bo‘limlar bo‘yicha" icon={Layers}>
            {!summary ? (
              <SkeletonList rows={5} />
            ) : (
              <div className="space-y-3">
                {summary.byDepartment.slice(0, 6).map((row, index) => {
                  const total = summary.byDepartment.reduce((a, b) => a + b.payroll, 0) || 1
                  return (
                    <div key={row.department}>
                      <div className="mb-1 flex items-center justify-between text-[11.5px]">
                        <span className="text-muted">{row.department}</span>
                        <span className="font-semibold text-ink-2 tabular">
                          {formatMoney(row.payroll, { compact: true, currency: '' })}
                        </span>
                      </div>
                      <ProgressBar value={(row.payroll / total) * 100} size="xs" delay={index * 0.05} tone="brand" />
                    </div>
                  )
                })}
                <p className="pt-1 text-[11px] text-subtle">
                  Jami: {formatNumber(summary.headcount)} xodim ·{' '}
                  {formatMoney(
                    summary.byDepartment.reduce((a, b) => a + b.payroll, 0),
                    { compact: true },
                  )}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

export default OrgStructurePage
