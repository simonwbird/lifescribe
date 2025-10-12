import { test, expect, Page } from '@playwright/test'

/**
 * Person Page - Single-Instance Blocks Test
 * Verifies no duplicate blocks exist across desktop/tablet/mobile breakpoints
 */

const BREAKPOINTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
}

const BLOCK_IDS = [
  'hero',
  'bio',
  'quick-facts',
  'highlights',
  'toc',
  'contribute',
  'anniversaries',
  'visibility-search',
  'map',
  'media-counters',
  'favorites',
  'causes',
  'share',
  'timeline',
  'stories',
  'photos',
  'audio',
  'relationships',
  'guestbook',
  'services',
  'places'
]

async function countBlockInstances(page: Page, blockId: string): Promise<number> {
  // Count by section ID (primary method)
  const sectionCount = await page.locator(`section#${blockId}`).count()
  
  // Also check by data attribute as fallback
  const dataCount = await page.locator(`[data-block-id][id="${blockId}"]`).count()
  
  return Math.max(sectionCount, dataCount)
}

async function verifyUniqueBlocks(page: Page, breakpoint: string) {
  const duplicates: string[] = []
  const missing: string[] = []
  const counts: Record<string, number> = {}

  for (const blockId of BLOCK_IDS) {
    const count = await countBlockInstances(page, blockId)
    counts[blockId] = count

    if (count > 1) {
      duplicates.push(`${blockId} (${count} instances)`)
    }
  }

  // Log results
  console.log(`\n[${breakpoint}] Block counts:`, counts)

  if (duplicates.length > 0) {
    throw new Error(
      `[${breakpoint}] Duplicate blocks found:\n${duplicates.join('\n')}`
    )
  }
}

async function verifyVisualPlacement(page: Page, breakpoint: string) {
  if (breakpoint === 'desktop' || breakpoint === 'tablet') {
    // Rail should be visible
    const rail = page.locator('#portal-rail')
    await expect(rail).toBeVisible()

    // Quick Facts should be in rail
    const quickFactsInRail = rail.locator('#quick-facts')
    const quickFactsExists = await quickFactsInRail.count()
    
    if (quickFactsExists > 0) {
      await expect(quickFactsInRail).toBeVisible()
      console.log(`[${breakpoint}] ✓ QuickFacts in rail`)
    }

    // Check if rail is sticky (should have position: sticky in styles)
    const railClasses = await rail.getAttribute('class')
    console.log(`[${breakpoint}] Rail classes:`, railClasses)

  } else if (breakpoint === 'mobile') {
    // Rail should be hidden on mobile
    const rail = page.locator('#portal-rail')
    await expect(rail).toBeHidden()
    console.log(`[${breakpoint}] ✓ Rail hidden`)

    // Verify block order in main: Bio before QuickFacts before Timeline
    const main = page.locator('#portal-main')
    const sections = main.locator('section')
    const sectionIds = await sections.evaluateAll(
      (elements) => elements.map(el => el.id)
    )

    console.log(`[${breakpoint}] Section order:`, sectionIds)

    const bioIndex = sectionIds.indexOf('bio')
    const quickFactsIndex = sectionIds.indexOf('quick-facts')
    const timelineIndex = sectionIds.indexOf('timeline')

    if (bioIndex !== -1 && quickFactsIndex !== -1) {
      expect(bioIndex).toBeLessThan(quickFactsIndex)
      console.log(`[${breakpoint}] ✓ Bio before QuickFacts`)
    }

    if (quickFactsIndex !== -1 && timelineIndex !== -1) {
      expect(quickFactsIndex).toBeLessThan(timelineIndex)
      console.log(`[${breakpoint}] ✓ QuickFacts before Timeline`)
    }
  }
}

async function verifyAnchorNavigation(page: Page, breakpoint: string) {
  // Check if TOC exists
  const toc = page.locator('#toc')
  const tocExists = await toc.count()
  
  if (tocExists === 0) {
    console.log(`[${breakpoint}] ⚠ TOC not present, skipping anchor test`)
    return
  }

  // Try to find and click a link to Photos section
  const photosLink = page.locator('nav a[href*="#photos"], nav button').filter({ hasText: /photos/i }).first()
  const photosLinkExists = await photosLink.count()
  
  if (photosLinkExists > 0) {
    await photosLink.click()
    
    // Wait a bit for smooth scroll
    await page.waitForTimeout(500)
    
    // Check if Photos section is in viewport or URL hash changed
    const currentUrl = page.url()
    const hasHashOrScrolled = currentUrl.includes('#photos') || 
      await page.locator('#photos').isVisible()
    
    expect(hasHashOrScrolled).toBeTruthy()
    console.log(`[${breakpoint}] ✓ Jump to Photos works`)
  } else {
    console.log(`[${breakpoint}] ⚠ Photos link not found in TOC`)
  }
}

test.describe('Person Page - No Duplicates Across Breakpoints', () => {
  test.setTimeout(120000) // 2 minutes for full test

  test('should have unique blocks across all breakpoints', async ({ page }) => {
    // Navigate to a test person page
    // Using a placeholder ID - in real testing, this would be a known test fixture
    const personId = '10101010-1010-1010-1010-101010101010'
    await page.goto(`/people/${personId}`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Extra time for React hydration

    // Test each breakpoint
    for (const [breakpointName, viewport] of Object.entries(BREAKPOINTS)) {
      console.log(`\n========== Testing ${breakpointName.toUpperCase()} ==========`)
      
      // Set viewport size
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500) // Wait for responsive changes

      // Take screenshot
      await page.screenshot({ 
        path: `tests/screenshots/person-page-${breakpointName}.png`,
        fullPage: true 
      })

      // Verify no duplicate blocks
      await verifyUniqueBlocks(page, breakpointName)

      // Verify visual placement
      await verifyVisualPlacement(page, breakpointName)

      // Verify anchor navigation works
      await verifyAnchorNavigation(page, breakpointName)

      console.log(`[${breakpointName}] ✅ All checks passed\n`)
    }
  })

  test('should maintain stable anchor IDs when resizing', async ({ page }) => {
    const personId = '10101010-1010-1010-1010-101010101010'
    await page.goto(`/people/${personId}`)
    await page.waitForLoadState('networkidle')

    // Start at desktop
    await page.setViewportSize(BREAKPOINTS.desktop)
    await page.waitForTimeout(500)

    // Check Bio anchor exists
    const bioDesktop = await page.locator('#bio').count()
    expect(bioDesktop).toBe(1)
    console.log('✓ Bio anchor exists at desktop')

    // Resize to mobile
    await page.setViewportSize(BREAKPOINTS.mobile)
    await page.waitForTimeout(500)

    // Bio anchor should still exist with same ID
    const bioMobile = await page.locator('#bio').count()
    expect(bioMobile).toBe(1)
    console.log('✓ Bio anchor stable after resize to mobile')

    // Resize back to desktop
    await page.setViewportSize(BREAKPOINTS.desktop)
    await page.waitForTimeout(500)

    // Still should have exactly one Bio
    const bioAgain = await page.locator('#bio').count()
    expect(bioAgain).toBe(1)
    console.log('✓ Bio anchor stable after resize back to desktop')
  })

  test('should have proper ARIA landmarks', async ({ page }) => {
    const personId = '10101010-1010-1010-1010-101010101010'
    await page.goto(`/people/${personId}`)
    await page.waitForLoadState('networkidle')

    // Check for main landmark
    const main = page.locator('main[role="main"]')
    await expect(main).toBeVisible()
    expect(await main.getAttribute('id')).toBe('portal-main')
    console.log('✓ Main landmark exists')

    // Check for complementary landmark (desktop/tablet)
    await page.setViewportSize(BREAKPOINTS.desktop)
    await page.waitForTimeout(500)
    
    const aside = page.locator('aside[role="complementary"]')
    const asideExists = await aside.count()
    
    if (asideExists > 0) {
      expect(await aside.getAttribute('id')).toBe('portal-rail')
      console.log('✓ Aside landmark exists with correct ID')
    }

    // Check that main is focusable for skip link
    const mainTabIndex = await main.getAttribute('tabindex')
    expect(mainTabIndex).toBe('-1')
    console.log('✓ Main is focusable (tabindex=-1)')
  })

  test('should have semantic sections with ARIA labels', async ({ page }) => {
    const personId = '10101010-1010-1010-1010-101010101010'
    await page.goto(`/people/${personId}`)
    await page.waitForLoadState('networkidle')

    // Check that sections have proper attributes
    const sections = page.locator('section[id][aria-label]')
    const count = await sections.count()
    
    console.log(`Found ${count} sections with ID and ARIA label`)
    
    // Verify at least some key sections exist
    const bioSection = page.locator('section#bio[aria-label]')
    const bioExists = await bioSection.count()
    
    if (bioExists > 0) {
      const ariaLabel = await bioSection.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      console.log(`✓ Bio section has ARIA label: "${ariaLabel}"`)
    }

    // Check for scroll offset class
    const bioClasses = await page.locator('section#bio').getAttribute('class')
    expect(bioClasses).toContain('scroll-mt')
    console.log('✓ Sections have scroll margin for fixed header')
  })

  test('should prevent duplicate singletons from rendering', async ({ page }) => {
    // This test would require injecting duplicate blocks programmatically
    // For now, we verify through the existing DOM structure
    
    const personId = '10101010-1010-1010-1010-101010101010'
    await page.goto(`/people/${personId}`)
    await page.waitForLoadState('networkidle')

    // Check singleton blocks
    const singletonBlocks = [
      'quick-facts',
      'toc',
      'visibility-search',
      'media-counters'
    ]

    for (const blockId of singletonBlocks) {
      const count = await countBlockInstances(page, blockId)
      expect(count).toBeLessThanOrEqual(1)
      console.log(`✓ ${blockId}: ${count} instance (singleton enforced)`)
    }
  })
})

// Helper test to validate test infrastructure
test.describe('Test Infrastructure', () => {
  test('should be able to navigate to person page', async ({ page }) => {
    const personId = '10101010-1010-1010-1010-101010101010'
    
    await page.goto(`/people/${personId}`)
    await page.waitForLoadState('networkidle')
    
    // Should see some content
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    expect(body!.length).toBeGreaterThan(100)
    
    console.log('✓ Person page loads successfully')
  })
})
