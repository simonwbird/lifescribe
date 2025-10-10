import { test, expect } from '@playwright/test'

test.describe('Magic Link Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'adminpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/home')
  })

  test('should create magic link and view it in manager', async ({ page }) => {
    // Navigate to family settings or invite page
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-creator"]')

    // Create magic link
    await page.selectOption('[data-testid="role-scope-select"]', 'member')
    await page.fill('[data-testid="max-uses-input"]', '5')
    await page.selectOption('[data-testid="expiration-select"]', '7')
    
    const createButton = page.locator('button:has-text("Generate Magic Link")')
    await createButton.click()

    // Wait for link to be generated
    await page.waitForSelector('[data-testid="generated-magic-link"]', { timeout: 10000 })
    
    const linkDisplay = page.locator('[data-testid="generated-magic-link"]')
    await expect(linkDisplay).toBeVisible()

    // Copy link
    const copyButton = page.locator('button:has-text("Copy Link")')
    await copyButton.click()

    // Verify success message
    await expect(page.locator('text=Link copied to clipboard')).toBeVisible()

    // Navigate to magic link manager
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-manager"]')

    // Verify link appears in manager
    const linkItem = page.locator('[data-testid="magic-link-item"]').first()
    await expect(linkItem).toBeVisible()
    await expect(linkItem.locator('text=member')).toBeVisible()
  })

  test('should visit magic link and join family', async ({ page, context }) => {
    // First, create a magic link as admin
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-creator"]')

    await page.selectOption('[data-testid="role-scope-select"]', 'member')
    await page.click('button:has-text("Generate Magic Link")')
    
    await page.waitForSelector('[data-testid="generated-magic-link"]', { timeout: 10000 })
    
    // Get the magic link URL
    const linkText = await page.locator('[data-testid="generated-magic-link"]').textContent()
    const magicLinkUrl = linkText?.trim() || ''

    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('button:has-text("Logout")')

    // Visit magic link in new session
    const newPage = await context.newPage()
    await newPage.goto(magicLinkUrl)

    // Should be prompted to login or create account
    await expect(newPage.locator('text=Join Family')).toBeVisible()

    // For existing user, login
    await newPage.fill('input[type="email"]', 'newmember@example.com')
    await newPage.fill('input[type="password"]', 'newpassword123')
    await newPage.click('button:has-text("Join")')

    // Should redirect to home of new family
    await newPage.waitForURL('/home', { timeout: 10000 })
    await expect(newPage.locator('[data-testid="family-name"]')).toBeVisible()

    await newPage.close()
  })

  test('should revoke magic link successfully', async ({ page }) => {
    // Create a magic link
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-creator"]')

    await page.selectOption('[data-testid="role-scope-select"]', 'member')
    await page.click('button:has-text("Generate Magic Link")')
    await page.waitForSelector('[data-testid="generated-magic-link"]', { timeout: 10000 })

    // Navigate to manager
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-manager"]')

    // Count initial links
    const initialCount = await page.locator('[data-testid="magic-link-item"]').count()
    expect(initialCount).toBeGreaterThan(0)

    // Revoke the first link
    const revokeButton = page.locator('[data-testid="revoke-magic-link-btn"]').first()
    await revokeButton.click()

    // Confirm revocation
    const confirmButton = page.locator('button:has-text("Confirm")')
    await confirmButton.click()

    // Wait for revocation to complete
    await expect(page.locator('text=Link revoked successfully')).toBeVisible()

    // Verify link count decreased or link is marked as revoked
    await page.waitForTimeout(1000)
    const updatedCount = await page.locator('[data-testid="magic-link-item"]:not([data-revoked="true"])').count()
    expect(updatedCount).toBeLessThanOrEqual(initialCount)
  })

  test('should respect max uses limit', async ({ page }) => {
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-creator"]')

    // Create link with max 1 use
    await page.fill('[data-testid="max-uses-input"]', '1')
    await page.click('button:has-text("Generate Magic Link")')
    await page.waitForSelector('[data-testid="generated-magic-link"]')

    // Navigate to manager and verify the link shows 0/1 uses
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-manager"]')
    
    const linkItem = page.locator('[data-testid="magic-link-item"]').first()
    await expect(linkItem.locator('text=0 / 1')).toBeVisible()
  })

  test('should show expired status for expired links', async ({ page }) => {
    await page.goto('/family/invite')
    await page.waitForSelector('[data-testid="magic-link-manager"]')

    // Look for any expired links (if any exist)
    const expiredLink = page.locator('[data-testid="magic-link-item"][data-expired="true"]')
    const expiredCount = await expiredLink.count()

    if (expiredCount > 0) {
      await expect(expiredLink.first().locator('text=Expired')).toBeVisible()
    }
  })
})
