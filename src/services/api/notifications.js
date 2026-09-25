import { createResource } from './_resource'

const r = createResource('/notifications')

export const getNotifications = (params) => r.list(params)
export const getUnreadCount = () => r.collection('unread-count')
export const markRead = (id) => r.action(id, 'read')
export const markAllRead = () => r.command('read-all')
export const removeNotification = (id) => r.remove(id)
export const clearAll = () => r.command('clear')
export const pushNotification = (entry) => r.create(entry)
