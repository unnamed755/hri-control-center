import { atTime } from './seedRandom'
import { BRANCHES, CAMERA_ZONES } from './constants'

/**
 * DEMO access-monitoring devices. No real stream is ever rendered — the UI
 * shows a labelled placeholder frame with the last snapshot time.
 */
export const generateCameras = (rng) => {
  const rows = []
  let index = 0

  BRANCHES.forEach((branch) => {
    const zones = rng.sample(CAMERA_ZONES, branch.type === 'office' ? 4 : rng.int(2, 4))
    zones.forEach((zone) => {
      index += 1
      const status = rng.weighted({ online: 17, offline: 2, maintenance: 1 })
      return rows.push({
        id: `cam-${String(index).padStart(3, '0')}`,
        name: `${branch.name} · ${zone}`,
        code: `CAM-${branch.id.replace('br-', '').toUpperCase()}-${String(index).padStart(2, '0')}`,
        branch: branch.name,
        branchType: branch.type,
        zone,
        status,
        recording: status === 'online' ? rng.bool(0.9) : false,
        monitoring: status === 'online' ? rng.weighted({ active: 8, paused: 2 }) : 'paused',
        resolution: rng.pick(['1080p', '1080p', '2K', '4K']),
        fps: rng.pick([15, 20, 25, 30]),
        lastActivityAt: status === 'offline' ? atTime(rng.int(1, 4), rng.int(8, 20)) : atTime(0, rng.int(8, 20), rng.int(0, 59)),
        todayEvents: status === 'online' ? rng.int(12, 480) : 0,
        peopleDetected: status === 'online' ? rng.int(4, 96) : 0,
        storageDays: rng.int(7, 45),
        firmware: `v${rng.int(2, 5)}.${rng.int(0, 9)}.${rng.int(0, 9)}`,
        ip: `10.${rng.int(10, 40)}.${rng.int(1, 250)}.${rng.int(2, 250)}`,
        linkedTurnstile: zone === 'Kirish/chiqish',
        note: status === 'maintenance' ? 'Ob’ektiv tozalanmoqda' : status === 'offline' ? 'Tarmoq uzilgan' : null,
      })
    })
  })

  return rows
}
