import { test, expect } from '@playwright/test'
import { MicMock } from './utils/MicMock'

test.beforeEach(async ({ page }) => {
  // Set NODE_ENV to test
  await page.addInitScript(() => {
    (window as any).process = { env: { NODE_ENV: 'test' } }
  })

  // Mock microphone APIs
  await page.addInitScript(() => {
    // Mock getUserMedia
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

    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = mockGetUserMedia
    }

    // Mock MediaRecorder
    class MockMediaRecorder {
      state: 'inactive' | 'recording' | 'paused' = 'inactive'
      ondataavailable: ((event: any) => void) | null = null
      onstop: (() => void) | null = null
      private chunks: Blob[] = []

      constructor(stream: MediaStream, options?: any) {}

      start() {
        this.state = 'recording'
        // Simulate recording a 10-second WAV file
        setTimeout(() => {
          // Create a simple WAV blob
          const buffer = new ArrayBuffer(44 + 44100 * 2 * 10) // 10 seconds of audio
          const view = new DataView(buffer)
          
          // WAV header
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i))
            }
          }
          
          writeString(0, 'RIFF')
          view.setUint32(4, 36 + 44100 * 2 * 10, true)
          writeString(8, 'WAVE')
          writeString(12, 'fmt ')
          view.setUint32(16, 16, true)
          view.setUint16(20, 1, true)
          view.setUint16(22, 1, true)
          view.setUint32(24, 44100, true)
          view.setUint32(28, 44100 * 2, true)
          view.setUint16(32, 2, true)
          view.setUint16(34, 16, true)
          writeString(36, 'data')
          view.setUint32(40, 44100 * 2 * 10, true)

          const blob = new Blob([buffer], { type: 'audio/wav' })
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
  })

  // Login
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'testpassword123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/home')
})

test('should record voice story using mocked microphone', async ({ page }) => {
  // Navigate to voice story form
  await page.goto('/stories/voice')
  await page.waitForSelector('[data-testid="voice-recorder-panel"]')

  // Check that mic is available (mocked)
  const startButton = page.locator('button:has-text("Start Recording")')
  await expect(startButton).toBeVisible()

  // Start recording
  await startButton.click()
  
  // Wait for recording state
  await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()

  // Wait a bit for mock recording
  await page.waitForTimeout(2000)

  // Stop recording
  const stopButton = page.locator('button:has-text("Stop Recording")')
  await stopButton.click()

  // Wait for processing
  await page.waitForSelector('[data-testid="audio-player"]', { timeout: 15000 })

  // Verify audio player is visible
  await expect(page.locator('[data-testid="audio-player"]')).toBeVisible()

  // Fill in story details
  await page.fill('[data-testid="story-title-input"]', 'Voice Story Test')
  await page.fill('[data-testid="story-content-textarea"]', 'This is a test voice story')

  // Publish story
  await page.click('button:has-text("Publish Story")')
  await page.waitForURL('/home')

  // Verify story appears in feed
  const storyCard = page.locator('[data-testid="story-card"]').first()
  await expect(storyCard).toBeVisible()
  await expect(storyCard.locator('text=Voice Story Test')).toBeVisible()
})

test('should handle voice recording cancellation', async ({ page }) => {
  await page.goto('/stories/voice')
  await page.waitForSelector('[data-testid="voice-recorder-panel"]')

  const startButton = page.locator('button:has-text("Start Recording")')
  await startButton.click()
  
  await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()

  // Cancel recording
  const cancelButton = page.locator('button:has-text("Cancel")')
  await cancelButton.click()

  // Verify back to idle state
  await expect(startButton).toBeVisible()
})

test('should save voice story as draft', async ({ page }) => {
  await page.goto('/stories/voice')
  await page.waitForSelector('[data-testid="voice-recorder-panel"]')

  // Fill in title only
  await page.fill('[data-testid="story-title-input"]', 'Draft Voice Story')

  // Save as draft
  const draftButton = page.locator('button:has-text("Save Draft")')
  await expect(draftButton).toBeVisible()
  await draftButton.click()

  await page.waitForURL('/home')
})

test('should upload audio file when mic unavailable', async ({ page }) => {
  // For this test, we'll remove the mic mock to test fallback
  await page.addInitScript(() => {
    delete (navigator.mediaDevices as any).getUserMedia
  })

  await page.goto('/stories/voice')
  await page.waitForSelector('[data-testid="voice-recorder-panel"]')

  // Should show upload option
  const uploadInput = page.locator('[data-testid="audio-upload-input"]')
  await expect(uploadInput).toBeVisible()

  // Upload audio file
  await uploadInput.setInputFiles('tests/fixtures/test-audio.mp3')

  // Wait for upload to complete
  await page.waitForSelector('[data-testid="audio-player"]', { timeout: 10000 })

  await page.fill('[data-testid="story-title-input"]', 'Uploaded Audio Story')
  await page.click('button:has-text("Publish Story")')
  await page.waitForURL('/home')

  const storyCard = page.locator('[data-testid="story-card"]').first()
  await expect(storyCard).toBeVisible()
})
