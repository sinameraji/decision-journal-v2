import { memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'
import type { ChatSessionWithMetadata } from '@/types/chat'
import { truncateText } from '@/utils/string-utils'
import { cn } from '@/lib/utils'

interface ChatSessionItemProps {
  session: ChatSessionWithMetadata
  isActive: boolean
  onSelect: (sessionId: string) => void
}

export const ChatSessionItem = memo(function ChatSessionItem({
  session,
  isActive,
  onSelect,
}: ChatSessionItemProps) {
  // Generate display title using utility
  const displayTitle =
    session.title ||
    (session.first_message_preview ? truncateText(session.first_message_preview, 50) : 'New Chat')

  // Format time using date-fns
  const timeAgo = formatDistanceToNow(session.updated_at, { addSuffix: true })

  return (
    <button
      onClick={() => onSelect(session.id)}
      className={cn(
        'w-full text-left p-3 rounded-xl transition-colors group',
        isActive ? 'bg-muted border border-border' : 'hover:bg-muted/50'
      )}
    >
      {/* Title */}
      <p className="font-medium text-foreground text-sm truncate">{displayTitle}</p>

      {/* Metadata Row */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        {session.message_count > 0 && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {session.message_count}
            </span>
          </>
        )}
      </div>
    </button>
  )
})
