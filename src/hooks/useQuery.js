import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeKey } from '@/lib/queryBus'

/**
 * Minimal data-fetching hook with the three states every page needs
 * (loading / error / empty) plus automatic revalidation when a mutation
 * invalidates one of its keys.
 *
 * `keepPrevious` keeps the old rows on screen while a filter change refetches,
 * so tables never flash a skeleton while the user is typing.
 */
export const useQuery = (keys, fetcher, { deps = [], enabled = true, keepPrevious = true, initialData = null } = {}) => {
  const keyList = Array.isArray(keys) ? keys : [keys]
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(Boolean(enabled))
  const [refetching, setRefetching] = useState(false)
  const [error, setError] = useState(null)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const mountedRef = useRef(true)
  const runIdRef = useRef(0)
  const hasDataRef = useRef(initialData !== null)

  const depsKey = JSON.stringify(deps)
  const keysKey = keyList.join('|')

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(
    async (mode = 'initial') => {
      if (!enabled) {
        setLoading(false)
        return
      }
      const runId = ++runIdRef.current
      const soft = mode !== 'initial' && keepPrevious && hasDataRef.current
      if (soft) setRefetching(true)
      else setLoading(true)
      setError(null)

      try {
        const result = await fetcherRef.current()
        if (!mountedRef.current || runId !== runIdRef.current) return
        setData(result)
        hasDataRef.current = true
      } catch (err) {
        if (!mountedRef.current || runId !== runIdRef.current) return
        setError(err instanceof Error ? err : new Error(String(err)))
        if (!keepPrevious) setData(null)
      } finally {
        if (mountedRef.current && runId === runIdRef.current) {
          setLoading(false)
          setRefetching(false)
        }
      }
    },
    [enabled, keepPrevious],
  )

  // initial load + reload whenever the query params change
  useEffect(() => {
    run(hasDataRef.current ? 'params' : 'initial')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, enabled])

  // revalidate on mutations
  useEffect(() => {
    if (!enabled) return undefined
    const unsubscribers = keyList.map((key) => subscribeKey(key, () => run('invalidate')))
    return () => unsubscribers.forEach((fn) => fn())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysKey, enabled, run])

  return {
    data,
    loading,
    refetching,
    busy: loading || refetching,
    error,
    refetch: () => run('manual'),
    setData,
  }
}
