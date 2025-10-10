/**
 * MicMock utility for testing voice recording without real microphone permissions
 * Creates a synthetic WAV blob that can be injected into recorder paths
 */

export class MicMock {
  /**
   * Creates a 10-second WAV audio blob for testing
   * @param durationSeconds Duration of the audio blob (default: 10)
   * @param sampleRate Sample rate in Hz (default: 44100)
   * @returns A Blob containing WAV audio data
   */
  static createWAVBlob(durationSeconds: number = 10, sampleRate: number = 44100): Blob {
    const numChannels = 1
    const bytesPerSample = 2
    const numSamples = sampleRate * durationSeconds
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = numSamples * blockAlign
    const bufferSize = 44 + dataSize

    const buffer = new ArrayBuffer(bufferSize)
    const view = new DataView(buffer)

    // WAV header
    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    this.writeString(view, 8, 'WAVE')

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, 1, true) // audio format (1 = PCM)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true) // bits per sample

    // data sub-chunk
    this.writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    // Generate sine wave audio data (440Hz tone)
    const frequency = 440
    let offset = 44
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate)
      const value = Math.floor(sample * 32767) // Convert to 16-bit PCM
      view.setInt16(offset, value, true)
      offset += 2
    }

    return new Blob([buffer], { type: 'audio/wav' })
  }

  /**
   * Creates a base64-encoded WAV audio string for testing
   */
  static async createBase64WAV(durationSeconds: number = 10): Promise<string> {
    const blob = this.createWAVBlob(durationSeconds)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Mocks MediaRecorder for testing environments
   */
  static mockMediaRecorder(window: Window) {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'test') {
      return
    }

    class MockMediaRecorder {
      state: 'inactive' | 'recording' | 'paused' = 'inactive'
      ondataavailable: ((event: any) => void) | null = null
      onstop: (() => void) | null = null
      private chunks: Blob[] = []

      constructor(stream: MediaStream, options?: any) {}

      start() {
        this.state = 'recording'
        setTimeout(() => {
          const blob = MicMock.createWAVBlob(10)
          this.chunks.push(blob)
        }, 100)
      }

      stop() {
        this.state = 'inactive'
        if (this.ondataavailable && this.chunks.length > 0) {
          this.ondataavailable({ data: this.chunks[0] })
        }
        if (this.onstop) {
          this.onstop()
        }
        this.chunks = []
      }

      pause() {
        this.state = 'paused'
      }

      resume() {
        this.state = 'recording'
      }
    }

    ;(window as any).MediaRecorder = MockMediaRecorder
  }

  /**
   * Mocks getUserMedia for testing environments
   */
  static mockGetUserMedia(window: Window) {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'test') {
      return
    }

    const mockGetUserMedia = async () => {
      return {
        getTracks: () => [
          {
            kind: 'audio',
            stop: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
          },
        ],
        getAudioTracks: () => [
          {
            kind: 'audio',
            stop: () => {},
          },
        ],
      } as unknown as MediaStream
    }

    if (window.navigator.mediaDevices) {
      window.navigator.mediaDevices.getUserMedia = mockGetUserMedia
    }
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
}
