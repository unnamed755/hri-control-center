/**
 * Organisational structure exactly as drawn on the architecture whiteboard:
 *
 *   CEO → HR Owner → HR Department Head → HR modules
 *   CEO → COO / Finance / IT → operational departments
 *
 * Headcount and average KPI are computed from the live employee collection, so
 * the chart can never disagree with the Xodimlar page.
 */
const unit = (id, name, note, extra = {}) => ({
  id,
  type: 'unit',
  name,
  note,
  children: [],
  ...extra,
})

export const buildOrgStructure = ({ employees }) => {
  const active = employees.filter((e) => e.status !== 'terminated')
  const person = (id) => active.find((e) => e.id === id)

  const statsFor = (predicate) => {
    const list = active.filter(predicate)
    return {
      headcount: list.length,
      avgKpi: list.length ? Math.round(list.reduce((a, b) => a + b.kpi, 0) / list.length) : 0,
    }
  }

  const personNode = (id, { title, subtitle, children = [], scope } = {}) => {
    const emp = person(id)
    const stats = scope ? statsFor(scope) : { headcount: children.length, avgKpi: emp?.kpi ?? 0 }
    return {
      id: `org-${id}`,
      type: 'person',
      employeeId: id,
      name: emp?.fullName ?? '—',
      title: title ?? emp?.position ?? '',
      subtitle,
      department: emp?.department,
      branch: emp?.branch,
      phone: emp?.phone,
      email: emp?.email,
      avatarTone: emp?.avatarTone,
      kpi: emp?.kpi ?? 0,
      headcount: stats.headcount,
      avgKpi: stats.avgKpi,
      children,
    }
  }

  const departmentNode = (name, leadId) => {
    const stats = statsFor((e) => e.department === name)
    const lead = leadId ? person(leadId) : active.find((e) => e.department === name && e.level === 'lead')
    return {
      ...unit(`org-dep-${name}`, name, `${stats.headcount} xodim`),
      type: 'department',
      department: name,
      headcount: stats.headcount,
      avgKpi: stats.avgKpi,
      leadName: lead?.fullName ?? 'Tayinlanmagan',
      leadId: lead?.id ?? null,
      route: '/employees',
    }
  }

  const hrModules = [
    { id: 'recruitment', name: 'Recruitment', owner: 'emp-004', route: '/candidates', note: 'Nomzodlar · Vakansiyalar' },
    { id: 'onboarding', name: 'Onboarding', owner: 'emp-005', route: '/onboarding', note: 'Yangi xodim moslashuvi' },
    { id: 'employees', name: 'Xodimlar', owner: 'emp-006', route: '/employees', note: 'Kadrlar hisobi · Davomat' },
    { id: 'payroll', name: 'Payroll', owner: 'emp-010', route: '/payroll', note: 'Oylik · Bonus · Ushlanma' },
    { id: 'kpi', name: 'KPI & Performance', owner: 'emp-007', route: '/performance', note: 'Samaradorlik · Coins' },
    { id: 'analytics', name: 'HR Analitika', owner: 'emp-003', route: '/hr-analytics', note: 'Barcha modullar agregatsiyasi' },
    { id: 'tasks', name: 'HR vazifalar', owner: 'emp-003', route: '/hr-tasks', note: 'Topshiriq va nazorat' },
  ].map((m) => {
    const owner = person(m.owner)
    return {
      ...unit(`org-mod-${m.id}`, m.name, m.note),
      type: 'module',
      route: m.route,
      ownerId: m.owner,
      ownerName: owner?.fullName ?? '—',
      ownerRole: owner?.position ?? '',
      avatarTone: owner?.avatarTone,
    }
  })

  return {
    ...personNode('emp-001', {
      title: 'Bosh direktor (CEO)',
      subtitle: 'Kompaniya boshqaruvi',
      scope: () => true,
      children: [
        personNode('emp-002', {
          title: 'HR Owner',
          subtitle: 'HR egaligi va strategiyasi',
          scope: (e) => e.department === 'HR',
          children: [
            personNode('emp-003', {
              title: 'HR bo‘lim boshlig‘i',
              subtitle: 'Markaziy boshqaruv nuqtasi',
              scope: (e) => e.department === 'HR',
              children: hrModules,
            }),
          ],
        }),
        personNode('emp-011', {
          title: 'Operatsion direktor (COO)',
          subtitle: 'Savdo · Logistika · Xizmat',
          scope: (e) =>
            ['Savdo', 'Logistika', 'Xizmat ko‘rsatish', 'Xavfsizlik', 'Marketing'].includes(e.department),
          children: [
            departmentNode('Savdo'),
            departmentNode('Logistika'),
            departmentNode('Xizmat ko‘rsatish'),
            departmentNode('Xavfsizlik'),
            departmentNode('Marketing'),
          ],
        }),
        personNode('emp-010', {
          title: 'Bosh buxgalter',
          subtitle: 'Moliya va payroll nazorati',
          scope: (e) => e.department === 'Moliya',
          children: [departmentNode('Moliya')],
        }),
        personNode('emp-012', {
          title: 'IT rahbari',
          subtitle: 'Tizimlar va integratsiyalar',
          scope: (e) => e.department === 'IT',
          children: [departmentNode('IT')],
        }),
      ],
    }),
  }
}
