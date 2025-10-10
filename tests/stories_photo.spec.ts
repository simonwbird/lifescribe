import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Photo Story Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/home')
  })

  test('should upload image and publish photo story', async ({ page }) => {
    // Navigate to photo story form
    await page.goto('/stories/new?type=photo')
    
    // Wait for form
    await expect(page.getByTestId('photo-input')).toBeVisible()
    
    // Upload a test image (create a 1x1 pixel PNG for testing)
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png')
    await page.getByTestId('photo-input').setInputFiles(testImagePath)
    
    // Fill in story details
    const timestamp = Date.now()
    const title = `Photo Story ${timestamp}`
    
    await page.getByTestId('story-title-input').fill(title)
    // Content is optional for photo-only stories
    
    // Click publish
    await page.getByTestId('publish-button').click()
    
    // Wait for redirect to feed
    await page.waitForURL('/feed')
    
    // Verify story appears in feed
    await expect(page.locator(`text="${title}"`)).toBeVisible()
    
    // Verify thumbnail shows
    const storyCard = page.locator('[data-story-card]').filter({ hasText: title })
    await expect(storyCard.locator('img')).toBeVisible()
  })

  test('should allow multiple image uploads', async ({ page }) => {
    await page.goto('/stories/new?type=photo')
    
    // Upload multiple test images
    const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png')
    await page.getByTestId('photo-input').setInputFiles([testImagePath, testImagePath])
    
    // Should show 2 preview thumbnails
    await expect(page.locator('[data-photo-preview]')).toHaveCount(2)
  })

  test('should save as draft when no photos uploaded', async ({ page }) => {
    await page.goto('/stories/new?type=photo')
    
    // Fill only title
    await page.getByTestId('story-title-input').fill('Draft Photo Story')
    
    // Draft button should be visible when no photos
    await expect(page.getByTestId('save-draft-button')).toBeVisible()
    
    // Click save draft
    await page.getByTestId('save-draft-button').click()
    
    // Should navigate to feed
    await page.waitForURL('/feed')
  })

  test('should validate file type', async ({ page }) => {
    await page.goto('/stories/new?type=photo')
    
    // Try to upload non-image file
    const testFilePath = path.join(__dirname, 'fixtures', 'test-file.txt')
    await page.getByTestId('photo-input').setInputFiles(testFilePath)
    
    // Should see error toast
    await expect(page.locator('text=/not a supported image format/')).toBeVisible()
  })
})
