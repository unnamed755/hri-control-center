import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BriefcaseBusiness,
  CalendarClock,
  Mail,
  Percent,
  Phone,
  Star,
  Target,
  TrendingUp,
  UserRoundCog,
  Users,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { staggerContainer } from '@/lib/motion'
import { recruiterWebService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { formatDate, formatDateTime, formatNumber, formatPhone } from '@/lib/format'
import { RECRUITMENT_PIPELINE } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChartCard } from '@/components/ui/ChartCard'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { Avatar, PersonCell } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DataTable } from '@/components/ui/DataTable'
import { SegmentedControl } from '@/components/ui/Tabs'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { FunnelStages } from '@/components/charts/ChartKit'
import { CandidateDrawer } from './components/CandidateDrawer'

const RecruiterPage = () => {
  const navigate = useNavigate()
  const [recruiterId, setRecruiterId] = useState('rec-001')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const { data: recruiters } = useQuery([QK.recruiters], () => recruiterWebService.getRecruiters(), {
    deps: ['recruiters-list'],
  })
  const { data: recruiter, loading, error, refetch } = useQuery(
    [QK.recruiters, QK.candidates, QK.vacancies, QK.interviews],
    () => recruiterWebService.getRecruiterById(recruiterId),
    { deps: ['recruiter', recruiterId] },
  )

  const pipeline = RECRUITMENT_PIPELINE.map((stage) => ({ ...stage, value: recruiter?.funnel?.[stage.key] ?? 0 }))

  const candidateColumns = [
    {
      key: 'fullName',
      label: 'Nomzod',
      render: (row) => <PersonCell name={row.fullName} subtitle={formatPhone(row.phone)} tone={row.avatarTone} size="sm" />,
    },
    { key: 'profession', label: 'Kasb' },
    { key: 'vacancyTitle', label: 'Vakansiya', hideBelow: 'lg' },
    { key: 'status', label: 'Holat', render: (row) => <StatusBadge kind="candidateStatus" value={row.status} /> },
    {
      key: 'createdAt',
      label: 'Sana',
      align: 'right',
      render: (row) => <span className="tabular text-subtle">{formatDate(row.createdAt)}</span>,
    },
  ]

  if (error) {
    return (
      <>
        <PageHeader title="Rekruter" icon={UserRoundCog} />
        <ErrorState error={error} onRetry={refetch} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={recruiter ? recruiter.displayName : 'Rekruter'}
        subtitle="Rekruterning shaxsiy ish maydoni: biriktirilgan vakansiyalar, nomzodlar oqimi, suhbatlar jadvali va oylik reja."
        icon={UserRoundCog}
        actions={
          <SegmentedControl
            id="recruiter-switch"
            size="sm"
            items={(recruiters ?? []).map((r) => ({ value: r.id, label: r.fullName.split(' ')[1] ?? r.fullName }))}
            value={recruiterId}
            onChange={setRecruiterId}
          />
        }
      />

      {loading && !recruiter ? (
        <SkeletonStatCards count={4} />
      ) : (
        recruiter && (
          <motion.div variants={staggerContainer(0.06)} initial="initial" animate="animate" className="space-y-3.5">
            <Card padded>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar name={recruiter.fullName} tone={recruiter.avatarTone} size="2xl" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[18px] font-semibold text-ink">{recruiter.fullName}</h2>
                      <StatusBadge label={recruiter.role} tone="brand" size="sm" dot={false} />
                      <span className="flex items-center gap-1 text-[12px] text-warning">
                        <Star className="size-3.5 fill-current" strokeWidth={0} />
                        {recruiter.rating}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-subtle" strokeWidth={2} />
                        {formatPhone(recruiter.phone)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-subtle" strokeWidth={2} />
                        {recruiter.email}
                      </span>
                    </p>
                    <p className="mt-1 text-[11.5px] text-subtle">
                      Yo‘nalish: {recruiter.specialisation.join(' · ')} · Tizimda {formatDate(recruiter.joinedAt)} dan
                    </p>
                  </div>
                </div>
                <div className="w-full max-w-xs shrink-0">
                  <ProgressBar
                    value={recruiter.planProgress}
                    label={`Oylik reja: ${recruiter.monthlyDone} / ${recruiter.monthlyPlan}`}
                    showValue
                  />
                  <p className="mt-2 text-[11.5px] text-subtle">
                    O‘rtacha yopish muddati: <span className="font-semibold text-ink-2">{recruiter.avgTimeToHireDays} kun</span>
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <StatCard label="Nomzodlar" value={recruiter.candidatesTotal} icon={Users} tone="brand" hint={`${recruiter.candidatesActive} faol`} compact />
              <StatCard label="Ishga olingan" value={recruiter.hired} icon={Target} tone="success" hint={`Jami ${recruiter.hiresTotal} ta (tarix)`} compact />
              <StatCard label="Konversiya" value={recruiter.conversion} suffix="%" icon={Percent} tone="teal" hint={`${recruiter.rejected} ta rad etilgan`} compact />
              <StatCard label="Aktiv vakansiyalar" value={recruiter.vacanciesActive} icon={BriefcaseBusiness} tone="warning" hint={`${recruiter.openings} ta o‘rin`} compact />
            </div>

            <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
              <ChartCard
                title="Nomzodlar oqimi"
                subtitle="Rekruter bo‘yicha pipeline"
                icon={TrendingUp}
                height={250}
                bodyClassName="px-5"
              >
                <FunnelStages data={pipeline} onSelect={(stage) => navigate(`/candidates?status=${stage.key}&recruiter=${recruiterId}`)} />
              </ChartCard>

              <Card
                title="Biriktirilgan vakansiyalar"
                subtitle={`${recruiter.vacancies.length} ta`}
                icon={BriefcaseBusiness}
                padded={false}
                action={
                  <Button variant="ghost" size="xs" onClick={() => navigate('/vacancies')}>
                    Barchasi
                  </Button>
                }
              >
                <div className="max-h-[260px] space-y-1.5 overflow-y-auto scroll-area p-3">
                  {recruiter.vacancies.length === 0 ? (
                    <EmptyState title="Vakansiya biriktirilmagan" compact />
                  ) : (
                    recruiter.vacancies.map((vacancy) => (
                      <button
                        key={vacancy.id}
                        type="button"
                        onClick={() => navigate(`/vacancies?focus=${vacancy.id}`)}
                        className="flex w-full items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/50 px-3 py-2 text-left transition-colors hover:border-brand/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] text-ink-2">{vacancy.title}</p>
                          <p className="truncate text-[11px] text-subtle">
                            {vacancy.branch} · {vacancy.openings} o‘rin
                          </p>
                        </div>
                        <StatusBadge kind="vacancyStatus" value={vacancy.status} size="xs" />
                      </button>
                    ))
                  )}
                </div>
              </Card>

              <Card
                title="Suhbatlar jadvali"
                subtitle={`${recruiter.interviews.length} ta yozuv`}
                icon={CalendarClock}
                padded={false}
                action={
                  <Button variant="ghost" size="xs" onClick={() => navigate('/interviews')}>
                    Barchasi
                  </Button>
                }
              >
                <div className="max-h-[260px] space-y-1.5 overflow-y-auto scroll-area p-3">
                  {recruiter.interviews.length === 0 ? (
                    <EmptyState title="Suhbat yo‘q" compact />
                  ) : (
                    recruiter.interviews.slice(0, 8).map((interview) => (
                      <div
                        key={interview.id}
                        className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface-2/50 px-3 py-2"
                      >
                        <Avatar name={interview.candidateName} tone={interview.avatarTone} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] text-ink-2">{interview.candidateName}</p>
                          <p className="truncate text-[11px] text-subtle">{formatDateTime(interview.scheduledAt)}</p>
                        </div>
                        <StatusBadge kind="interviewStatus" value={interview.status} size="xs" />
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Card
              title="Rekruter nomzodlari"
              subtitle={`${formatNumber(recruiter.candidates.length)} ta yozuv`}
              icon={Users}
              padded={false}
              action={
                <Button variant="ghost" size="xs" onClick={() => navigate(`/candidates?recruiter=${recruiterId}`)}>
                  Nomzodlar sahifasi
                </Button>
              }
            >
              <DataTable
                columns={candidateColumns}
                rows={recruiter.candidates.slice(0, 12)}
                onRowClick={(row) => setSelectedCandidate(row.id)}
                dense
                emptyState={<EmptyState title="Nomzod yo‘q" compact />}
              />
            </Card>
          </motion.div>
        )
      )}

      {loading && !recruiter && (
        <Card className="mt-3.5">
          <SkeletonList rows={6} />
        </Card>
      )}

      <CandidateDrawer
        candidateId={selectedCandidate}
        open={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
      />
    </>
  )
}

export default RecruiterPage
