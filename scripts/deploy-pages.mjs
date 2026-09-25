/**
 * Publishes the production build to the `gh-pages` branch.
 *
 *   npm run deploy:pages
 *
 * Pages serves the site from /hri-control-center/, so the bundle is rebuilt
 * here with BASE_PATH instead of reusing the root-based `npm run build`.
 *
 * `dist/` is a throwaway git repo — the main history stays untouched.
 * 404.html is a copy of index.html so Pages serves client-side routes
 * (/employees, /payroll, …) instead of its own 404 page.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const remote = process.env.PAGES_REMOTE ?? 'https://github.com/unnamed755/hri-control-center.git'
const branch = 'gh-pages'
const basePath = process.env.BASE_PATH ?? '/hri-control-center/'

execFileSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, BASE_PATH: basePath },
})

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html topilmadi — build muvaffaqiyatsiz.')
  process.exit(1)
}

const git = (...args) => execFileSync('git', args, { cwd: dist, stdio: 'inherit' })

copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
writeFileSync(path.join(dist, '.nojekyll'), '')

rmSync(path.join(dist, '.git'), { recursive: true, force: true })
git('init', '-q', '-b', branch)
git('add', '-A')
git('-c', 'core.safecrlf=false', 'commit', '-q', '-m', `Deploy ${new Date().toISOString()}`)
git('push', '-q', '-f', remote, branch)
rmSync(path.join(dist, '.git'), { recursive: true, force: true })

console.log(`\nPages deploy tayyor: https://unnamed755.github.io${basePath}`)
