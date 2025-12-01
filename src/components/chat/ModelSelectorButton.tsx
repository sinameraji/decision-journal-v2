import { ChevronDown, Download } from 'lucide-react'

interface ModelSelectorButtonProps {
  currentModel: string
  downloadingCount: number
  onClick: () => void
}

export function ModelSelectorButton({
  currentModel,
  downloadingCount,
  onClick,
}: ModelSelectorButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
    >
      <span className="text-sm text-muted-foreground">Model:</span>
      <span className="text-sm font-medium text-foreground">{currentModel}</span>

      {downloadingCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-primary">
          <Download className="w-3 h-3 animate-bounce" />
          Downloading {downloadingCount}
        </span>
      )}

      <ChevronDown className="w-4 h-4 text-muted-foreground" />
    </button>
  )
}
