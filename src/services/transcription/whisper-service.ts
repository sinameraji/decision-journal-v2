import { invoke } from '@tauri-apps/api/core'
import type { ModelStatus, ModelType, TranscriptionResult } from '@/types/transcription'
import { audioRecorderService } from '@/services/audio/audio-recorder-service'

export class WhisperService {
  async getModelStatus(): Promise<ModelStatus> {
    try {
      const status = await invoke<ModelStatus>('get_model_status')
      return status
    } catch (error) {
      console.error('Failed to get model status:', error)
      throw error
    }
  }

  async downloadModel(modelType: ModelType): Promise<string> {
    try {
      const result = await invoke<string>('download_whisper_model', { modelType })
      return result
    } catch (error) {
      console.error('Failed to download model:', error)
      throw error
    }
  }

  async deleteModel(modelType: ModelType): Promise<string> {
    try {
      const result = await invoke<string>('delete_whisper_model', { modelType })
      return result
    } catch (error) {
      console.error('Failed to delete model:', error)
      throw error
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      // Convert to WAV format (16-bit PCM, 16kHz, mono)
      const wavBuffer = await audioRecorderService.convertToWav(audioBlob)

      // Convert ArrayBuffer to array of bytes
      const audioData = Array.from(new Uint8Array(wavBuffer))

      // Call Rust backend
      const result = await invoke<TranscriptionResult>('transcribe_audio', {
        audioData,
      })

      return result
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
      throw error
    }
  }

  async recordAndTranscribe(): Promise<string> {
    try {
      // Start recording
      await audioRecorderService.startRecording()

      // Wait for user to stop (this is handled by the UI)
      // The actual stop is called from the component

      throw new Error('Use startRecording and stopRecording separately')
    } catch (error) {
      console.error('Recording and transcription failed:', error)
      throw error
    }
  }

  async checkModelAvailability(): Promise<boolean> {
    try {
      const status = await this.getModelStatus()
      return status.isDownloaded
    } catch (error) {
      console.error('Failed to check model availability:', error)
      return false
    }
  }

  getModelInfo(modelType: ModelType): { size: string; speed: string; accuracy: string } {
    const modelInfo = {
      tiny: {
        size: '~75 MB',
        speed: '32x faster than large',
        accuracy: 'Good for clear audio',
      },
      base: {
        size: '~142 MB',
        speed: '16x faster than large',
        accuracy: 'Better accuracy',
      },
    }

    return modelInfo[modelType]
  }
}

export const whisperService = new WhisperService()
