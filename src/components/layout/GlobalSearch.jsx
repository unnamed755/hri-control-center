import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, CornerDownLeft, Search, UserSearch, Users } from 'lucide-react'
import { cn, normalize } from '@/lib/utils'
import { backdropVariants, scaleIn } from '@/lib/motion'
import { flatNavigation } from '@/config/navigation'
import { useUiStore } from '@/store/uiStore'
import { useDebounced } from '@/hooks/useTableState'
import { candidatesService, employeesService, vacanciesService } from '@/services'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatPhone } from '@/lib/format'

const GROUP_META = {
  nav: { label: 'Sahifalar', icon: ArrowRight },
  employees: { label: 'Xodimlar', icon: Users },
  candidates: { label: 'Nomzodlar', icon: UserSearch },
  vacancies: { label: 'Vakansiyalar', icon: BriefcaseBusiness },
}

export const GlobalSearch = () => {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query, 220)
  const [results, setResults] = useState({ employees: [], candidates: [], vacancies: [] })
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setResults({ employees: [], candidates: [], vacancies: [] })
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([
      employeesService.getEmployees({ q: debounced, perPage: 4 }),
      candidatesService.getCandidates({ q: debounced, perPage: 4 }),
      vacanciesService.getVacancies({ q: debounced, perPage: 3 }),
    ])
      .then(([employees, candidates, vacancies]) => {
        if (cancelled) return
        setResults({ employees: employees.rows, candidates: candidates.rows, vacancies: vacancies.rows })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced, open])

  const navMatches = useMemo(() => {
    const q = normalize(query)
    if (!q) return flatNavigation.slice(0, 7)
    return flatNavigation.filter((item) => normalize(item.label).includes(q) || normalize(item.section).includes(q)).slice(0, 6)
  }, [query])

  const flatResults = useMemo(
    () => [
      ...navMatches.map((item) => ({ group: 'nav', id: item.to, to: item.to, item })),
      ...results.employees.map((item) => ({ group: 'employees', id: item.id, to: `/employees/${item.id}`, item })),
      ...results.candidates.map((item) => ({ group: 'candidates', id: item.id, to: `/candidates?focus=${item.id}`, item })),
      ...results.vacancies.map((item) => ({ group: 'vacancies', id: item.id, to: `/vacancies?focus=${item.id}`, item })),
    ],
    [navMatches, results],
  )

  const go = (entry) => {
    if (!entry) return
    setOpen(false)
    navigate(entry.to)
  }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setCursor((c) => Math.min(c + 1, flatResults.length - 1))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        go(flatResults[cursor])
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, flatResults, cursor]) // eslint-disable-line react-hooks/exhaustive-deps

  const renderGroup = (group, entries) => {
    if (!entries.length) return null
    const meta = GROUP_META[group]
    return (
      <div key={group} className="px-2 pb-2">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">{meta.label}</p>
        <div className="space-y-0.5">
          {entries.map((entry) => {
            const index = flatResults.findIndex((r) => r.group === entry.group && r.id === entry.id)
            const active = index === cursor
            return (
              <button
                key={`${group}-${entry.id}`}
                type="button"
                onMouseEnter={() => setCursor(index)}
                onClick={() => go(entry)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left transition-colors',
                  active ? 'bg-brand/14' : 'hover:bg-white/[0.045]',
                )}
              >
                {group === 'nav' ? (
                  <span className="grid size-7.5 shrink-0 place-items-center rounded-[8px] border border-line bg-surface-2 text-subtle">
                    <entry.item.icon className="size-4" strokeWidth={2} />
                  </span>
                ) : (
                  <Avatar
                    name={entry.item.fullName ?? entry.item.title}
                    tone={entry.item.avatarTone ?? entry.item.recruiterTone ?? 'var(--color-brand)'}
                    size="sm"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {entry.item.fullName ?? entry.item.title ?? entry.item.label}
                  </span>
                  <span className="block truncate text-[11px] text-subtle">
                    {group === 'nav'
                      ? entry.item.section
                      : group === 'employees'
                        ? `${entry.item.position} · ${entry.item.branch} · ${formatPhone(entry.item.phone)}`
                        : group === 'candidates'
                          ? `${entry.item.profession} · ${entry.item.experienceYears} yil · ${entry.item.recruiterName}`
                          : `${entry.item.department} · ${entry.item.branch} · ${entry.item.candidateCount ?? 0} nomzod`}
                  </span>
                </span>
                {group === 'employees' && <StatusBadge kind="employeeStatus" value={entry.item.status} size="xs" />}
                {group === 'candidates' && <StatusBadge kind="candidateStatus" value={entry.item.status} size="xs" />}
                {group === 'vacancies' && <StatusBadge kind="vacancyStatus" value={entry.item.status} size="xs" />}
                {active && <CornerDownLeft className="size-3.5 shrink-0 text-brand-2" strokeWidth={2.2} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#03060D]/80 backdrop-blur-[3px]"
          />
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-[16px] border border-line-strong bg-surface/98 shadow-float backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
              <Search className="size-4 shrink-0 text-subtle" strokeWidth={2} />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setCursor(0)
                }}
                placeholder="Xodim, nomzod, vakansiya yoki sahifa qidirish..."
                className="h-6 w-full bg-transparent text-[13.5px] outline-none placeholder:text-subtle"
              />
              {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />}
              <kbd className="hidden shrink-0 rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] text-subtle sm:block">
                ESC
              </kbd>
            </div>

            <div className="scroll-area flex-1 overflow-y-auto py-2">
              {renderGroup('nav', flatResults.filter((r) => r.group === 'nav'))}
              {renderGroup('employees', flatResults.filter((r) => r.group === 'employees'))}
              {renderGroup('candidates', flatResults.filter((r) => r.group === 'candidates'))}
              {renderGroup('vacancies', flatResults.filter((r) => r.group === 'vacancies'))}
              {!flatResults.length && (
                <p className="px-5 py-8 text-center text-[12.5px] text-subtle">
                  {query.length < 2 ? 'Kamida 2 belgi kiriting' : 'Natija topilmadi'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line-soft px-4 py-2.5 text-[10.5px] text-faint">
              <span>↑ ↓ tanlash · Enter ochish</span>
              <span>DEMO ma’lumotlari</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
