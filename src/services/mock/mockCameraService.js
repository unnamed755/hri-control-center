import { db } from './db'
import { applyQuery, facet, latency } from './tableUtils'
import { QK, invalidate } from '@/lib/queryBus'
import { countBy, sum } from '@/lib/utils'

const queryConfig = {
  search: (c) => [c.name, c.code, c.branch, c.zone, c.status, c.ip, c.resolution],
  dateField: 'lastActivityAt',
  defaultSort: 'name',
  filters: {
    status: (row, value) => row.status === value,
    branch: (row, value) => row.branch === value,
    zone: (row, value) => row.zone === value,
    monitoring: (row, value) => row.monitoring === value,
    recording: (row, value) => String(row.recording) === String(value),
  },
}

export const getCameras = async (params = {}) => {
  await latency()
  return applyQuery(db.get('cameras'), params, queryConfig)
}

export const getCameraById = async (id) => {
  await latency(0.3)
  const camera = db.find('cameras', id)
  if (!camera) throw new Error('Kamera topilmadi')
  return camera
}

export const getCameraStats = async () => {
  await latency(0.25)
  const rows = db.get('cameras')
  const counts = countBy(rows, (r) => r.status)
  return {
    total: rows.length,
    online: counts.online ?? 0,
    offline: counts.offline ?? 0,
    maintenance: counts.maintenance ?? 0,
    recording: rows.filter((r) => r.recording).length,
    monitoring: rows.filter((r) => r.monitoring === 'active').length,
    events: sum(rows, (r) => r.todayEvents),
    people: sum(rows, (r) => r.peopleDetected),
    uptime: rows.length ? Math.round(((counts.online ?? 0) / rows.length) * 100) : 0,
    byBranch: Object.entries(
      rows.reduce((acc, r) => {
        acc[r.branch] ??= { branch: r.branch, total: 0, online: 0, offline: 0 }
        acc[r.branch].total += 1
        if (r.status === 'online') acc[r.branch].online += 1
        if (r.status === 'offline') acc[r.branch].offline += 1
        return acc
      }, {}),
    ).map(([, v]) => v),
  }
}

export const getCameraFacets = async () => {
  await latency(0.2)
  const rows = db.get('cameras')
  return {
    branches: facet(rows, 'branch'),
    zones: facet(rows, 'zone'),
    statuses: facet(rows, 'status'),
  }
}

export const toggleMonitoring = async (id) => {
  await latency(0.3)
  const camera = db.find('cameras', id)
  const updated = db.update('cameras', id, {
    monitoring: camera?.monitoring === 'active' ? 'paused' : 'active',
  })
  invalidate([QK.cameras])
  return updated
}

export const setCameraStatus = async (id, status) => {
  await latency(0.4)
  const updated = db.update('cameras', id, {
    status,
    recording: status === 'online',
    monitoring: status === 'online' ? 'active' : 'paused',
    lastActivityAt: new Date().toISOString(),
    note: status === 'online' ? null : status === 'maintenance' ? 'Texnik xizmat rejalashtirilgan' : 'Tarmoq uzilgan',
  })
  invalidate([QK.cameras])
  return updated
}

export const toggleRecording = async (id) => {
  await latency(0.3)
  const camera = db.find('cameras', id)
  const updated = db.update('cameras', id, { recording: !camera?.recording })
  invalidate([QK.cameras])
  return updated
}
