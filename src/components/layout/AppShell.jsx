import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { pageVariants } from '@/lib/motion'
import { useUiStore } from '@/store/uiStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { GlobalSearch } from './GlobalSearch'
import { ToastHost } from '@/components/ui/ToastHost'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

/** Ambient background: two very soft radial washes, no visible gradients. */
const Ambience = () => (
  <div className="pointer-events-none fixed inset-0 z-0">
    <div
      className="absolute -left-40 -top-40 size-[520px] rounded-full opacity-[0.55] blur-3xl"
      style={{ background: 'radial-gradient(circle, rgba(59,124,255,0.10) 0%, transparent 68%)' }}
    />
    <div
      className="absolute -right-52 top-1/3 size-[560px] rounded-full opacity-40 blur-3xl"
      style={{ background: 'radial-gradient(circle, rgba(44,201,192,0.08) 0%, transparent 70%)' }}
    />
  </div>
)

export const AppShell = () => {
  const { pathname } = useLocation()
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const scrollRef = useRef(null)

  // ⌘K / Ctrl+K opens the global search from anywhere
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen])

  // every route starts at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="relative flex h-screen overflow-hidden bg-canvas">
      <Ambience />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main ref={scrollRef} className="scroll-area relative flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-5 lg:px-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GlobalSearch />
      <ToastHost />
      <ConfirmDialog />
    </div>
  )
}
