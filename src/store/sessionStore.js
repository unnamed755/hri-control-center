import { create } from 'zustand'
import { appConfig } from '@/config/appConfig'

/**
 * Demo session. No auth backend today — one Super Admin user with the HR
 * management scope. Swapping this for a real session provider tomorrow does
 * not affect any page: components read `useSessionStore`.
 */
const DEMO_USER = {
  id: 'usr-001',
  employeeId: 'emp-002',
  fullName: 'Super Admin',
  displayName: 'Super Admin',
  role: 'Super Admin',
  roleLabel: 'Super Admin roli',
  scope: 'HR boshqaruv',
  email: 'admin@hri-demo.uz',
  phone: '998901234567',
  avatarTone: 'var(--color-brand)',
  permissions: ['*'],
}

export const useSessionStore = create((set) => ({
  user: DEMO_USER,
  organisation: appConfig.brand.name,
  period: 'month',
  setPeriod: (period) => set({ period }),
  signOut: () => set({ user: null }),
  signIn: () => set({ user: DEMO_USER }),
}))

export const DEMO_SESSION_USER = DEMO_USER
