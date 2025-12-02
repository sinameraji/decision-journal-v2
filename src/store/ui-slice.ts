import { type StateCreator } from 'zustand'
import { type UserPreferences, type FontSize, FONT_SIZE_CONFIG } from '@/types/preferences'

export interface UISlice {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Font Size
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void

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

// Media query listener for system theme changes
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set, get) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => {
    set({ theme })

    // Remove existing listener if any
    if (systemThemeListener) {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', systemThemeListener)
      systemThemeListener = null
    }

    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      const updateSystemTheme = () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      // Apply current system theme
      updateSystemTheme()

      // Listen for system theme changes
      systemThemeListener = (e: MediaQueryListEvent) => {
        // Only apply if theme is still set to system
        if (get().theme === 'system') {
          if (e.matches) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', systemThemeListener)
    }
  },

  // Font Size
  fontSize: 'base',
  setFontSize: (size) => {
    set({ fontSize: size })

    // Apply to document root
    const scale = FONT_SIZE_CONFIG[size].scale
    document.documentElement.style.setProperty('--font-size-scale', scale.toString())
  },

  increaseFontSize: () => {
    const current = get().fontSize
    const sizes: FontSize[] = ['xs', 'sm', 'base', 'lg', 'xl']
    const currentIndex = sizes.indexOf(current)

    if (currentIndex < sizes.length - 1) {
      const nextSize = sizes[currentIndex + 1]
      get().setFontSize(nextSize)

      // Also update preferences
      const updatePreferences = get().updatePreferences
      if (updatePreferences) {
        updatePreferences({ font_size: nextSize })
      }
    }
  },

  decreaseFontSize: () => {
    const current = get().fontSize
    const sizes: FontSize[] = ['xs', 'sm', 'base', 'lg', 'xl']
    const currentIndex = sizes.indexOf(current)

    if (currentIndex > 0) {
      const prevSize = sizes[currentIndex - 1]
      get().setFontSize(prevSize)

      // Also update preferences
      const updatePreferences = get().updatePreferences
      if (updatePreferences) {
        updatePreferences({ font_size: prevSize })
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
