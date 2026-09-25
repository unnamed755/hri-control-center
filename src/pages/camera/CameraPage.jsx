import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  CircleDot,
  Eye,
  EyeOff,
  HardDrive,
  MonitorPlay,
  Signal,
  Users,
  Video,
  VideoOff,
  Wrench,
} from 'lucide-react'
import { QK } from '@/lib/queryBus'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { cameraService } from '@/services'
import { useQuery } from '@/hooks/useQuery'
import { useTableState } from '@/hooks/useTableState'
import { toast } from '@/store/uiStore'
import { formatDateTime, formatNumber, formatPercent, relativeTime } from '@/lib/format'
import { cameraStatus } from '@/config/dictionaries'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { FilterBar } from '@/components/ui/FilterBar'
import { Select } from '@/components/ui/Input'
import { StatusBadge, LiveDot } from '@/components/ui/StatusBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { SkeletonStatCards, SkeletonList } from '@/components/ui/Skeleton'
import { NoResults, ErrorState } from '@/components/ui/States'

/** Deliberately NOT a fake live feed — a labelled placeholder frame. */
const CameraFrame = ({ camera }) => (
  <div className="relative aspect-video w-full overflow-hidden rounded-[10px] border border-line bg-canvas">
    <div
      className="absolute inset-0 opacity-[0.35]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 4px)',
      }}
    />
    <div className="absolute inset-0 grid place-items-center">
      {camera.status === 'online' ? (
        <div className="flex flex-col items-center gap-1.5">
          <MonitorPlay className="size-7 text-line-strong" strokeWidth={1.6} />
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-faint">DEMO — jonli efir yo‘q</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <VideoOff className="size-7 text-danger/60" strokeWidth={1.6} />
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-danger/70">Signal yo‘q</span>
        </div>
      )}
    </div>

    <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full border border-line bg-canvas/85 px-2 py-0.5 backdrop-blur">
      <LiveDot tone={camera.status === 'online' ? 'success' : camera.status === 'maintenance' ? 'warning' : 'danger'} pulse={camera.status === 'online'} />
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
        {camera.status === 'online' ? 'Onlayn' : cameraStatus.label(camera.status)}
      </span>
    </div>

    {camera.recording && (
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-danger/35 bg-danger/12 px-2 py-0.5">
        <CircleDot className="size-2.5 text-danger" strokeWidth={3} />
        <span className="text-[10px] font-semibold text-danger">REC</span>
      </div>
    )}

    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-faint">
      <span>{camera.resolution} · {camera.fps} fps</span>
      <span>{camera.status === 'online' ? relativeTime(camera.lastActivityAt) : formatDateTime(camera.lastActivityAt)}</span>
    </div>
  </div>
)

const CameraCard = ({ camera, onToggleMonitoring, onToggleRecording, onSetStatus }) => (
  <motion.div variants={fadeUp(12)} whileHover={{ y: -3 }} className="panel p-3.5 transition-colors hover:border-brand/35">
    <CameraFrame camera={camera} />

    <div className="mt-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-medium text-ink">{camera.zone}</p>
        <p className="truncate text-[11px] text-subtle">
          {camera.branch} · {camera.code}
        </p>
      </div>
      <Dropdown
        items={[
          {
            label: camera.monitoring === 'active' ? 'Kuzatuvni to‘xtatish' : 'Kuzatuvni yoqish',
            icon: camera.monitoring === 'active' ? EyeOff : Eye,
            onClick: () => onToggleMonitoring(camera),
          },
          {
            label: camera.recording ? 'Yozuvni to‘xtatish' : 'Yozuvni boshlash',
            icon: camera.recording ? VideoOff : Video,
            onClick: () => onToggleRecording(camera),
          },
          { divider: true },
          ...(camera.status !== 'online'
            ? [{ label: 'Onlayn deb belgilash', icon: Signal, onClick: () => onSetStatus(camera, 'online') }]
            : []),
          ...(camera.status !== 'maintenance'
            ? [{ label: 'Texnik xizmatga', icon: Wrench, tone: 'danger', onClick: () => onSetStatus(camera, 'maintenance') }]
            : []),
        ]}
      />
    </div>

    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <StatusBadge kind="cameraStatus" value={camera.status} size="xs" />
      <StatusBadge
        label={camera.monitoring === 'active' ? 'Kuzatuvda' : 'Pauza'}
        tone={camera.monitoring === 'active' ? 'brand' : 'neutral'}
        size="xs"
        dot={false}
      />
      {camera.linkedTurnstile && <StatusBadge label="Turniket" tone="teal" size="xs" dot={false} />}
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
      <span className="text-subtle">
        Hodisalar
        <span className="mt-0.5 block text-[13px] font-semibold text-ink tabular">{formatNumber(camera.todayEvents)}</span>
      </span>
      <span className="text-subtle">
        Aniqlangan
        <span className="mt-0.5 block text-[13px] font-semibold text-ink tabular">{formatNumber(camera.peopleDetected)}</span>
      </span>
    </div>

    {camera.note && <p className="mt-2.5 text-[11px] text-warning">{camera.note}</p>}
  </motion.div>
)

const CameraPage = () => {
  const table = useTableState({ sortBy: 'name', perPage: 24 })

  const { data, loading, refetching, error, refetch } = useQuery(
    [QK.cameras],
    () => cameraService.getCameras(table.params),
    { deps: ['cameras', table.params] },
  )
  const { data: stats } = useQuery([QK.cameras], () => cameraService.getCameraStats(), { deps: ['camera-stats'] })
  const { data: facets } = useQuery([QK.cameras], () => cameraService.getCameraFacets(), { deps: ['camera-facets'] })

  const handleToggleMonitoring = async (camera) => {
    await cameraService.toggleMonitoring(camera.id)
    toast({ tone: 'success', title: camera.monitoring === 'active' ? 'Kuzatuv to‘xtatildi' : 'Kuzatuv yoqildi', description: camera.name })
  }

  const handleToggleRecording = async (camera) => {
    await cameraService.toggleRecording(camera.id)
    toast({ tone: 'success', title: camera.recording ? 'Yozuv to‘xtatildi' : 'Yozuv boshlandi', description: camera.name })
  }

  const handleSetStatus = async (camera, status) => {
    await cameraService.setCameraStatus(camera.id, status)
    toast({ tone: 'success', title: `Holat: ${cameraStatus.label(status)}`, description: camera.name })
  }

  return (
    <>
      <PageHeader
        title="Kamera monitoringi"
        subtitle="Filiallardagi kuzatuv qurilmalari holati. Bu DEMO rejim — hech qanday jonli video oqim uzatilmaydi, faqat qurilma holati va hodisalar statistikasi ko‘rsatiladi."
        icon={Video}
        actions={
          <StatusBadge label="DEMO rejim · jonli efir yo‘q" tone="teal" size="md" />
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
          <StatCard label="Onlayn qurilmalar" value={stats.online} icon={Signal} tone="success" hint={`Jami ${stats.total} ta kamera`} compact />
          <StatCard label="Oflayn / xizmatda" value={stats.offline + stats.maintenance} icon={VideoOff} tone="danger" hint={`${formatPercent(stats.uptime)} uptime`} compact />
          <StatCard label="Bugungi hodisalar" value={stats.events} icon={Activity} tone="brand" hint={`${stats.recording} ta yozuvda`} compact />
          <StatCard label="Aniqlangan odamlar" value={stats.people} icon={Users} tone="violet" hint={`${stats.monitoring} ta kuzatuvda`} compact />
        </motion.div>
      )}

      {stats?.byBranch?.length > 0 && (
        <Card className="mt-4" title="Filiallar bo‘yicha qurilmalar" icon={HardDrive}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
            {stats.byBranch.map((branch) => (
              <div key={branch.branch} className="rounded-[11px] border border-line bg-surface-2/60 p-3">
                <p className="truncate text-[11.5px] text-muted">{branch.branch}</p>
                <p className="mt-1 text-[17px] font-semibold text-ink tabular">{branch.total}</p>
                <p className="mt-0.5 text-[11px]">
                  <span className="text-success">{branch.online} onlayn</span>
                  {branch.offline > 0 && <span className="text-danger"> · {branch.offline} oflayn</span>}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-3.5" padded={false}>
        <FilterBar
          query={table.query}
          onQueryChange={table.setQuery}
          placeholder="Kamera nomi, kod, zona, IP..."
          activeCount={table.activeFilterCount}
          onReset={table.reset}
          resultLabel={data ? `${formatNumber(data.total)} ta qurilma` : ''}
        >
          <Select
            className="w-40"
            size="sm"
            value={table.filters.branch}
            onChange={(v) => table.setFilter('branch', v)}
            options={(facets?.branches ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha filiallar"
            placeholder="Filial"
            searchable
          />
          <Select
            className="w-44"
            size="sm"
            value={table.filters.zone}
            onChange={(v) => table.setFilter('zone', v)}
            options={(facets?.zones ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }))}
            allLabel="Barcha zonalar"
            placeholder="Zona"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.status}
            onChange={(v) => table.setFilter('status', v)}
            options={cameraStatus.options()}
            allLabel="Barcha holatlar"
            placeholder="Holat"
          />
          <Select
            className="w-36"
            size="sm"
            value={table.filters.monitoring}
            onChange={(v) => table.setFilter('monitoring', v)}
            options={[
              { value: 'active', label: 'Kuzatuvda' },
              { value: 'paused', label: 'Pauzada' },
            ]}
            allLabel="Barcha rejimlar"
            placeholder="Kuzatuv"
          />
        </FilterBar>

        <div className="p-4">
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : loading && !data ? (
            <SkeletonList rows={6} />
          ) : !data?.rows.length ? (
            <NoResults query={table.query} onReset={table.reset} />
          ) : (
            <motion.div
              variants={staggerContainer(0.04)}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {data.rows.map((camera) => (
                <CameraCard
                  key={camera.id}
                  camera={camera}
                  onToggleMonitoring={handleToggleMonitoring}
                  onToggleRecording={handleToggleRecording}
                  onSetStatus={handleSetStatus}
                />
              ))}
            </motion.div>
          )}
          {refetching && <p className="mt-3 text-center text-[11px] text-faint">Yangilanmoqda…</p>}
        </div>
      </Card>
    </>
  )
}

export default CameraPage
