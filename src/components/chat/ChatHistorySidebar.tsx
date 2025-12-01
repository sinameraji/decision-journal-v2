import { useEffect } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import {
  useChatSessions,
  useIsLoadingSessions,
  useCurrentSessionId,
  useLoadChatSessions,
  useDeleteSession,
  useRenameSession,
  useLoadMessagesFromSession,
  useCreateNewSession,
  useClearMessages,
} from '@/store'
import { ChatSessionItem } from './ChatSessionItem'
import { Button } from '@/components/ui/button'

export function ChatHistorySidebar() {
  const sessions = useChatSessions()
  const isLoadingSessions = useIsLoadingSessions()
  const currentSessionId = useCurrentSessionId()

  const loadChatSessions = useLoadChatSessions()
  const deleteSession = useDeleteSession()
  const renameSession = useRenameSession()
  const loadMessagesFromSession = useLoadMessagesFromSession()
  const createNewSession = useCreateNewSession()
  const clearMessages = useClearMessages()

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
  }, [loadChatSessions])

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) return // Already active

    await loadMessagesFromSession(sessionId)
    // Scroll to top of chat area
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNewChat = async () => {
    clearMessages()
    await createNewSession()
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-1 px-3 py-2">
        {isLoadingSessions ? (
          // Loading state
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading chats...</div>
          </div>
        ) : sessions.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-foreground">No chat sessions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start a new conversation</p>
          </div>
        ) : (
          // Sessions list
          sessions.map((session) => (
            <ChatSessionItem
              key={session.id}
              session={session}
              isActive={session.id === currentSessionId}
              onSelect={handleSelectSession}
              onDelete={deleteSession}
              onRename={renameSession}
            />
          ))
        )}
      </div>

      {/* New Chat button */}
      <div className="p-3 border-t border-border">
        <Button onClick={handleNewChat} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  )
}
