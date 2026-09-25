import { appConfig } from '@/config/appConfig'

/**
 * The only place that knows how to talk to the backend.
 *
 * Today `appConfig.api.baseUrl` is empty on purpose — no fake endpoints are
 * invented. Tomorrow you set VITE_API_BASE_URL + VITE_DATA_SOURCE=api and the
 * whole application switches over without touching a single page.
 */
let authToken = null
export const setAuthToken = (token) => {
  authToken = token
}

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const buildUrl = (path, params) => {
  const base = `${appConfig.api.baseUrl}${appConfig.api.prefix}`
  const url = new URL(`${base}${path}`, appConfig.api.baseUrl || window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (typeof value === 'object') url.searchParams.set(key, JSON.stringify(value))
      else url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

const request = async (method, path, { params, body, signal } = {}) => {
  if (!appConfig.api.baseUrl) {
    throw new ApiError(
      'API manzili sozlanmagan. VITE_API_BASE_URL ni to‘ldiring yoki VITE_DATA_SOURCE=mock rejimida ishlating.',
      { code: 'API_NOT_CONFIGURED' },
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), appConfig.api.timeoutMs)

  try {
    const response = await fetch(buildUrl(path, params), {
      method,
      signal: signal ?? controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    if (!response.ok) {
      throw new ApiError(payload?.message ?? `So‘rov bajarilmadi (${response.status})`, {
        status: response.status,
        code: payload?.code,
        details: payload?.details,
      })
    }
    return payload?.data ?? payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error.name === 'AbortError') throw new ApiError('So‘rov vaqti tugadi', { code: 'TIMEOUT' })
    throw new ApiError(error.message ?? 'Tarmoq xatosi', { code: 'NETWORK' })
  } finally {
    clearTimeout(timeout)
  }
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
}
