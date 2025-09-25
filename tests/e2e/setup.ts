/**
 * E2E test setup and utilities
 */

import { test as base, expect } from '@playwright/test';

// Extend basic test with custom fixtures
type TestFixtures = {
  authenticatedPage: any;
  adminPage: any;
};

export const test = base.extend<TestFixtures>({
  // Fixture for authenticated user
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'mock-token' }
      }));
    });
    
    await use(page);
  },

  // Fixture for admin user
  adminPage: async ({ page }, use) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'admin-123', email: 'admin@example.com' },
        session: { access_token: 'mock-admin-token' },
        role: 'super_admin'
      }));
    });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';