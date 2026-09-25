/**
 * Single place to flip the demo into a real backend deployment.
 *
 *   VITE_DATA_SOURCE = mock | api      (default: mock)
 *   VITE_API_BASE_URL = https://…      (empty today — no fake endpoints)
 *
 * `services/index.js` reads `dataSource` and exports either the mock
 * implementation or the HTTP implementation. Nothing else in the app knows
 * which one is live.
 */
const env = import.meta.env ?? {}

export const appConfig = {
  brand: {
    short: 'HRI',
    name: 'HRI Control Center',
    product: 'Control Center',
    tagline: 'HR boshqaruv markazi',
  },
  dataSource: env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock',
  api: {
    baseUrl: env.VITE_API_BASE_URL ?? '',
    prefix: '/api/v1',
    timeoutMs: 20000,
  },
  demo: {
    /** Demo state survives a refresh; bump the version to re-seed. */
    persistKey: 'hri.demo.state',
    persistVersion: 7,
    persist: true,
    /** Simulated network latency range (ms) so loading states are real. */
    latency: [120, 320],
    seed: 20260925,
  },
  locale: 'uz-UZ',
  currency: "so'm",
  pageSize: 12,
}

export const isDemo = appConfig.dataSource === 'mock'
