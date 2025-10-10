import { test, expect } from '@playwright/test'

test.describe('Text Story Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to home
    await page.waitForURL('/home')
  })

  test('should create a text story and display it in feed', async ({ page }) => {
    // Navigate to new story page
    await page.goto('/stories/new?type=text')
    
    // Wait for the form to load
    await expect(page.getByTestId('story-title-input')).toBeVisible()
    
    // Fill in story details
    const timestamp = Date.now()
    const title = `Test Story ${timestamp}`
    const content = `This is a test story created at ${new Date().toISOString()}`
    
    await page.getByTestId('story-title-input').fill(title)
    await page.getByTestId('story-content-input').fill(content)
    
    // Click publish
    await page.getByTestId('publish-button').click()
    
    // Wait for redirect to feed
    await page.waitForURL('/feed')
    
    // Verify story appears in feed
    await expect(page.locator(`text="${title}"`)).toBeVisible()
    
    // Verify content is present
    const storyCard = page.locator('[data-story-card]').filter({ hasText: title })
    await expect(storyCard).toContainText(content.substring(0, 50))
  })

  test('should show validation error when fields are empty', async ({ page }) => {
    await page.goto('/stories/new?type=text')
    
    // Try to publish without filling fields
    await page.getByTestId('publish-button').click()
    
    // Should see validation toast
    await expect(page.locator('text="Required fields"')).toBeVisible()
  })

  test('should autosave draft while typing', async ({ page }) => {
    await page.goto('/stories/new?type=text')
    
    // Start typing
    await page.getByTestId('story-title-input').fill('Draft Story')
    await page.getByTestId('story-content-input').fill('This is a draft')
    
    // Wait for autosave indicator
    await expect(page.locator('text=/Saved/')).toBeVisible({ timeout: 10000 })
  })
})
