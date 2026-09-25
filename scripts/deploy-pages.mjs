/**
 * Publishes the production build to the `gh-pages` branch.
 *
 *   npm run deploy      (runs `vite build` first via the npm script)
 *
 * `dist/` is a throwaway git repo here — the main history stays untouched.
 * 404.html is a copy of index.html so GitHub Pages can serve client-side
 * routes (/employees, /payroll, …) instead of its own 404 page.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const remote = process.env.PAGES_REMOTE ?? 'https://github.com/unnamed755/hri-control-center.git'
const branch = 'gh-pages'

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html topilmadi — avval `npm run build` bajaring.')
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

console.log(`\nDeploy tayyor: https://unnamed755.github.io/hri-control-center/`)
