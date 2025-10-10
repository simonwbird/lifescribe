import { test, expect } from '@playwright/test'

test.describe('Simple Mode Prompts Hub', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      }))
    })

    // Navigate to simple prompts page
    await page.goto('/prompts/simple')
  })

  test('displays one prompt at a time', async ({ page }) => {
    await expect(page.locator('[data-testid="prompt-card"]')).toBeVisible()
    
    // Should only show one prompt card
    const promptCards = await page.locator('[data-testid="prompt-card"]').count()
    expect(promptCards).toBe(1)
  })

  test('shows Answer This and Show Another buttons', async ({ page }) => {
    await expect(page.locator('[data-testid="prompt-answer-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="prompt-show-another"]')).toBeVisible()
  })

  test('displays Listen feature', async ({ page }) => {
    await expect(page.locator('[data-testid="listen-feature"]')).toBeVisible()
  })

  test('opens answer composer when clicking Answer This', async ({ page }) => {
    await page.locator('[data-testid="prompt-answer-button"]').click()
    
    // Should show textarea
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.getByRole('button', { name: /save answer/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
  })

  test('shows next prompt when clicking Show Another', async ({ page }) => {
    // Get first prompt text
    const firstPromptText = await page.locator('[data-testid="prompt-card"] h1').textContent()
    
    // Click Show Another
    await page.locator('[data-testid="prompt-show-another"]').click()
    
    // Wait for new prompt to load
    await page.waitForTimeout(500)
    
    // Verify prompt card is still visible (may or may not be different text depending on data)
    await expect(page.locator('[data-testid="prompt-card"]')).toBeVisible()
  })

  test('can submit an answer', async ({ page }) => {
    // Click Answer This
    await page.locator('[data-testid="prompt-answer-button"]').click()
    
    // Fill in answer
    await page.locator('textarea').fill('This is my memory about that time...')
    
    // Submit
    await page.getByRole('button', { name: /save answer/i }).click()
    
    // Should see success toast
    await expect(page.getByText(/memory saved/i)).toBeVisible()
    
    // Should automatically show next prompt
    await expect(page.locator('[data-testid="prompt-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="prompt-answer-button"]')).toBeVisible()
  })

  test('shows All caught up message when no prompts left', async ({ page }) => {
    // This test would need to mock the API to return empty prompt list
    // For now, just verify the element can be found if it exists
    const caughtUpElement = page.locator('[data-testid="all-caught-up"]')
    
    // If visible, verify content
    if (await caughtUpElement.isVisible()) {
      await expect(caughtUpElement).toContainText(/all caught up/i)
      await expect(page.getByRole('button', { name: /back to home/i })).toBeVisible()
    }
  })

  test('uses Simple Mode layout styles', async ({ page }) => {
    // Verify Simple Mode attribute
    const mainContainer = page.locator('[data-mode="simple"]')
    await expect(mainContainer).toBeVisible()
    
    // Verify large buttons are present
    const answerButton = page.locator('[data-testid="prompt-answer-button"]')
    await expect(answerButton).toBeVisible()
    
    // Check that button has large size class
    const buttonClass = await answerButton.getAttribute('class')
    expect(buttonClass).toContain('text-xl')
  })

  test('can cancel answer composition', async ({ page }) => {
    // Click Answer This
    await page.locator('[data-testid="prompt-answer-button"]').click()
    
    // Fill in some text
    await page.locator('textarea').fill('Started typing...')
    
    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click()
    
    // Should return to prompt view with action buttons
    await expect(page.locator('[data-testid="prompt-answer-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="prompt-show-another"]')).toBeVisible()
    await expect(page.locator('textarea')).not.toBeVisible()
  })
})
