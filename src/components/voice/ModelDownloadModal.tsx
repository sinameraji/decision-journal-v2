import { useState } from 'react'
import { Download, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { whisperService } from '@/services/transcription/whisper-service'
import type { ModelType } from '@/types/transcription'
import { cn } from '@/lib/utils'

interface ModelDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownloadComplete?: (modelType: ModelType) => void
}

export function ModelDownloadModal({ isOpen, onClose, onDownloadComplete }: ModelDownloadModalProps) {
  const [selectedModel, setSelectedModel] = useState<ModelType>('tiny')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const modelInfo = {
    tiny: whisperService.getModelInfo('tiny'),
    base: whisperService.getModelInfo('base'),
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)

    try {
      await whisperService.downloadModel(selectedModel)
      setDownloadComplete(true)

      // Notify parent and close after a brief delay
      setTimeout(() => {
        onDownloadComplete?.(selectedModel)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download model. Please check your internet connection and try again.')
      setIsDownloading(false)
    }
  }

  const handleClose = () => {
    if (!isDownloading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-lg bg-background border border-border shadow-lg p-6">
        {/* Close button */}
        {!isDownloading && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Download Voice Transcription Model</h2>
          <p className="text-sm text-muted-foreground">
            To use voice input, download a Whisper model. This is a one-time download and works completely offline after installation.
          </p>
        </div>

        {/* Model selection */}
        {!isDownloading && !downloadComplete && (
          <div className="space-y-3 mb-6">
            {/* Tiny model option */}
            <button
              onClick={() => setSelectedModel('tiny')}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-colors",
                selectedModel === 'tiny'
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    selectedModel === 'tiny' ? "border-primary" : "border-muted-foreground"
                  )}>
                    {selectedModel === 'tiny' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold">Tiny Model (Recommended)</h3>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{modelInfo.tiny.size}</span>
              </div>
              <div className="ml-6 space-y-1">
                <p className="text-sm text-muted-foreground">{modelInfo.tiny.accuracy}</p>
                <p className="text-xs text-muted-foreground">{modelInfo.tiny.speed}</p>
              </div>
            </button>

            {/* Base model option */}
            <button
              onClick={() => setSelectedModel('base')}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-colors",
                selectedModel === 'base'
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    selectedModel === 'base' ? "border-primary" : "border-muted-foreground"
                  )}>
                    {selectedModel === 'base' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <h3 className="font-semibold">Base Model</h3>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{modelInfo.base.size}</span>
              </div>
              <div className="ml-6 space-y-1">
                <p className="text-sm text-muted-foreground">{modelInfo.base.accuracy}</p>
                <p className="text-xs text-muted-foreground">{modelInfo.base.speed}</p>
              </div>
            </button>
          </div>
        )}

        {/* Download progress */}
        {isDownloading && !downloadComplete && (
          <div className="mb-6 p-6 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Downloading {selectedModel} model...</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This may take a few minutes depending on your internet connection. Please don't close this window.
            </p>
          </div>
        )}

        {/* Download complete */}
        {downloadComplete && (
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-2">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-600 dark:text-green-400">Download complete!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              Voice transcription is now ready to use.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Download failed</p>
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {!isDownloading && !downloadComplete && (
              <>Model will be stored in your app data directory</>
            )}
          </div>
          <div className="flex gap-2">
            {!isDownloading && !downloadComplete && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
