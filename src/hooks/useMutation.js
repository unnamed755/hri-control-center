import { useCallback, useState } from 'react'
import { toast } from '@/store/uiStore'

/**
 * Wraps a service call with pending state and a toast, so every demo action
 * gives immediate feedback and failures are visible instead of silent.
 */
export const useMutation = (fn, { successMessage, errorMessage, onSuccess, onError, toastOnSuccess = true } = {}) => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(
    async (...args) => {
      setPending(true)
      setError(null)
      try {
        const result = await fn(...args)
        const message = typeof successMessage === 'function' ? successMessage(result, ...args) : successMessage
        if (toastOnSuccess && message) toast({ tone: 'success', title: message })
        await onSuccess?.(result, ...args)
        return result
      } catch (err) {
        const normalised = err instanceof Error ? err : new Error(String(err))
        setError(normalised)
        toast({
          tone: 'danger',
          title: errorMessage ?? 'Amal bajarilmadi',
          description: normalised.message,
          duration: 5200,
        })
        await onError?.(normalised)
        return null
      } finally {
        setPending(false)
      }
    },
    [fn, successMessage, errorMessage, onSuccess, onError, toastOnSuccess],
  )

  return { mutate, pending, error }
}
