import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * `base` is only applied to production builds so the bundle works when it is
 * served from a project subpath (GitHub Pages: /hri-control-center/).
 * Local development keeps the plain "/" root.
 * Override with BASE_PATH=/ when deploying to a custom domain.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/hri-control-center/') : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Charts and motion are the two heaviest dependencies; splitting them keeps
    // the first paint light and lets the browser cache them between deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
}))
