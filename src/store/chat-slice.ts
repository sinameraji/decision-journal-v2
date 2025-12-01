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

// Simplified message interface for in-memory state
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
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
  linkedDecisionId: string | null
  isLoading: boolean
  error: string | null
  sessions: ChatSessionWithMetadata[]
  isLoadingSessions: boolean
  sessionsError: string | null
  searchQuery: string
  refreshTimer: NodeJS.Timeout | null
  deletingSessions: Set<string>
  // Model management
  selectedModel: string | null
  availableModels: OllamaModel[]
  downloadingModels: Map<string, DownloadProgress>
  isLoadingModels: boolean

  // Actions
  // Message management
  addMessage: (message: Message) => void
  clearMessages: () => void

  // Pending message for auto-submission
  setPendingMessage: (message: string, autoSubmit: boolean, decisionId?: string) => void
  clearPendingMessage: () => void

  // Session management
  createNewSession: (decisionId?: string) => Promise<string>
  loadMessagesFromSession: (sessionId: string) => Promise<void>
  setCurrentSessionId: (sessionId: string | null) => void
  setLinkedDecision: (decisionId: string | null) => void

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
  linkedDecisionId: null as string | null,
  isLoading: false,
  error: null as string | null,
  sessions: [] as ChatSessionWithMetadata[],
  isLoadingSessions: false,
  sessionsError: null as string | null,
  searchQuery: '',
  refreshTimer: null as NodeJS.Timeout | null,
  deletingSessions: new Set<string>(),
  // Model management state
  selectedModel: null as string | null,
  availableModels: [] as OllamaModel[],
  downloadingModels: new Map<string, DownloadProgress>(),
  isLoadingModels: false,

  // Actions
  addMessage: (message: Message) => {
    const messages = [...get().messages, message]
    set({ messages })
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  setPendingMessage: (message: string, autoSubmit: boolean, decisionId?: string) => {
    set({
      pendingMessage: message,
      autoSubmit,
      linkedDecisionId: decisionId || null,
    })
  },

  clearPendingMessage: () => {
    set({
      pendingMessage: null,
      autoSubmit: false,
    })
  },

  createNewSession: async (decisionId?: string): Promise<string> => {
    try {
      const now = Date.now()
      const session: Omit<ChatSession, 'id'> = {
        decision_id: decisionId || null,
        created_at: now,
        updated_at: now,
        trigger_type: decisionId ? 'manual' : 'manual',
        title: null,
      }

      const createdSession = await sqliteService.createChatSession(session)
      set({ currentSessionId: createdSession.id, linkedDecisionId: decisionId || null })
      return createdSession.id
    } catch (error) {
      console.error('Failed to create chat session:', error)
      // Generate a fallback ID if database fails
      const fallbackId = `session-${Date.now()}`
      set({ currentSessionId: fallbackId, linkedDecisionId: decisionId || null })
      return fallbackId
    }
  },

  loadMessagesFromSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const chatMessages = await sqliteService.getChatMessages(sessionId)

      // Convert ChatMessage[] to Message[]
      const messages: Message[] = chatMessages.map((msg: ChatMessage) => ({
        id: msg.id,
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
        timestamp: msg.created_at,
      }))

      set({ messages, currentSessionId: sessionId, isLoading: false })
    } catch (error) {
      console.error('Failed to load messages:', error)
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  setCurrentSessionId: (sessionId: string | null) => {
    set({ currentSessionId: sessionId })
  },

  setLinkedDecision: (decisionId: string | null) => {
    set({ linkedDecisionId: decisionId })
  },

  saveMessageToDb: async (message: Message, contextDecisionIds: string[] = []) => {
    const sessionId = get().currentSessionId

    // Create session if it doesn't exist
    if (!sessionId) {
      const linkedId = get().linkedDecisionId
      const newSessionId = await get().createNewSession(linkedId || undefined)
      if (!newSessionId) {
        console.error('Failed to create session for saving message')
        return
      }
    }

    const currentSession = get().currentSessionId
    if (!currentSession) return

    // Check if session is being deleted
    if (get().deletingSessions.has(currentSession)) {
      console.warn('Cannot save message: session is being deleted')
      return
    }

    try {
      const chatMessage: Omit<ChatMessage, 'id'> = {
        session_id: currentSession,
        role: message.role,
        content: message.content,
        created_at: message.timestamp,
        context_decisions: contextDecisionIds,
      }

      await sqliteService.createChatMessage(chatMessage)

      // Update session's updated_at timestamp
      await sqliteService.updateChatSession(currentSession, {
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
})
