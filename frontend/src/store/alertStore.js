import { create } from 'zustand'
import api from '../lib/axios'

export const useAlertStore = create((set) => ({
  unreadCount: 0,
  fetchUnread: async () => {
    try {
      const { data } = await api.get('/alerts/unread-count')
      set({ unreadCount: data.data.count || 0 })
    } catch {}
  },
  setUnreadCount: (n) => set({ unreadCount: n }),
  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
}))
