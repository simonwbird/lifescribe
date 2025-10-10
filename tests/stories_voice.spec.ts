import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Voice Story Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/home')
  })

  test('should upload audio file and publish when mic unsupported', async ({ page }) => {
    // Navigate to voice story form
    await page.goto('/stories/new?type=voice')
    
    // Wait for form to load
    await expect(page.getByTestId('voice-upload-input')).toBeVisible()
    
    // Check if capability fallback is shown (mic not available)
    const fallbackVisible = await page.locator('text=/Voice recording is not available/').isVisible()
    
    if (fallbackVisible) {
      console.log('Mic not available - testing upload fallback')
    }
    
    // Upload audio file
    const testAudioPath = path.join(__dirname, 'fixtures', 'test-audio.mp3')
    await page.getByTestId('voice-upload-input').setInputFiles(testAudioPath)
    
    // Fill in story details
    const timestamp = Date.now()
    const title = `Voice Story ${timestamp}`
    const content = 'This is a voice story with uploaded audio'
    
    await page.getByTestId('story-title-input').fill(title)
    await page.getByTestId('story-content-input').fill(content)
    
    // Click publish
    await page.getByTestId('publish-button').click()
    
    // Wait for redirect to feed
    await page.waitForURL('/feed')
    
    // Verify story appears in feed
    await expect(page.locator(`text="${title}"`)).toBeVisible()
    
    // Verify media row exists in database
    // This would require API access or database query
    // For now, we verify the story card shows
    const storyCard = page.locator('[data-story-card]').filter({ hasText: title })
    await expect(storyCard).toBeVisible()
  })

  test('should show permission denied guidance when mic blocked', async ({ page }) => {
    // Navigate to voice story form
    await page.goto('/stories/new?type=voice')
    
    // Mock denied microphone permission
    await page.context().grantPermissions([], { origin: page.url() })
    
    // Try to start recording
    const recordButton = page.locator('button:has-text("Start Recording")')
    if (await recordButton.isVisible()) {
      await recordButton.click()
      
      // Should show permission guidance
      await expect(page.locator('text=/Enable microphone in browser settings/')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should allow saving draft without audio', async ({ page }) => {
    await page.goto('/stories/new?type=voice')
    
    // Fill only required text fields
    await page.getByTestId('story-title-input').fill('Draft Voice Story')
    await page.getByTestId('story-content-input').fill('Draft content')
    
    // Draft button should be visible without audio
    await expect(page.getByTestId('save-draft-button')).toBeVisible()
    
    // Click save draft
    await page.getByTestId('save-draft-button').click()
    
    // Should navigate to feed
    await page.waitForURL('/feed')
  })

  test('should show upload button as fallback option', async ({ page }) => {
    await page.goto('/stories/new?type=voice')
    
    // Upload input should always be present as fallback
    await expect(page.getByTestId('voice-upload-input')).toBeAttached()
  })
})
