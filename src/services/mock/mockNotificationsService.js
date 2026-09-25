import { db } from './db'
import { latency } from './tableUtils'
import { QK, invalidate } from '@/lib/queryBus'

export const getNotifications = async ({ limit = 40, onlyUnread = false } = {}) => {
  await latency(0.25)
  const rows = db
    .get('notifications')
    .filter((n) => (onlyUnread ? !n.read : true))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { rows: rows.slice(0, limit), total: rows.length, unread: db.get('notifications').filter((n) => !n.read).length }
}

export const getUnreadCount = async () => {
  await latency(0.15)
  return db.get('notifications').filter((n) => !n.read).length
}

export const markRead = async (id) => {
  const updated = db.update('notifications', id, { read: true })
  invalidate([QK.notifications])
  return updated
}

export const markAllRead = async () => {
  await latency(0.3)
  db.updateWhere('notifications', () => true, { read: true })
  invalidate([QK.notifications])
  return true
}

export const removeNotification = async (id) => {
  db.remove('notifications', id)
  invalidate([QK.notifications])
  return true
}

export const clearAll = async () => {
  await latency(0.3)
  db.replace('notifications', [])
  invalidate([QK.notifications])
  return true
}

/** Demo actions publish here so the bell reacts to what the user just did. */
export const pushNotification = (entry) => {
  const record = {
    id: db.nextId('notifications', 'ntf'),
    createdAt: new Date().toISOString(),
    read: false,
    severity: 'info',
    module: 'employees',
    link: null,
    entityId: null,
    ...entry,
  }
  db.insert('notifications', record)
  invalidate([QK.notifications])
  return record
}
