import { Button } from '@/components/ui/button'
import { Check, Download, Trash2, Loader2 } from 'lucide-react'
import { ollamaService } from '@/services/llm/ollama-service'
import { ModelDownloadProgress } from './ModelDownloadProgress'
import { type DownloadProgress } from '@/store/chat-slice'
import { type ModelInfo } from '@/constants/ollama-models'
import { type OllamaModel } from '@/services/llm/ollama-service'

interface ModelListItemProps {
  model: ModelInfo | OllamaModel
  isInstalled?: boolean
  isSelected?: boolean
  isDownloading?: boolean
  isUninstalling?: boolean
  progress?: DownloadProgress
  onSelect?: () => void
  onDownload?: () => void
  onUninstall?: () => void
}

export function ModelListItem({
  model,
  isInstalled = false,
  isSelected = false,
  isDownloading = false,
  isUninstalling = false,
  progress,
  onSelect,
  onDownload,
  onUninstall,
}: ModelListItemProps) {
  // Extract common fields - determine if it's ModelInfo or OllamaModel
  const isModelInfo = 'displayName' in model
  const displayName = isModelInfo ? model.displayName : model.name
  const size = model.size
  const description = isModelInfo ? model.description : model.details?.family || ''

  // For installed models, use v0 button-style with full card selection
  if (isInstalled) {
    return (
      <div
        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
          isSelected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-card border-border hover:border-primary/50 text-foreground'
        }`}
      >
        {/* Radio button - clickable */}
        <button
          onClick={onSelect}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected
              ? 'border-primary-foreground bg-primary-foreground'
              : 'border-muted-foreground'
          }`}
          disabled={isUninstalling}
        >
          {isSelected && <Check className="w-3 h-3 text-primary" />}
        </button>

        {/* Model info - clickable */}
        <button onClick={onSelect} className="flex-1 text-left" disabled={isUninstalling}>
          <p className="font-medium">{displayName}</p>
          <p
            className={`text-sm ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
          >
            {ollamaService.formatSize(size)}
            {description && ` • ${description}`}
          </p>
        </button>

        {/* Current indicator */}
        {isSelected && !isUninstalling && (
          <span className="text-xs font-medium bg-primary-foreground/20 px-2.5 py-1 rounded-full">
            Current
          </span>
        )}

        {/* Uninstall button */}
        {onUninstall && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onUninstall()
            }}
            disabled={isUninstalling}
            className={`p-2 h-auto hover:bg-destructive/10 hover:text-destructive ${
              isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'
            }`}
            title="Uninstall model"
          >
            {isUninstalling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
    )
  }

  // For downloadable models or downloading, use card style
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
      {/* Model info */}
      <div className="flex-1">
        <p className="font-medium text-foreground">{displayName}</p>
        <p className="text-sm text-muted-foreground">
          {ollamaService.formatSize(size)}
          {description && ` • ${description}`}
        </p>

        {/* Download progress */}
        {isDownloading && progress && (
          <div className="mt-2">
            <ModelDownloadProgress progress={progress} />
          </div>
        )}
      </div>

      {/* Download button */}
      {!isDownloading && onDownload && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="flex items-center gap-2 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </Button>
      )}
    </div>
  )
}
