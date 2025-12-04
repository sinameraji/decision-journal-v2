export type ModelType = 'tiny' | 'base'

export interface ModelStatus {
  modelType: ModelType | null
  isDownloaded: boolean
  modelPath: string | null
  modelSizeMb: number | null
}

export interface TranscriptionResult {
  text: string
  success: boolean
}

export interface AudioRecorderOptions {
  mimeType?: string
  audioBitsPerSecond?: number
}

export interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioBlob: Blob | null
}
