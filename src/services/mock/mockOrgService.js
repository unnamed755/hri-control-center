import { db } from './db'
import { latency } from './tableUtils'
import { buildOrgStructure } from '@/data/mock/org'
import { avg, sum, unique } from '@/lib/utils'
import { departmentColor } from '@/data/mock/constants'

/** The tree is rebuilt from the live employee collection on every read. */
export const getOrgStructure = async () => {
  await latency(0.6)
  const root = buildOrgStructure({ employees: db.get('employees') })
  db.setObject('org', root)
  return root
}

export const getOrgSummary = async () => {
  await latency(0.3)
  const active = db.get('employees').filter((e) => e.status !== 'terminated')
  const departments = unique(active.map((e) => e.department))
  return {
    headcount: active.length,
    departments: departments.length,
    branches: unique(active.map((e) => e.branch)).length,
    managers: active.filter((e) => active.some((x) => x.managerId === e.id)).length,
    avgSpan: Math.round(
      avg(
        active.filter((e) => active.some((x) => x.managerId === e.id)),
        (m) => active.filter((x) => x.managerId === m.id).length,
      ),
    ),
    byDepartment: departments
      .map((department) => {
        const list = active.filter((e) => e.department === department)
        return {
          department,
          headcount: list.length,
          avgKpi: Math.round(avg(list, (e) => e.kpi)),
          payroll: sum(list, (e) => e.salary),
          color: departmentColor(department),
          lead: list.find((e) => e.level === 'lead')?.fullName ?? 'Tayinlanmagan',
        }
      })
      .sort((a, b) => b.headcount - a.headcount),
  }
}

export const getDirectReports = async (employeeId) => {
  await latency(0.25)
  return db.get('employees').filter((e) => e.managerId === employeeId && e.status !== 'terminated')
}
