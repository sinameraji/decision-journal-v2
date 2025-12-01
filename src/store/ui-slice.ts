import { type StateCreator } from 'zustand'
import { type UserPreferences } from '@/types/preferences'

export interface UISlice {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // User Preferences
  preferences: UserPreferences | null
  updatePreferences: (updates: Partial<UserPreferences>) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // View mode
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Filters
  activeFilters: {
    status?: 'decided' | 'pending' | 'all'
    tags?: string[]
    dateRange?: [string, string]
  }
  setActiveFilters: (filters: UISlice['activeFilters']) => void
  clearFilters: () => void
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => {
    set({ theme })
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  },

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // User Preferences (will be loaded from SQLite)
  preferences: null,
  updatePreferences: (updates) =>
    set((state) => ({
      preferences: state.preferences
        ? { ...state.preferences, ...updates }
        : null
    })),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // View mode
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Filters
  activeFilters: { status: 'all' },
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  clearFilters: () => set({ activeFilters: { status: 'all' } }),
})
