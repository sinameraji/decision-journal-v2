import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDecisionsSlice, type DecisionsSlice } from './decisions-slice'
import { createUISlice, type UISlice } from './ui-slice'

// Combined store type
export type Store = DecisionsSlice & UISlice

// Create the store with both slices
export const useStore = create<Store>()(
  persist(
    (...a) => ({
      ...createDecisionsSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'decision-journal-storage',
      // Only persist UI preferences, not decisions (those are in SQLite)
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
      }),
    }
  )
)
