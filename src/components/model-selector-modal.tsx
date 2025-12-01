"use client"

import { useState } from "react"
import { X, Download, Check, Bot, Loader2, Mic, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InstalledModel {
  id: string
  name: string
  size: string
  family: string
}

interface AvailableModel {
  id: string
  name: string
  size: string
  description: string
}

interface ModelSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedModel: string
  onSelectModel: (modelId: string) => void
}

const installedModels: InstalledModel[] = [
  { id: "deepseek-r1:latest", name: "deepseek-r1:latest", size: "4.9 GB", family: "qwen3" },
  { id: "gemma3:1b", name: "gemma3:1b", size: "777.5 MB", family: "gemma3" },
]

const availableModels: AvailableModel[] = [
  { id: "llama-3.2-1b", name: "Llama 3.2 (1B)", size: "1.3 GB", description: "Smaller, faster Meta model" },
  { id: "llama-3.2-3b", name: "Llama 3.2 (3B)", size: "2.0 GB", description: "Balanced performance and speed" },
  { id: "phi-3-mini", name: "Phi-3 Mini", size: "2.3 GB", description: "Microsoft's efficient AI" },
  { id: "qwen-2.5-7b", name: "Qwen 2.5 (7B)", size: "4.7 GB", description: "Strong reasoning, multilingual" },
]

export function ModelSelectorModal({ isOpen, onClose, selectedModel, onSelectModel }: ModelSelectorModalProps) {
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
  const [customModelName, setCustomModelName] = useState("")

  if (!isOpen) return null

  const handleSelectModel = (modelId: string) => {
    onSelectModel(modelId)
  }

  const handleDownload = (modelId: string) => {
    setDownloadingModels((prev) => new Set([...prev, modelId]))
    // Simulate download - in real app this would trigger actual download
    setTimeout(() => {
      setDownloadingModels((prev) => {
        const next = new Set(prev)
        next.delete(modelId)
        return next
      })
    }, 3000)
  }

  const handleCustomDownload = () => {
    if (customModelName.trim()) {
      handleDownload(customModelName)
      setCustomModelName("")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
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
          {/* Installed Models */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Installed Models
            </h3>
            <div className="space-y-2">
              {installedModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    selectedModel === model.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedModel === model.id
                        ? "border-primary-foreground bg-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedModel === model.id && <Check className="w-3 h-3 text-primary" />}
                  </div>

                  {/* Model info */}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{model.name}</p>
                    <p
                      className={`text-sm ${selectedModel === model.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {model.size} · {model.family}
                    </p>
                  </div>

                  {/* Current indicator */}
                  {selectedModel === model.id && (
                    <span className="text-xs font-medium bg-primary-foreground/20 px-2.5 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Available to Download */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Available to Download
            </h3>
            <div className="space-y-2">
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                  {/* Model info */}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{model.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {model.size} · {model.description}
                    </p>
                  </div>

                  {/* Download button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(model.id)}
                    disabled={downloadingModels.has(model.id)}
                    className="flex items-center gap-2 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {downloadingModels.has(model.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Download Custom Model */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Download Custom Model
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  placeholder="Enter model name (e.g., llama3:8b)"
                  className="w-full px-4 py-3 pr-10 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCustomDownload()
                  }}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={handleCustomDownload}
                disabled={!customModelName.trim()}
                className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                Download
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Enter any Ollama-compatible model name to download.{" "}
              <a
                href="https://ollama.com/library"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Browse Ollama Model Library
                <ExternalLink className="w-3 h-3" />
              </a>
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
    </div>
  )
}
