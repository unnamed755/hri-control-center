import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { appConfig } from '@/config/appConfig'

export const useDebounced = (value, delay = 260) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Search + filters + sorting + pagination in one place.
 * `params` is exactly the object a service (mock today, REST tomorrow) accepts.
 */
export const useTableState = ({
  initialFilters = {},
  perPage = appConfig.pageSize,
  sortBy = null,
  sortDir = 'asc',
  dateRange = { from: '', to: '' },
} = {}) => {
  const initialRef = useRef({ filters: initialFilters, dateRange })
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [range, setRange] = useState(dateRange)
  const [sort, setSort] = useState({ by: sortBy, dir: sortDir })
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(perPage)

  const debouncedQuery = useDebounced(query, 260)

  // any filter change resets pagination
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, filters, range, size])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value === undefined || value === null || value === '' || value === 'all') delete next[key]
      else next[key] = value
      return next
    })
  }, [])

  const toggleSort = useCallback((key) => {
    setSort((prev) => {
      if (prev.by !== key) return { by: key, dir: 'asc' }
      if (prev.dir === 'asc') return { by: key, dir: 'desc' }
      return { by: null, dir: 'asc' }
    })
  }, [])

  const reset = useCallback(() => {
    setQuery('')
    setFilters(initialRef.current.filters)
    setRange(initialRef.current.dateRange)
    setSort({ by: sortBy, dir: sortDir })
    setPage(1)
  }, [sortBy, sortDir])

  const activeFilterCount =
    Object.keys(filters).length + (range.from || range.to ? 1 : 0) + (debouncedQuery ? 1 : 0)

  const params = useMemo(
    () => ({
      q: debouncedQuery,
      filters,
      from: range.from || undefined,
      to: range.to || undefined,
      sortBy: sort.by,
      sortDir: sort.dir,
      page,
      perPage: size,
    }),
    [debouncedQuery, filters, range.from, range.to, sort.by, sort.dir, page, size],
  )

  return {
    query,
    setQuery,
    filters,
    setFilter,
    setFilters,
    range,
    setRange,
    sort,
    toggleSort,
    setSort,
    page,
    setPage,
    perPage: size,
    setPerPage: setSize,
    reset,
    params,
    activeFilterCount,
    isFiltered: activeFilterCount > 0,
  }
}
