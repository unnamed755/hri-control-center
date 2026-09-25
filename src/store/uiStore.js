import { create } from 'zustand'
import { uid } from '@/lib/utils'

/**
 * UI-only state: shell layout, toasts and the confirm dialog.
 * Domain data never lives here — it belongs to the service layer.
 */
export const useUiStore = create((set, get) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  commandOpen: false,
  notificationsOpen: false,
  toasts: [],
  confirm: null,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  openMobileSidebar: () => set({ sidebarMobileOpen: true }),
  closeMobileSidebar: () => set({ sidebarMobileOpen: false }),
  setCommandOpen: (value) => set({ commandOpen: value }),
  setNotificationsOpen: (value) => set({ notificationsOpen: value }),

  toast: (toast) => {
    const id = uid('toast')
    const entry = { id, tone: 'success', duration: 3800, ...toast }
    set((s) => ({ toasts: [...s.toasts, entry] }))
    if (entry.duration) {
      setTimeout(() => get().dismissToast(id), entry.duration)
    }
    return id
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  /**
   * Promise-based confirm dialog:
   *   const ok = await askConfirm({ title, description, tone })
   */
  askConfirm: (options) =>
    new Promise((resolve) => {
      set({
        confirm: {
          tone: 'danger',
          confirmLabel: 'Tasdiqlash',
          cancelLabel: 'Bekor qilish',
          ...options,
          resolve,
        },
      })
    }),
  resolveConfirm: (value) => {
    const current = get().confirm
    current?.resolve?.(value)
    set({ confirm: null })
  },
}))

export const toast = (entry) => useUiStore.getState().toast(entry)
export const askConfirm = (options) => useUiStore.getState().askConfirm(options)
