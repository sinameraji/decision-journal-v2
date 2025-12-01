import { useState } from 'react'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog'
import { cn } from '@/lib/utils'

interface SessionActionsMenuProps {
  sessionId: string
  currentTitle: string | null
  onRename: (sessionId: string, newTitle: string) => void
  onDelete: (sessionId: string) => void
}

export function SessionActionsMenu({
  sessionId,
  currentTitle,
  onRename,
  onDelete,
}: SessionActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newTitle, setNewTitle] = useState(currentTitle || '')

  const handleRenameClick = () => {
    setNewTitle(currentTitle || '')
    setShowMenu(false)
    setShowRenameDialog(true)
  }

  const handleDeleteClick = () => {
    setShowMenu(false)
    setShowDeleteDialog(true)
  }

  const handleRenameConfirm = () => {
    if (newTitle.trim()) {
      onRename(sessionId, newTitle.trim())
      setShowRenameDialog(false)
    }
  }

  const handleDeleteConfirm = async () => {
    onDelete(sessionId)
  }

  return (
    <>
      {/* Dropdown trigger */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            'hover:bg-muted text-muted-foreground hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="Session actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-full mt-1 w-40 z-50 bg-card border border-border rounded-md shadow-lg py-1">
              <button
                onClick={handleRenameClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Rename
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="session-title" className="block text-sm font-medium text-foreground mb-2">
                New title
              </label>
              <Input
                id="session-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter chat title"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    handleRenameConfirm()
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={!newTitle.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Chat"
        description={currentTitle || 'this chat session'}
        itemName="chat"
      />
    </>
  )
}
