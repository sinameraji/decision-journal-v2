import { type DownloadProgress } from '@/store/chat-slice'
import { ollamaService } from '@/services/llm/ollama-service'

interface ModelDownloadProgressProps {
  progress: DownloadProgress
}

export function ModelDownloadProgress({ progress }: ModelDownloadProgressProps) {
  const percentage =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground capitalize">{progress.status}</span>
        <span className="text-foreground font-medium">{percentage}%</span>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {progress.total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {ollamaService.formatSize(progress.completed)} /{' '}
            {ollamaService.formatSize(progress.total)}
          </span>
        </div>
      )}
    </div>
  )
}
