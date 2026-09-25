import { OFFICES } from './constants'

export const ATTENDANCE_DAYS = 21

const pad = (n) => String(n).padStart(2, '0')
const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const timeOf = (h, m) => `${pad(h)}:${pad(m)}`

/**
 * Daily attendance for the last 21 calendar days (Sundays skipped for office
 * staff, stores run 7 days). One row per employee per working day — the same
 * rows feed Davomat, Ofis davomat, employee profiles and HR analytics.
 */
export const generateAttendance = (rng, { employees }) => {
  const records = []
  const staff = employees.filter((e) => e.status !== 'terminated')
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  for (let offset = ATTENDANCE_DAYS - 1; offset >= 0; offset--) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const isSunday = date.getDay() === 0
    const key = dayKey(date)

    staff.forEach((emp) => {
      const isOffice = emp.branch === 'Bosh ofis' || emp.department === 'IT' || emp.department === 'Moliya'
      if (isSunday && isOffice) return
      if (new Date(emp.hiredAt) > date) return

      // employees with a high attendanceRate rarely miss a day
      const discipline = emp.attendanceRate / 100
      const status = rng.weighted({
        present: 60 + discipline * 26,
        late: Math.max(2, 14 - discipline * 9),
        remote: isOffice ? 7 : 0.4,
        absent: Math.max(0.6, 5 - discipline * 4),
        leave: 2.4,
      })

      let checkIn = null
      let checkOut = null
      let lateMinutes = 0
      let hours = 0
      const shiftStart = isOffice ? 9 : 8

      if (status === 'present') {
        const m = rng.int(0, 12)
        checkIn = timeOf(shiftStart - (m > 6 ? 1 : 0), m > 6 ? 60 - m : m)
        checkOut = timeOf(shiftStart + 9, rng.int(0, 45))
        hours = Number(rng.float(8.2, 9.4).toFixed(1))
      } else if (status === 'late') {
        lateMinutes = rng.int(8, 74)
        checkIn = timeOf(shiftStart + Math.floor(lateMinutes / 60), lateMinutes % 60)
        checkOut = timeOf(shiftStart + 9, rng.int(0, 50))
        hours = Number(rng.float(7.2, 8.8).toFixed(1))
      } else if (status === 'remote') {
        checkIn = timeOf(shiftStart, rng.int(0, 35))
        checkOut = timeOf(shiftStart + 9, rng.int(0, 30))
        hours = Number(rng.float(7.8, 8.8).toFixed(1))
      }

      records.push({
        id: `att-${key}-${emp.id}`,
        date: key,
        employeeId: emp.id,
        employeeCode: emp.code,
        fullName: emp.fullName,
        avatarTone: emp.avatarTone,
        position: emp.position,
        department: emp.department,
        branch: emp.branch,
        office: isOffice ? (OFFICES.find((o) => o.branch === emp.branch)?.name ?? OFFICES[0].name) : null,
        status,
        checkIn,
        checkOut,
        hours,
        lateMinutes,
        overtimeHours: hours > 9 ? Number((hours - 9).toFixed(1)) : 0,
        source: isOffice ? rng.weighted({ turniket: 7, mobil: 3 }) : rng.weighted({ turniket: 8, 'qo‘lda': 2 }),
        note: status === 'leave' ? rng.pick(['Yillik ta’til', 'Kasallik varaqasi', 'O‘z hisobidan']) : null,
      })
    })
  }

  return records
}
