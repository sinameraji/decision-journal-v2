"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Mic, Square, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const [isRecording, setIsRecording] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
    setRecordingInterval(interval)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recordingInterval) {
      clearInterval(recordingInterval)
      setRecordingInterval(null)
    }
    setIsConfirming(true)
  }

  const acceptRecording = () => {
    setIsConfirming(false)
    setSearchQuery("visa")
  }

  const discardRecording = () => {
    setIsConfirming(false)
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <header className="h-14 border-b border-border flex items-center px-6 bg-card/50">
      <div className="max-w-xl w-full mx-auto">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Search your decisions..."}
              className={`pl-10 h-9 bg-background/50 border-border/50 focus:bg-background font-sans text-sm transition-all ${
                isRecording
                  ? "pr-24 border-red-400 dark:border-red-500"
                  : isConfirming
                    ? "pr-20"
                    : searchQuery
                      ? "pr-16"
                      : "pr-10"
              }`}
            />

            {/* Recording state */}
            {isRecording && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium tabular-nums">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-1 rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              </div>
            )}

            {/* Confirming state */}
            {isConfirming && !isRecording && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={acceptRecording}
                  className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                  title="Accept"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={discardRecording}
                  className="p-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  title="Discard"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {!isRecording && !isConfirming && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </header>
  )
}
