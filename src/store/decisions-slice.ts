import { type StateCreator } from 'zustand'
import { type Decision } from '@/types/decision'
import { sqliteService } from '@/services/database/sqlite-service'
import { autoEmbeddingService } from '@/services/rag/auto-embedding-service'

export interface DecisionsSlice {
  // State
  decisions: Decision[]
  currentDecision: Decision | null
  isLoading: boolean
  error: string | null

  // Actions
  loadDecisions: () => Promise<void>
  loadDecision: (id: string) => Promise<void>
  createDecision: (decision: Omit<Decision, 'id' | 'created_at' | 'updated_at'>) => Promise<Decision>
  updateDecision: (id: string, updates: Partial<Decision>) => Promise<void>
  deleteDecision: (id: string) => Promise<void>
  searchDecisions: (query: string, filters?: { tags?: string[]; status?: string; dateRange?: [string, string] }) => Promise<void>
  clearError: () => void
}

export const createDecisionsSlice: StateCreator<
  DecisionsSlice,
  [],
  [],
  DecisionsSlice
> = (set, get) => ({
  // Initial state
  decisions: [],
  currentDecision: null,
  isLoading: false,
  error: null,

  // Load all decisions
  loadDecisions: async () => {
    set({ isLoading: true, error: null })
    try {
      const decisions = await sqliteService.getDecisions()
      set({ decisions, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load decisions',
        isLoading: false
      })
    }
  },

  // Load single decision with full details
  loadDecision: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const decision = await sqliteService.getDecision(id)
      if (!decision) {
        throw new Error('Decision not found')
      }
      set({ currentDecision: decision, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load decision',
        isLoading: false
      })
    }
  },

  // Create new decision
  createDecision: async (decisionData) => {
    set({ isLoading: true, error: null })
    try {
      const now = Date.now()
      const newDecision: Decision = {
        ...decisionData,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      }

      await sqliteService.createDecision(newDecision)

      // Generate and save embedding automatically (async, non-blocking)
      autoEmbeddingService.generateEmbeddingForDecision(newDecision.id).catch(() => {
        // Errors are handled internally by auto-embedding service
        // Silent failure with automatic retry
      })

      // Reload decisions to get fresh data
      const decisions = await sqliteService.getDecisions()
      set({ decisions, currentDecision: newDecision, isLoading: false })

      return newDecision
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create decision',
        isLoading: false
      })
      throw error
    }
  },

  // Update existing decision
  updateDecision: async (id: string, updates: Partial<Decision>) => {
    set({ isLoading: true, error: null })
    try {
      const now = Date.now()
      const updatedDecision = {
        ...updates,
        id,
        updated_at: now,
      }

      await sqliteService.updateDecision(id, updatedDecision)

      // Regenerate embedding if content changed (async, non-blocking)
      if (updates.problem_statement || updates.situation || updates.actual_outcome || updates.tags) {
        autoEmbeddingService.generateEmbeddingForDecision(id).catch(() => {
          // Errors are handled internally by auto-embedding service
          // Silent failure with automatic retry
        })
      }

      // Update local state
      const decisions = get().decisions.map(d =>
        d.id === id ? { ...d, ...updates, updated_at: now } : d
      )

      const currentDecision = get().currentDecision?.id === id
        ? { ...get().currentDecision!, ...updates, updated_at: now }
        : get().currentDecision

      set({ decisions, currentDecision, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update decision',
        isLoading: false
      })
      throw error
    }
  },

  // Delete decision
  deleteDecision: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await sqliteService.deleteDecision(id)

      const decisions = get().decisions.filter(d => d.id !== id)
      const currentDecision = get().currentDecision?.id === id ? null : get().currentDecision

      set({ decisions, currentDecision, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete decision',
        isLoading: false
      })
      throw error
    }
  },

  // Search decisions with filters
  searchDecisions: async (query: string, filters) => {
    set({ isLoading: true, error: null })
    try {
      const decisions = await sqliteService.getDecisions({
        search: query,
        ...filters
      })
      set({ decisions, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search decisions',
        isLoading: false
      })
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),
})
