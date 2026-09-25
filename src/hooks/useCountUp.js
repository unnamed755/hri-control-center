import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5)

/**
 * Animated number for KPI cards. Counts from the previous value to the next
 * one, so a live update animates instead of jumping.
 */
export const useCountUp = (target, { duration = 1100, delay = 0, enabled = true } = {}) => {
  const [value, setValue] = useState(enabled ? 0 : Number(target) || 0)
  const fromRef = useRef(0)
  const frameRef = useRef(0)
  const timerRef = useRef(0)

  useEffect(() => {
    const to = Number(target) || 0
    if (!enabled || prefersReducedMotion()) {
      setValue(to)
      fromRef.current = to
      return undefined
    }

    const from = fromRef.current
    if (from === to) return undefined

    const start = () => {
      const startedAt = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration)
        const eased = easeOutQuint(progress)
        setValue(from + (to - from) * eased)
        if (progress < 1) frameRef.current = requestAnimationFrame(tick)
        else fromRef.current = to
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    if (delay) timerRef.current = setTimeout(start, delay)
    else start()

    return () => {
      cancelAnimationFrame(frameRef.current)
      clearTimeout(timerRef.current)
    }
  }, [target, duration, delay, enabled])

  return value
}
