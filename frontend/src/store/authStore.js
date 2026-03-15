import { create } from 'zustand'
import api from '../lib/axios'

export const useAuthStore = create((set, get) => ({
  user: null,
  org: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('ds_access_token')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.data.user, org: data.data.org, loading: false })
    } catch {
      localStorage.removeItem('ds_access_token')
      localStorage.removeItem('ds_refresh_token')
      set({ user: null, org: null, loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('ds_access_token', data.data.accessToken)
    localStorage.setItem('ds_refresh_token', data.data.refreshToken)
    set({ user: data.data.user, org: data.data.org })
    return data
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    localStorage.setItem('ds_access_token', data.data.accessToken)
    localStorage.setItem('ds_refresh_token', data.data.refreshToken)
    set({ user: data.data.user, org: data.data.org })
    return data
  },

  logout: () => {
    localStorage.removeItem('ds_access_token')
    localStorage.removeItem('ds_refresh_token')
    set({ user: null, org: null })
    window.location.href = '/login'
  },

  updateOrg: (org) => set({ org }),
}))
