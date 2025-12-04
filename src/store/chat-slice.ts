import { type StateCreator } from 'zustand'
import { sqliteService } from '@/services/database/sqlite-service'
import type { ChatMessage, ChatSession, ChatSessionWithMetadata } from '@/types/chat'
import { ollamaService, type OllamaModel } from '@/services/llm/ollama-service'
import { toast } from 'sonner'

// Utility: Truncate title to specified length
const truncateTitle = (text: string, maxLength: number): string => {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.substring(0, maxLength).trim() + '...'
}

// Utility: Generate temporary session ID
const generateTempSessionId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Utility: Check if session ID is temporary
const isTempSessionId = (sessionId: string): boolean => {
  return sessionId.startsWith('temp-')
}

// Simplified message interface for in-memory state
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'tool-input'
  content: string
  timestamp: number
  toolExecution?: {
    toolId: string
    toolName: string
    result: any
  }
  toolInput?: {
    toolId: string
    toolName: string
    formData: Record<string, unknown>
    status: 'pending' | 'submitted' | 'cancelled'
  }
}

export interface DownloadProgress {
  modelName: string
  status: string
  completed: number
  total: number
  startedAt: number
}

export interface ChatSlice {
  // State
  messages: Message[]
  currentSessionId: string | null
  pendingMessage: string | null
  autoSubmit: boolean
  linkedDecisionId: string | null  // Deprecated - kept for backward compatibility
  attachedDecisionIds: string[]
  isLoading: boolean
  error: string | null
  sessions: ChatSessionWithMetadata[]
  isLoadingSessions: boolean
  sessionsError: string | null
  searchQuery: string
  refreshTimer: NodeJS.Timeout | null
  deletingSessions: Set<string>
  pendingSessions: Set<string>
  // Model management
  selectedModel: string | null
  availableModels: OllamaModel[]
  downloadingModels: Map<string, DownloadProgress>
  isLoadingModels: boolean
  uninstallingModels: Set<string>

  // Actions
  // Message management
  addMessage: (message: Message) => void
  clearMessages: () => void

  // Pending message for auto-submission
  setPendingMessage: (message: string, autoSubmit: boolean, decisionId?: string) => void
  clearPendingMessage: () => void

  // Session management
  createPendingSession: (decisionIds?: string[]) => string
  createNewSession: (decisionIds?: string[]) => Promise<string>
  persistPendingSession: (tempSessionId: string) => Promise<string>
  cleanupPendingSessions: () => void
  isPendingSession: (sessionId: string | null) => boolean
  loadMessagesFromSession: (sessionId: string) => Promise<void>
  setCurrentSessionId: (sessionId: string | null) => void
  setLinkedDecision: (decisionId: string | null) => void
  attachDecision: (decisionId: string) => void
  detachDecision: (decisionId: string) => void
  setAttachedDecisions: (decisionIds: string[]) => void

  // Database persistence
  saveMessageToDb: (message: Message, contextDecisionIds?: string[]) => Promise<void>
  loadMostRecentSession: () => Promise<void>

  // Session list management
  loadChatSessions: () => Promise<void>
  refreshSessions: () => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  renameSession: (sessionId: string, newTitle: string) => Promise<void>
  setSearchQuery: (query: string) => void
  generateSessionTitle: (sessionId: string) => Promise<string>

  // Model management
  loadAvailableModels: () => Promise<void>
  setSelectedModel: (modelName: string) => Promise<void>
  downloadModel: (modelName: string) => Promise<void>
  updateDownloadProgress: (modelName: string, progress: DownloadProgress) => void
  removeDownloadProgress: (modelName: string) => void
  uninstallModel: (modelName: string) => Promise<void>

  // Cleanup
  cleanup: () => void
}

export const createChatSlice: StateCreator<
  ChatSlice,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  // State
  messages: [] as Message[],
  currentSessionId: null as string | null,
  pendingMessage: null as string | null,
  autoSubmit: false,
  linkedDecisionId: null as string | null,  // Deprecated
  attachedDecisionIds: [] as string[],
  isLoading: false,
  error: null as string | null,
  sessions: [] as ChatSessionWithMetadata[],
  isLoadingSessions: false,
  sessionsError: null as string | null,
  searchQuery: '',
  refreshTimer: null as NodeJS.Timeout | null,
  deletingSessions: new Set<string>(),
  pendingSessions: new Set<string>(),
  // Model management state
  selectedModel: null as string | null,
  availableModels: [] as OllamaModel[],
  downloadingModels: new Map<string, DownloadProgress>(),
  isLoadingModels: false,
  uninstallingModels: new Set<string>(),

  // Actions
  addMessage: (message: Message) => {
    const messages = get().messages
    const existingIndex = messages.findIndex(m => m.id === message.id)

    if (existingIndex >= 0) {
      // Update existing message (for streaming updates)
      const updatedMessages = [...messages]
      updatedMessages[existingIndex] = message
      set({ messages: updatedMessages })
    } else {
      // Add new message
      set({ messages: [...messages, message] })
    }
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  setPendingMessage: (message: string, autoSubmit: boolean, decisionId?: string) => {
    set({
      pendingMessage: message,
      autoSubmit,
      linkedDecisionId: decisionId || null,  // Deprecated
      attachedDecisionIds: decisionId ? [decisionId] : [],
    })
  },

  clearPendingMessage: () => {
    set({
      pendingMessage: null,
      autoSubmit: false,
    })
  },

  createPendingSession: (decisionIds?: string[]): string => {
    // Create temporary session ID
    const tempSessionId = generateTempSessionId()

    // Add to pending sessions set
    const pendingSessions = new Set(get().pendingSessions)
    pendingSessions.add(tempSessionId)

    // Set as current session
    set({
      currentSessionId: tempSessionId,
      linkedDecisionId: decisionIds && decisionIds.length > 0 ? decisionIds[0] : null,  // Deprecated
      attachedDecisionIds: decisionIds || [],
      pendingSessions
    })

    return tempSessionId
  },

  createNewSession: async (decisionIds?: string[]): Promise<string> => {
    // This is now a wrapper that creates pending session
    return get().createPendingSession(decisionIds)
  },

  persistPendingSession: async (tempSessionId: string): Promise<string> => {
    try {
      // Create actual session in database
      const now = Date.now()
      const session: Omit<ChatSession, 'id'> = {
        decision_id: get().linkedDecisionId || null,  // Deprecated
        attached_decision_ids: get().attachedDecisionIds,
        created_at: now,
        updated_at: now,
        trigger_type: 'manual',
        title: null,
      }

      const createdSession = await sqliteService.createChatSession(session)
      const persistedId = createdSession.id

      // Remove from pending sessions
      const pendingSessions = new Set(get().pendingSessions)
      pendingSessions.delete(tempSessionId)

      // Update current session ID to persisted ID
      set({
        currentSessionId: persistedId,
        pendingSessions
      })

      return persistedId
    } catch (error) {
      console.error('Failed to persist session:', error)

      // Update state to reflect failure
      set({
        error: 'Failed to create chat session. Please try refreshing the page.',
        isLoading: false
      })

      // Clean up the failed temp session and create a new one
      const pendingSessions = new Set(get().pendingSessions)
      pendingSessions.delete(tempSessionId)
      set({ pendingSessions })

      // Create a new pending session to allow user to retry
      get().createPendingSession(get().attachedDecisionIds)

      throw error
    }
  },

  cleanupPendingSessions: () => {
    const currentSessionId = get().currentSessionId

    // Clear all pending sessions except current one
    if (currentSessionId && isTempSessionId(currentSessionId)) {
      set({ pendingSessions: new Set([currentSessionId]) })
    } else {
      set({ pendingSessions: new Set() })
    }
  },

  isPendingSession: (sessionId: string | null): boolean => {
    if (!sessionId) return false
    return get().pendingSessions.has(sessionId)
  },

  loadMessagesFromSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const session = await sqliteService.getChatSession(sessionId)
      const chatMessages = await sqliteService.getChatMessages(sessionId)

      // Migrate old decision_id to attachedDecisionIds
      let attachedIds: string[] = []
      if (session) {
        if (session.attached_decision_ids && session.attached_decision_ids.length > 0) {
          attachedIds = session.attached_decision_ids
        } else if (session.decision_id) {
          // Legacy: migrate on load
          attachedIds = [session.decision_id]
          // Persist migration to database
          await sqliteService.updateChatSessionAttachments(sessionId, attachedIds)
        }
      }

      // Convert ChatMessage[] to Message[]
      const messages: Message[] = chatMessages.map((msg: ChatMessage) => ({
        id: msg.id,
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
        timestamp: msg.created_at,
      }))

      set({
        messages,
        currentSessionId: sessionId,
        attachedDecisionIds: attachedIds,
        linkedDecisionId: attachedIds.length > 0 ? attachedIds[0] : null,  // Deprecated
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to load messages:', error)
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  setCurrentSessionId: (sessionId: string | null) => {
    set({ currentSessionId: sessionId })
  },

  setLinkedDecision: (decisionId: string | null) => {
    set({
      linkedDecisionId: decisionId,  // Deprecated
      attachedDecisionIds: decisionId ? [decisionId] : []
    })
  },

  attachDecision: (decisionId: string) => {
    const current = get().attachedDecisionIds
    if (!current.includes(decisionId)) {
      const updated = [...current, decisionId]
      set({
        attachedDecisionIds: updated,
      })

      // Persist to database if session exists
      const sessionId = get().currentSessionId
      if (sessionId && !isTempSessionId(sessionId)) {
        sqliteService.updateChatSessionAttachments(sessionId, updated).catch((error) => {
          console.error('Failed to persist attachment changes:', error)
        })
      }
    }
  },

  detachDecision: (decisionId: string) => {
    const updated = get().attachedDecisionIds.filter(id => id !== decisionId)
    set({
      attachedDecisionIds: updated,
    })

    // Persist to database if session exists
    const sessionId = get().currentSessionId
    if (sessionId && !isTempSessionId(sessionId)) {
      sqliteService.updateChatSessionAttachments(sessionId, updated).catch((error) => {
        console.error('Failed to persist attachment changes:', error)
      })
    }
  },

  setAttachedDecisions: (decisionIds: string[]) => {
    set({
      attachedDecisionIds: decisionIds,
    })

    // Persist to database if session exists
    const sessionId = get().currentSessionId
    if (sessionId && !isTempSessionId(sessionId)) {
      sqliteService.updateChatSessionAttachments(sessionId, decisionIds).catch((error) => {
        console.error('Failed to persist attachment changes:', error)
      })
    }
  },

  saveMessageToDb: async (message: Message, contextDecisionIds: string[] = []) => {
    let sessionId = get().currentSessionId

    // If no session, create a pending one
    if (!sessionId) {
      const attachedIds = get().attachedDecisionIds
      sessionId = get().createPendingSession(attachedIds.length > 0 ? attachedIds : undefined)
    }

    // If session is pending (temp ID), persist it first
    if (isTempSessionId(sessionId)) {
      try {
        sessionId = await get().persistPendingSession(sessionId)

        // VERIFY the session is still current after async operation
        if (get().currentSessionId !== sessionId) {
          console.warn('Session changed during persistence, message may be saved to inactive session:', {
            savedTo: sessionId,
            currentSession: get().currentSessionId
          })
          // Continue saving but log the potential issue
        }
      } catch (error) {
        console.error('Failed to persist pending session:', error)
        return
      }
    }

    // Check if session is being deleted
    if (get().deletingSessions.has(sessionId)) {
      console.warn('Cannot save message: session is being deleted')
      return
    }

    // Don't save tool-input messages to database (they're ephemeral)
    if (message.role === 'tool-input') {
      return
    }

    try {
      const chatMessage: Omit<ChatMessage, 'id'> = {
        session_id: sessionId,
        role: message.role as 'user' | 'assistant' | 'system' | 'tool',
        content: message.content,
        created_at: message.timestamp,
        context_decisions: contextDecisionIds,
      }

      await sqliteService.createChatMessage(chatMessage)

      // Update session's updated_at timestamp
      await sqliteService.updateChatSession(sessionId, {
        updated_at: Date.now(),
      })

      // Debounce refresh to avoid race conditions
      if (get().sessions.length > 0) {
        const currentTimer = get().refreshTimer
        if (currentTimer) clearTimeout(currentTimer)
        const timer = setTimeout(() => {
          get().refreshSessions()
          set({ refreshTimer: null })
        }, 300)
        set({ refreshTimer: timer })
      }
    } catch (error) {
      console.error('Failed to save message to database:', error)
      // Continue silently - message is still in memory
    }
  },

  loadMostRecentSession: async () => {
    set({ isLoading: true, error: null })
    try {
      await get().createNewSession()
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to load most recent session:', error)
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // Session list management
  loadChatSessions: async () => {
    set({ isLoadingSessions: true, sessionsError: null })
    try {
      const sessions = await sqliteService.getChatSessions(50)

      // DEDUPLICATE by ID to prevent duplicate key errors
      const uniqueSessions = Array.from(
        new Map(sessions.map((s: ChatSessionWithMetadata) => [s.id, s])).values()
      )

      set({ sessions: uniqueSessions, isLoadingSessions: false })
    } catch (error) {
      console.error('Failed to load chat sessions:', error)
      set({ sessionsError: (error as Error).message, isLoadingSessions: false })
    }
  },

  refreshSessions: async () => {
    try {
      const sessions = await sqliteService.getChatSessions(50)

      // DEDUPLICATE by ID to prevent duplicate key errors
      const uniqueSessions = Array.from(
        new Map(sessions.map((s: ChatSessionWithMetadata) => [s.id, s])).values()
      )

      set({ sessions: uniqueSessions })
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  },

  deleteSession: async (sessionId: string) => {
    // Check if already deleting
    if (get().deletingSessions.has(sessionId)) return

    // Handle pending sessions (not in database)
    if (isTempSessionId(sessionId)) {
      // Remove from pending sessions
      const pendingSessions = new Set(get().pendingSessions)
      pendingSessions.delete(sessionId)
      set({ pendingSessions })

      // If it's the current session, create a new one
      if (get().currentSessionId === sessionId) {
        set({ messages: [] })
        get().createPendingSession()
      }

      return
    }

    // Mark session as being deleted
    const deletingSessions = new Set(get().deletingSessions)
    deletingSessions.add(sessionId)
    set({ deletingSessions })

    try {
      await sqliteService.deleteChatSession(sessionId)

      // Remove from state
      const sessions = get().sessions.filter((s: ChatSessionWithMetadata) => s.id !== sessionId)
      set({ sessions })

      // If deleting current session, create a new one
      if (get().currentSessionId === sessionId) {
        set({ messages: [] })
        await get().createNewSession()
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      set({ sessionsError: (error as Error).message })
    } finally {
      // Remove from deleting set
      const deletingSessions = new Set(get().deletingSessions)
      deletingSessions.delete(sessionId)
      set({ deletingSessions })
    }
  },

  renameSession: async (sessionId: string, newTitle: string) => {
    try {
      await sqliteService.updateChatSession(sessionId, { title: newTitle })

      // Update in state
      const sessions = get().sessions.map((s: ChatSessionWithMetadata) =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      )
      set({ sessions })
    } catch (error) {
      console.error('Failed to rename session:', error)
      set({ sessionsError: (error as Error).message })
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  generateSessionTitle: async (sessionId: string): Promise<string> => {
    try {
      const messages = await sqliteService.getChatMessages(sessionId)
      const firstUserMessage = messages.find((m: ChatMessage) => m.role === 'user')

      if (firstUserMessage && firstUserMessage.content.trim()) {
        const title = truncateTitle(firstUserMessage.content, 50)

        if (title) {
          await sqliteService.updateChatSession(sessionId, { title })
          await get().refreshSessions()
          return title
        }
      }

      return 'New Chat'
    } catch (error) {
      console.error('Failed to generate session title:', error)
      return 'New Chat'
    }
  },

  // Model management actions
  loadAvailableModels: async () => {
    set({ isLoadingModels: true })
    try {
      const models = await ollamaService.listModels()
      set({ availableModels: models, isLoadingModels: false })
    } catch (error) {
      console.error('Failed to load models:', error)
      set({ isLoadingModels: false })
    }
  },

  setSelectedModel: async (modelName: string) => {
    set({ selectedModel: modelName })

    // Persist to preferences
    try {
      await sqliteService.updateUserPreferences({
        preferred_ollama_model: modelName,
      })
    } catch (error) {
      console.error('Failed to save preferred model:', error)
    }
  },

  downloadModel: async (modelName: string) => {
    try {
      // Add to downloading map
      const downloadingModels = new Map(get().downloadingModels)
      downloadingModels.set(modelName, {
        modelName,
        status: 'downloading',
        completed: 0,
        total: 0,
        startedAt: Date.now(),
      })
      set({ downloadingModels })

      // Stream download progress
      await ollamaService.pullModel(modelName, (progress) => {
        get().updateDownloadProgress(modelName, {
          modelName,
          status: progress.status,
          completed: progress.completed,
          total: progress.total,
          startedAt: get().downloadingModels.get(modelName)!.startedAt,
        })
      })

      // Success - remove from downloading, refresh models
      get().removeDownloadProgress(modelName)
      await get().loadAvailableModels()

      toast.success('Model ready!', {
        description: `${modelName} is now available`,
        action: {
          label: 'Switch to it',
          onClick: () => get().setSelectedModel(modelName),
        },
      })
    } catch (error) {
      get().removeDownloadProgress(modelName)
      toast.error('Download failed', {
        description: (error as Error).message,
        action: {
          label: 'Retry',
          onClick: () => get().downloadModel(modelName),
        },
      })
    }
  },

  updateDownloadProgress: (modelName: string, progress: DownloadProgress) => {
    const downloadingModels = new Map(get().downloadingModels)
    downloadingModels.set(modelName, progress)
    set({ downloadingModels })
  },

  removeDownloadProgress: (modelName: string) => {
    const downloadingModels = new Map(get().downloadingModels)
    downloadingModels.delete(modelName)
    set({ downloadingModels })
  },

  uninstallModel: async (modelName: string) => {
    // Check if already uninstalling
    if (get().uninstallingModels.has(modelName)) {
      console.warn('Model is already being uninstalled:', modelName)
      return
    }

    const selectedModel = get().selectedModel
    const availableModels = get().availableModels

    // Prevent uninstalling the last model
    if (availableModels.length === 1) {
      toast.error('Cannot uninstall last model', {
        description: 'You must have at least one model installed.',
      })
      return
    }

    // Add to uninstalling set
    const uninstallingModels = new Set(get().uninstallingModels)
    uninstallingModels.add(modelName)
    set({ uninstallingModels })

    try {
      // If uninstalling the current model, auto-switch first
      if (selectedModel === modelName) {
        const otherModel = availableModels.find((m) => m.name !== modelName)
        if (otherModel) {
          await get().setSelectedModel(otherModel.name)
          toast.info('Switched model', {
            description: `Now using ${otherModel.name}`,
          })
        }
      }

      // Perform uninstall
      await ollamaService.deleteModel(modelName)

      // Refresh model list
      await get().loadAvailableModels()

      toast.success('Model uninstalled', {
        description: `${modelName} has been removed`,
      })
    } catch (error) {
      console.error('Failed to uninstall model:', error)
      toast.error('Uninstall failed', {
        description: (error as Error).message,
      })
    } finally {
      // Remove from uninstalling set
      const uninstallingModels = new Set(get().uninstallingModels)
      uninstallingModels.delete(modelName)
      set({ uninstallingModels })
    }
  },

  cleanup: () => {
    const timer = get().refreshTimer
    if (timer) {
      clearTimeout(timer)
      set({ refreshTimer: null })
    }
  },
})
