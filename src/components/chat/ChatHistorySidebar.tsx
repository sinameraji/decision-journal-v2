import { useEffect } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import {
  useChatSessions,
  useIsLoadingSessions,
  useCurrentSessionId,
  useLoadChatSessions,
  useLoadMessagesFromSession,
  useCreateNewSession,
  useClearMessages,
  useRefreshSessions,
} from '@/store'
import { ChatSessionItem } from './ChatSessionItem'

export function ChatHistorySidebar() {
  const sessions = useChatSessions()
  const isLoadingSessions = useIsLoadingSessions()
  const currentSessionId = useCurrentSessionId()

  const loadChatSessions = useLoadChatSessions()
  const loadMessagesFromSession = useLoadMessagesFromSession()
  const createNewSession = useCreateNewSession()
  const clearMessages = useClearMessages()
  const refreshSessions = useRefreshSessions()

  // Load sessions on mount with error handling
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const load = async () => {
      try {
        await loadChatSessions()
      } catch (error) {
        console.error('Failed to load chat sessions:', error)
        // Optionally show toast notification
      } finally {
        clearTimeout(timeout)
      }
    }

    load()

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) return // Already active

    await loadMessagesFromSession(sessionId)
    // Scroll to top of chat area
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNewChat = async () => {
    clearMessages()
    await createNewSession()
    // Refresh sessions list to show the new session
    await refreshSessions()
  }

  return (
    <div className="w-56 flex-shrink-0">
      {isLoadingSessions ? (
        // Loading state
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Loading chats...</div>
        </div>
      ) : sessions.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-foreground">No chat sessions yet</p>
          <p className="text-xs text-muted-foreground mt-1">Start a new conversation</p>
        </div>
      ) : (
        // Sessions list
        <div className="space-y-1">
          {sessions.map((session) => (
            <ChatSessionItem
              key={session.id}
              session={session}
              isActive={session.id === currentSessionId}
              onSelect={handleSelectSession}
            />
          ))}
        </div>
      )}

      {/* New Chat button - inline at bottom */}
      <button
        onClick={handleNewChat}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium">New Chat</span>
      </button>
    </div>
  )
}
