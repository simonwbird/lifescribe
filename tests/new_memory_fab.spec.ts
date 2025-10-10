import { test, expect } from '@playwright/test'

test.describe('New Memory FAB and Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('/home')
  })

  test('should display FAB on feed page', async ({ page }) => {
    // Navigate to feed
    await page.goto('/feed')
    
    // FAB should be visible
    await expect(page.getByTestId('new-memory-fab')).toBeVisible()
    
    // FAB should be fixed positioned (bottom-right)
    const fab = page.getByTestId('new-memory-fab')
    const box = await fab.boundingBox()
    expect(box).toBeTruthy()
  })

  test('should open modal when FAB is clicked', async ({ page }) => {
    await page.goto('/feed')
    
    // Click FAB
    await page.getByTestId('new-memory-fab').click()
    
    // Modal should open
    await expect(page.getByTestId('new-memory-modal')).toBeVisible()
    
    // Should show title
    await expect(page.locator('text="Create a New Memory"')).toBeVisible()
    
    // Should show three options
    await expect(page.getByTestId('new-memory-option-text')).toBeVisible()
    await expect(page.getByTestId('new-memory-option-photo')).toBeVisible()
    await expect(page.getByTestId('new-memory-option-voice')).toBeVisible()
  })

  test('should close modal on ESC key', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    await expect(page.getByTestId('new-memory-modal')).toBeVisible()
    
    // Press ESC
    await page.keyboard.press('Escape')
    
    // Modal should close
    await expect(page.getByTestId('new-memory-modal')).not.toBeVisible()
  })

  test('should close modal on backdrop click', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    await expect(page.getByTestId('new-memory-modal')).toBeVisible()
    
    // Click backdrop (outside modal content)
    await page.click('[role="dialog"]', { position: { x: 0, y: 0 } })
    
    // Modal should close
    await expect(page.getByTestId('new-memory-modal')).not.toBeVisible()
  })

  test('should show family selector for multiple families', async ({ page }) => {
    // This test assumes user has multiple families
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Family selector might be visible
    const familySelect = page.getByTestId('new-memory-family-select')
    
    // If visible, it should be functional
    if (await familySelect.isVisible()) {
      await familySelect.click()
      // Should show options
      await expect(page.locator('[role="option"]').first()).toBeVisible()
    }
  })

  test('should navigate to text story creation', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Select family if needed (assuming single family for test)
    
    // Click text option
    await page.getByTestId('new-memory-option-text').click()
    
    // Should navigate to text story page
    await page.waitForURL(/\/stories\/new\?type=text/)
    
    // Should show text story form
    await expect(page.getByTestId('story-title-input')).toBeVisible()
  })

  test('should navigate to photo story creation', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Click photo option
    await page.getByTestId('new-memory-option-photo').click()
    
    // Should navigate to photo story page
    await page.waitForURL(/\/stories\/new\?type=photo/)
    
    // Should show photo input
    await expect(page.getByTestId('photo-input')).toBeVisible()
  })

  test('should navigate to voice story creation', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Click voice option
    await page.getByTestId('new-memory-option-voice').click()
    
    // Should navigate to voice story page
    await page.waitForURL(/\/stories\/new\?type=voice/)
    
    // Should show voice upload input
    await expect(page.getByTestId('voice-upload-input')).toBeAttached()
  })

  test('should pass family_id in URL when navigating', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Click any option
    await page.getByTestId('new-memory-option-text').click()
    
    // URL should contain family_id parameter
    await page.waitForURL(/family_id=/)
  })

  test('should support keyboard navigation (Enter key)', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Focus on text option and press Enter
    await page.getByTestId('new-memory-option-text').focus()
    await page.keyboard.press('Enter')
    
    // Should navigate
    await page.waitForURL(/\/stories\/new\?type=text/)
  })

  test('should support keyboard shortcuts (T/P/V keys)', async ({ page }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Wait for modal to be visible
    await expect(page.getByTestId('new-memory-modal')).toBeVisible()
    
    // Press T for Text
    await page.keyboard.press('t')
    
    // Should navigate to text story
    await page.waitForURL(/\/stories\/new\?type=text/)
  })

  test('should persist last used family in localStorage', async ({ page, context }) => {
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // If family selector is visible, select a family
    const familySelect = page.getByTestId('new-memory-family-select')
    if (await familySelect.isVisible()) {
      await familySelect.click()
      await page.locator('[role="option"]').first().click()
    }
    
    // Navigate somewhere
    await page.getByTestId('new-memory-option-text').click()
    await page.waitForURL(/\/stories\/new/)
    
    // Check localStorage
    const lastFamilyId = await page.evaluate(() => localStorage.getItem('lastUsedFamilyId'))
    expect(lastFamilyId).toBeTruthy()
  })

  test('should be mobile-friendly (thumb-reachable)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/feed')
    
    // FAB should be visible and positioned for thumb reach
    const fab = page.getByTestId('new-memory-fab')
    await expect(fab).toBeVisible()
    
    const box = await fab.boundingBox()
    expect(box).toBeTruthy()
    
    // Should be in bottom-right area
    if (box) {
      expect(box.x + box.width).toBeGreaterThan(300) // Right side
      expect(box.y).toBeGreaterThan(500) // Bottom area
    }
  })

  test('should show validation if no family selected', async ({ page }) => {
    // This test is for users with multiple families
    await page.goto('/feed')
    
    // Open modal
    await page.getByTestId('new-memory-fab').click()
    
    // Don't select a family if selector is visible
    const familySelect = page.getByTestId('new-memory-family-select')
    if (await familySelect.isVisible()) {
      // Try to continue without selecting
      await page.getByTestId('new-memory-option-text').click()
      
      // Should show validation toast
      await expect(page.locator('text="Select a family"')).toBeVisible()
    }
  })
})
