import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModelListItem } from './ModelListItem'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AlertCircle, ExternalLink, Bot, X } from 'lucide-react'
import {
  useAvailableModels,
  useDownloadingModels,
  useIsLoadingModels,
  useLoadAvailableModels,
  useDownloadModel,
  useUninstallingModels,
  useUninstallModel,
} from '@/store'
import { RECOMMENDED_MODELS } from '@/constants/ollama-models'
import { ollamaService } from '@/services/llm/ollama-service'
import { isTauri } from '@/utils/platform'

interface ModelSelectorModalProps {
  open: boolean
  onClose: () => void
  currentModel: string
  onModelSelect: (modelName: string) => void
}

export function ModelSelectorModal({
  open,
  onClose,
  currentModel,
  onModelSelect,
}: ModelSelectorModalProps) {
  const availableModels = useAvailableModels()
  const downloadingModels = useDownloadingModels()
  const isLoadingModels = useIsLoadingModels()
  const loadAvailableModels = useLoadAvailableModels()
  const downloadModel = useDownloadModel()
  const uninstallingModels = useUninstallingModels()
  const uninstallModel = useUninstallModel()

  const [customModelName, setCustomModelName] = useState('')
  const [ollamaRunning, setOllamaRunning] = useState(true)
  const [modelToUninstall, setModelToUninstall] = useState<string | null>(null)

  // Load models when modal opens
  useEffect(() => {
    if (open) {
      checkOllamaAndLoadModels()
    }
  }, [open])

  const checkOllamaAndLoadModels = async () => {
    const running = await ollamaService.isRunning()
    setOllamaRunning(running)

    if (running) {
      await loadAvailableModels()
    }
  }

  const handleDownload = (modelName: string) => {
    downloadModel(modelName)
  }

  const handleCustomDownload = () => {
    if (customModelName.trim()) {
      downloadModel(customModelName.trim())
      setCustomModelName('')
    }
  }

  const handleUninstall = async (modelName: string) => {
    await uninstallModel(modelName)
    setModelToUninstall(null)
  }

  const openOllamaLibrary = async () => {
    const url = 'https://ollama.com/library'
    if (isTauri()) {
      try {
        const { open } = await import('@tauri-apps/plugin-shell')
        await open(url)
      } catch (err) {
        window.open(url, '_blank')
      }
    } else {
      window.open(url, '_blank')
    }
  }

  // Filter out installed models from recommendations
  const installedModelNames = new Set(availableModels.map((m) => m.name))
  const downloadableModels = RECOMMENDED_MODELS.filter(
    (m) => !installedModelNames.has(m.name) && !downloadingModels.has(m.name)
  )

  // Get downloading models as array
  const downloadingArray = Array.from(downloadingModels.entries())

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-background rounded-2xl shadow-2xl border border-border max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Bot className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-foreground">Select AI Model</h2>
              <p className="text-sm text-muted-foreground">Choose a model for your conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Ollama not running warning */}
          {!ollamaRunning && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Ollama not running</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start Ollama to download and use models.
                </p>
              </div>
            </div>
          )}

          {/* Installed Models Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Installed Models
            </h3>

            {isLoadingModels ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading models...
              </div>
            ) : availableModels.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No models installed yet. Download one below.
              </div>
            ) : (
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <ModelListItem
                    key={model.name}
                    model={model}
                    isInstalled
                    isSelected={model.name === currentModel}
                    isUninstalling={uninstallingModels.has(model.name)}
                    onSelect={() => {
                      onModelSelect(model.name)
                      onClose()
                    }}
                    onUninstall={() => setModelToUninstall(model.name)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Downloading Section */}
          {downloadingArray.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Downloading
              </h3>
              <div className="space-y-2">
                {downloadingArray.map(([modelName, progress]) => {
                  const modelInfo = RECOMMENDED_MODELS.find((m) => m.name === modelName)
                  return (
                    <ModelListItem
                      key={modelName}
                      model={
                        modelInfo || {
                          name: modelName,
                          size: 0,
                          displayName: modelName,
                          description: '',
                          tags: [],
                        }
                      }
                      isDownloading
                      progress={progress}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Available to Download Section */}
          {downloadableModels.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Available to Download
              </h3>
              <div className="space-y-2">
                {downloadableModels.map((model) => (
                  <ModelListItem
                    key={model.name}
                    model={model}
                    onDownload={() => handleDownload(model.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Model Input */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Download Custom Model
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Enter model name (e.g., llama3:8b)"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomDownload()}
                  disabled={!ollamaRunning}
                  className="pr-10"
                />
              </div>
              <Button
                onClick={handleCustomDownload}
                disabled={!customModelName.trim() || !ollamaRunning}
                className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                Download
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Enter any Ollama-compatible model name to download.{' '}
              <button
                onClick={openOllamaLibrary}
                className="inline-flex items-center gap-1 text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Browse Ollama Model Library
                <ExternalLink className="w-3 h-3" />
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            All models run locally on your device. Your conversations remain private.
          </p>
        </div>
      </div>

      {/* Uninstall Confirmation Dialog */}
      <ConfirmDialog
        open={modelToUninstall !== null}
        onOpenChange={(open) => !open && setModelToUninstall(null)}
        title="Uninstall Model?"
        description={
          modelToUninstall === currentModel
            ? `You are uninstalling the currently selected model "${modelToUninstall}". The app will automatically switch to another model first.`
            : `Are you sure you want to uninstall "${modelToUninstall}"? This will remove the model from your system.`
        }
        confirmText="Uninstall"
        cancelText="Cancel"
        onConfirm={() => modelToUninstall && handleUninstall(modelToUninstall)}
        variant="destructive"
      />
    </div>
  )
}
