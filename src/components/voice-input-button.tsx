"use client"

import { useState, useEffect } from "react"
import { Mic, Square, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { audioRecorderService } from "@/services/audio/audio-recorder-service"
import { whisperService } from "@/services/transcription/whisper-service"
import { isDesktop } from "@/utils/platform"

interface VoiceInputButtonProps {
  onTranscript?: (text: string) => void
  onModelDownloadRequired?: () => void
  className?: string
  size?: "sm" | "md"
}

export function VoiceInputButton({
  onTranscript,
  onModelDownloadRequired,
  className,
  size = "md"
}: VoiceInputButtonProps) {
  const [state, setState] = useState<"idle" | "recording" | "processing" | "success">("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state === "recording") {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [state])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMicClick = async () => {
    if (!isDesktop()) {
      setError("Voice transcription is only available in the desktop app")
      return
    }

    try {
      // Check if model is downloaded
      const modelAvailable = await whisperService.checkModelAvailability()

      if (!modelAvailable) {
        // Trigger model download modal
        onModelDownloadRequired?.()
        return
      }

      // Start recording
      setState("recording")
      await audioRecorderService.startRecording()
    } catch (err) {
      console.error("Failed to start recording:", err)
      setError("Failed to start recording. Please check microphone permissions.")
      setState("idle")
    }
  }

  const handleStop = async () => {
    try {
      setState("processing")

      // Stop recording and get audio blob
      const blob = await audioRecorderService.stopRecording()

      // Transcribe audio
      const result = await whisperService.transcribeAudio(blob)

      if (result.success && result.text) {
        // Insert immediately into input field
        onTranscript?.(result.text)

        // Show success indicator briefly
        setState("success")

        // Auto-dismiss after 1.5 seconds
        setTimeout(() => {
          cleanup()
        }, 1500)
      } else {
        setError("Transcription failed. Please try again.")
        setState("idle")
      }
    } catch (err) {
      console.error("Failed to process audio:", err)
      setError("Failed to process audio. Please try again.")
      setState("idle")
    }
  }

  const cleanup = () => {
    setError(null)
    setState("idle")
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const buttonSize = size === "sm" ? "p-1" : "p-1.5"

  // Show error if any
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (state === "idle") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleMicClick}
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted",
            buttonSize,
            className,
          )}
          title="Start voice input"
        >
          <Mic className={iconSize} />
        </button>
        {error && (
          <div className="absolute top-full mt-2 right-0 z-50 w-64 px-3 py-2 text-xs bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
      </div>
    )
  }

  if (state === "recording") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {/* Recording indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-950 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs font-mono text-red-600 dark:text-red-400">{formatTime(recordingTime)}</span>
        </div>
        {/* Stop button */}
        <button
          type="button"
          onClick={handleStop}
          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          title="Stop recording"
        >
          <Square className="h-3 w-3 fill-current" />
        </button>
      </div>
    )
  }

  if (state === "processing") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-950 rounded-full">
          <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-600 dark:text-blue-400">Transcribing...</span>
        </div>
      </div>
    )
  }

  // Success state - text inserted into field
  if (state === "success") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-950 rounded-full">
          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-600 dark:text-green-400">Inserted</span>
        </div>
      </div>
    )
  }

  return null
}
