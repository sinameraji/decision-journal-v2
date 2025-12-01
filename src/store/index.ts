import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDecisionsSlice, type DecisionsSlice } from './decisions-slice'
import { createUISlice, type UISlice } from './ui-slice'
import { createChatSlice, type ChatSlice } from './chat-slice'

// Combined store type
export type Store = DecisionsSlice & UISlice & ChatSlice

// Create the store with all slices
export const useStore = create<Store>()(
  persist(
    (...a) => ({
      ...createDecisionsSlice(...a),
      ...createUISlice(...a),
      ...createChatSlice(...a),
    }),
    {
      name: 'decision-journal-storage',
      // Only persist UI preferences, not decisions/chat (those are in SQLite)
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
        selectedModel: state.selectedModel, // Persist selected chat model
      }),
    }
  )
)
