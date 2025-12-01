import { memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Link2, MessageSquare } from 'lucide-react'
import type { ChatSessionWithMetadata } from '@/types/chat'
import { SessionActionsMenu } from './SessionActionsMenu'
import { truncateText } from '@/utils/string-utils'
import { cn } from '@/lib/utils'

interface ChatSessionItemProps {
  session: ChatSessionWithMetadata
  isActive: boolean
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
  onRename: (sessionId: string, newTitle: string) => void
}

export const ChatSessionItem = memo(function ChatSessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ChatSessionItemProps) {
  // Generate display title using utility
  const displayTitle =
    session.title ||
    (session.first_message_preview ? truncateText(session.first_message_preview, 50) : 'New Chat')

  // Format time using date-fns
  const timeAgo = formatDistanceToNow(session.updated_at, { addSuffix: true })

  return (
    <div
      onClick={() => onSelect(session.id)}
      className={cn(
        'group flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-all',
        'border-l-4',
        isActive
          ? 'bg-accent/10 border-primary'
          : 'border-transparent hover:bg-muted/50'
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3
          className={cn(
            'text-sm font-semibold truncate',
            isActive ? 'text-primary' : 'text-foreground'
          )}
        >
          {displayTitle}
        </h3>

        {/* Subtitle - Linked decision or message preview */}
        {session.linked_decision_title && (
          <div className="flex items-center gap-1.5 mt-1">
            <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {session.linked_decision_title}
            </span>
          </div>
        )}

        {/* Metadata - Time and message count */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {session.message_count > 0 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{session.message_count}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions Menu - visible on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <SessionActionsMenu
          sessionId={session.id}
          currentTitle={session.title}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
})
