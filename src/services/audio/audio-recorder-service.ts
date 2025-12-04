import type { AudioRecorderOptions } from '@/types/transcription'

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async startRecording(options?: AudioRecorderOptions): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder with options
      const mimeType = options?.mimeType || this.getSupportedMimeType()
      const audioBitsPerSecond = options?.audioBitsPerSecond || 128000

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond,
      })

      this.audioChunks = []

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // Start recording
      this.mediaRecorder.start()
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw new Error('Failed to start recording. Please check microphone permissions.')
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        this.cleanup()
        reject(new Error('Recording failed'))
      }

      this.mediaRecorder.stop()
    })
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused'
  }

  cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
      this.cleanup()
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return ''
  }

  async convertToWav(audioBlob: Blob): Promise<ArrayBuffer> {
    // Create an audio context
    const audioContext = new AudioContext({ sampleRate: 16000 })

    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer()

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Convert to mono if needed
    const channelData =
      audioBuffer.numberOfChannels === 1
        ? audioBuffer.getChannelData(0)
        : this.convertToMono(audioBuffer)

    // Convert to 16-bit PCM WAV
    const wavBuffer = this.encodeWav(channelData, audioBuffer.sampleRate)

    await audioContext.close()

    return wavBuffer
  }

  private convertToMono(audioBuffer: AudioBuffer): Float32Array {
    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length
    const monoData = new Float32Array(length)

    for (let i = 0; i < length; i++) {
      let sum = 0
      for (let channel = 0; channel < numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i]
      }
      monoData[i] = sum / numberOfChannels
    }

    return monoData
  }

  private encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // Write WAV header
    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    this.writeString(view, 8, 'WAVE')
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // PCM format
    view.setUint16(20, 1, true) // PCM format code
    view.setUint16(22, 1, true) // Mono
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true) // Byte rate
    view.setUint16(32, 2, true) // Block align
    view.setUint16(34, 16, true) // 16-bit
    this.writeString(view, 36, 'data')
    view.setUint32(40, samples.length * 2, true)

    // Write PCM samples
    let offset = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }

    return buffer
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
}

export const audioRecorderService = new AudioRecorderService()
