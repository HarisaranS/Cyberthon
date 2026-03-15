import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  infrastructureFilter: null,
  setInfrastructureFilter: (filter) => set({ infrastructureFilter: filter }),
}))
