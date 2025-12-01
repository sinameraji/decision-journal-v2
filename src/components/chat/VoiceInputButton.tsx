import { useState, useEffect } from 'react'
import { Mic, Square, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceInputButtonProps {
  onTranscript?: (text: string) => void
  className?: string
  size?: 'sm' | 'md'
}

export function VoiceInputButton({
  onTranscript,
  className,
  size = 'md',
}: VoiceInputButtonProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'confirming'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)

  // Simulate recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state === 'recording') {
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
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMicClick = () => {
    if (state === 'idle') {
      setState('recording')
    }
  }

  const handleStop = () => {
    setState('confirming')
  }

  const handleAccept = () => {
    // Simulate transcript - in real app this would come from speech recognition
    onTranscript?.('Transcribed voice input would appear here')
    setState('idle')
  }

  const handleDiscard = () => {
    setState('idle')
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5'

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={handleMicClick}
        className={cn(
          'text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted',
          buttonSize,
          className
        )}
        title="Start voice input"
      >
        <Mic className={iconSize} />
      </button>
    )
  }

  if (state === 'recording') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Recording indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-950 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-xs font-mono text-red-600 dark:text-red-400">
            {formatTime(recordingTime)}
          </span>
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

  // Confirming state
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={handleAccept}
        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
        title="Accept transcript"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={handleDiscard}
        className="p-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-colors border border-border"
        title="Discard"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
