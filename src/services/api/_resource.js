import { http } from '../http/apiClient'

/**
 * REST conventions shared by every domain endpoint.
 * Each api/*.js file maps the service function names used by the UI onto
 * these calls, so the mock and the real implementation stay interchangeable.
 */
export const createResource = (path) => ({
  list: (params) => http.get(path, params),
  get: (id) => http.get(`${path}/${id}`),
  create: (body) => http.post(path, body),
  update: (id, body) => http.patch(`${path}/${id}`, body),
  remove: (id) => http.del(`${path}/${id}`),
  action: (id, name, body) => http.post(`${path}/${id}/${name}`, body),
  collection: (name, params) => http.get(`${path}/${name}`, params),
  command: (name, body) => http.post(`${path}/${name}`, body),
})

/**
 * Adapter hook: if the backend ever returns a different field naming, map it
 * here instead of touching the UI. Identity by default.
 */
export const mapList = (payload) => ({
  rows: payload?.rows ?? payload?.items ?? payload ?? [],
  total: payload?.total ?? payload?.count ?? (Array.isArray(payload) ? payload.length : 0),
  page: payload?.page ?? 1,
  pages: payload?.pages ?? 1,
})
