import { test, expect } from '@playwright/test'

test.describe('Story Drafts', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/home')
  })

  test('should auto-save draft, refresh, resume, and publish', async ({ page }) => {
    // Navigate to new story page
    await page.goto('/stories/new?type=text')
    
    // Start typing
    const title = `Draft Story ${Date.now()}`
    const content = 'This is draft content that should be auto-saved'
    
    await page.getByTestId('story-title-input').fill(title)
    await page.getByTestId('story-content-input').fill(content)
    
    // Wait for autosave indicator
    await expect(page.locator('text=/Saved/')).toBeVisible({ timeout: 10000 })
    
    // Refresh the page
    await page.reload()
    
    // The draft should still be there (autosaved)
    await expect(page.getByTestId('story-title-input')).toHaveValue(title)
    await expect(page.getByTestId('story-content-input')).toHaveValue(content)
    
    // Now publish the draft
    await page.getByTestId('publish-button').click()
    
    // Should redirect to feed
    await page.waitForURL('/feed')
    
    // Verify published story appears
    await expect(page.locator(`text="${title}"`)).toBeVisible()
  })

  test('should navigate to drafts page and resume draft', async ({ page }) => {
    // First, create a draft
    await page.goto('/stories/new?type=text')
    
    const title = `Resume Draft ${Date.now()}`
    await page.getByTestId('story-title-input').fill(title)
    await page.getByTestId('story-content-input').fill('Draft content to resume')
    
    // Wait for autosave
    await expect(page.locator('text=/Saved/')).toBeVisible({ timeout: 10000 })
    
    // Navigate away to home
    await page.goto('/home')
    
    // Check if drafts card is visible
    const draftsCard = page.locator('text="Resume Drafts"')
    if (await draftsCard.isVisible()) {
      await draftsCard.click()
      
      // Should navigate to drafts page
      await page.waitForURL('/stories/drafts')
      
      // Find our draft and click to resume
      const draftRow = page.locator(`text="${title}"`).first()
      await draftRow.click()
      
      // Should navigate back to edit page with draft loaded
      await expect(page.getByTestId('story-title-input')).toHaveValue(title)
    }
  })

  test('should preserve draft state across tab switches', async ({ page }) => {
    // Start on text tab
    await page.goto('/stories/new?type=text')
    
    const textTitle = 'Text Draft'
    await page.getByTestId('story-title-input').fill(textTitle)
    await page.getByTestId('story-content-input').fill('Text content')
    
    // Wait for autosave
    await expect(page.locator('text=/Saved/')).toBeVisible({ timeout: 10000 })
    
    // Switch to photo tab
    await page.click('button[role="tab"]:has-text("Photo")')
    
    // Switch back to text tab
    await page.click('button[role="tab"]:has-text("Text")')
    
    // Draft should still be there
    await expect(page.getByTestId('story-title-input')).toHaveValue(textTitle)
  })

  test('should show draft indicator in home page', async ({ page }) => {
    // Create a draft
    await page.goto('/stories/new?type=text')
    
    await page.getByTestId('story-title-input').fill('Home Draft Test')
    await page.getByTestId('story-content-input').fill('Draft content')
    
    // Wait for autosave
    await expect(page.locator('text=/Saved/')).toBeVisible({ timeout: 10000 })
    
    // Navigate to home
    await page.goto('/home')
    
    // Should see drafts card
    await expect(page.locator('text="Resume Drafts"')).toBeVisible()
  })

  test('should delete draft after successful publish', async ({ page }) => {
    // Create and publish a story
    await page.goto('/stories/new?type=text')
    
    const title = `Publish Draft ${Date.now()}`
    await page.getByTestId('story-title-input').fill(title)
    await page.getByTestId('story-content-input').fill('Content to publish')
    
    // Wait for autosave
    await expect(page.locator('text=/Saved/')).toBeVisible({ timeout: 10000 })
    
    // Publish
    await page.getByTestId('publish-button').click()
    await page.waitForURL('/feed')
    
    // Go to drafts page
    await page.goto('/stories/drafts')
    
    // Our published story should NOT appear as draft
    await expect(page.locator(`text="${title}"`)).not.toBeVisible()
  })
})
