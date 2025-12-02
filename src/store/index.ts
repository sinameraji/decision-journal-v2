import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDecisionsSlice, type DecisionsSlice } from './decisions-slice'
import { createUISlice, type UISlice } from './ui-slice'
import { createChatSlice, type ChatSlice, type Message } from './chat-slice'
import { createPreferencesSlice, type PreferencesSlice } from './preferences-slice'

// Re-export types for convenience
export type { Message }

// Combined store type
export type Store = DecisionsSlice & UISlice & ChatSlice & PreferencesSlice

// Create the store with all slices
export const useStore = create<Store>()(
  persist(
    (...a) => ({
      ...createDecisionsSlice(...a),
      ...createUISlice(...a),
      ...createChatSlice(...a),
      ...createPreferencesSlice(...a),
    }),
    {
      name: 'decision-journal-storage',
      // Only persist UI preferences, not decisions/chat (those are in SQLite)
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
        selectedModel: state.selectedModel, // Persist selected chat model
        currentSessionId: state.currentSessionId, // Persist current session
      }),
    }
  )
)

// =============================================================================
// Chat Selectors
// =============================================================================

// Chat state selectors
export const useChatMessages = () => useStore((state) => state.messages)
export const useCurrentSessionId = () => useStore((state) => state.currentSessionId)
export const usePendingMessage = () => useStore((state) => state.pendingMessage)
export const useAutoSubmit = () => useStore((state) => state.autoSubmit)
export const useLinkedDecisionId = () => useStore((state) => state.linkedDecisionId)
export const useIsLoading = () => useStore((state) => state.isLoading)
export const useError = () => useStore((state) => state.error)

// Chat sessions selectors
export const useChatSessions = () => useStore((state) => state.sessions)
export const useIsLoadingSessions = () => useStore((state) => state.isLoadingSessions)
export const useSessionsError = () => useStore((state) => state.sessionsError)
export const useSearchQuery = () => useStore((state) => state.searchQuery)
export const useDeletingSessions = () => useStore((state) => state.deletingSessions)

// Model management selectors
export const useSelectedModel = () => useStore((state) => state.selectedModel)
export const useAvailableModels = () => useStore((state) => state.availableModels)
export const useDownloadingModels = () => useStore((state) => state.downloadingModels)
export const useIsLoadingModels = () => useStore((state) => state.isLoadingModels)
export const useUninstallingModels = () => useStore((state) => state.uninstallingModels)

// =============================================================================
// Chat Actions
// =============================================================================

// Message management actions
export const useAddMessage = () => useStore((state) => state.addMessage)
export const useClearMessages = () => useStore((state) => state.clearMessages)
export const useSetPendingMessage = () => useStore((state) => state.setPendingMessage)
export const useClearPendingMessage = () => useStore((state) => state.clearPendingMessage)

// Session management actions
export const useCreateNewSession = () => useStore((state) => state.createNewSession)
export const useLoadMessagesFromSession = () => useStore((state) => state.loadMessagesFromSession)
export const useSetCurrentSessionId = () => useStore((state) => state.setCurrentSessionId)
export const useSetLinkedDecision = () => useStore((state) => state.setLinkedDecision)
export const useSaveMessageToDb = () => useStore((state) => state.saveMessageToDb)
export const useLoadMostRecentSession = () => useStore((state) => state.loadMostRecentSession)
export const useCleanupPendingSessions = () => useStore((state) => state.cleanupPendingSessions)
export const useIsPendingSession = () => useStore((state) => state.isPendingSession)
export const usePersistPendingSession = () => useStore((state) => state.persistPendingSession)

// Chat sessions actions
export const useLoadChatSessions = () => useStore((state) => state.loadChatSessions)
export const useRefreshSessions = () => useStore((state) => state.refreshSessions)
export const useDeleteSession = () => useStore((state) => state.deleteSession)
export const useRenameSession = () => useStore((state) => state.renameSession)
export const useSetSearchQuery = () => useStore((state) => state.setSearchQuery)
export const useGenerateSessionTitle = () => useStore((state) => state.generateSessionTitle)

// Model management actions
export const useLoadAvailableModels = () => useStore((state) => state.loadAvailableModels)
export const useSetSelectedModel = () => useStore((state) => state.setSelectedModel)
export const useDownloadModel = () => useStore((state) => state.downloadModel)
export const useUpdateDownloadProgress = () => useStore((state) => state.updateDownloadProgress)
export const useRemoveDownloadProgress = () => useStore((state) => state.removeDownloadProgress)
export const useUninstallModel = () => useStore((state) => state.uninstallModel)

// Cleanup actions
export const useCleanup = () => useStore((state) => state.cleanup)

// =============================================================================
// Preferences Selectors
// =============================================================================

export const useOnboardingCompleted = () => useStore((state) => state.onboardingCompleted)
export const useMicrophonePermission = () => useStore((state) => state.microphonePermission)
export const useMicrophoneAvailable = () => useStore((state) => state.microphoneAvailable)
export const useShowVoiceTooltips = () => useStore((state) => state.showVoiceTooltips)
export const useIsLoadingPreferences = () => useStore((state) => state.isLoadingPreferences)
export const usePreferredOllamaModel = () => useStore((state) => state.preferredOllamaModel)
export const useOllamaSetupCompleted = () => useStore((state) => state.ollamaSetupCompleted)
export const useNotificationPermission = () => useStore((state) => state.notificationPermission)
export const usePreferencesLoadedFromDatabase = () => useStore((state) => state.preferencesLoadedFromDatabase)
export const useFontSize = () => useStore((state) => state.fontSize)

// =============================================================================
// Preferences Actions
// =============================================================================

export const useLoadPreferences = () => useStore((state) => state.loadPreferences)
export const useSetOnboardingCompleted = () => useStore((state) => state.setOnboardingCompleted)
export const useUpdateMicrophonePermission = () => useStore((state) => state.updateMicrophonePermission)
export const useCheckMicrophonePermission = () => useStore((state) => state.checkMicrophonePermission)
export const useDismissVoiceTooltips = () => useStore((state) => state.dismissVoiceTooltips)
export const useSetOllamaSetupCompleted = () => useStore((state) => state.setOllamaSetupCompleted)
export const useCheckOllamaStatus = () => useStore((state) => state.checkOllamaStatus)
export const useUpdateFontSize = () => useStore((state) => state.updateFontSize)

// =============================================================================
// UI Actions
// =============================================================================

export const useSetFontSize = () => useStore((state) => state.setFontSize)
export const useIncreaseFontSize = () => useStore((state) => state.increaseFontSize)
export const useDecreaseFontSize = () => useStore((state) => state.decreaseFontSize)
