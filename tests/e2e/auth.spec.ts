/**
 * Phase 7: E2E tests for authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test.describe('Login/Logout', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/auth/login');
      
      await expect(page.locator('h1')).toContainText('Sign In');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=Invalid email')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Click submit and immediately check for loading state
      await page.click('button[type="submit"]');
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });

    test('should handle timeout gracefully', async ({ page }) => {
      // Mock network delay
      await page.route('**/auth/v1/token**', async route => {
        await new Promise(resolve => setTimeout(resolve, 11000)); // 11 second delay
        await route.continue();
      });

      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show timeout error
      await expect(page.locator('text=Request timed out')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Registration', () => {
    test('should display signup page correctly', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await expect(page.locator('h1')).toContainText('Create Account');
      await expect(page.locator('input[name="fullName"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Create Account');
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', '123'); // Too short
      await page.click('button[type="submit"]');
      
      // Should show password validation error
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
    });

    test('should handle existing user registration', async ({ page }) => {
      await page.goto('/auth/signup');
      
      await page.fill('input[name="fullName"]', 'Existing User');
      await page.fill('input[type="email"]', 'existing@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show appropriate error
      await expect(page.locator('text=Email already registered')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test('should display password reset request page', async ({ page }) => {
      await page.goto('/auth/reset/request');
      
      await expect(page.locator('h1')).toContainText('Reset Password');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Send Reset Email');
    });

    test('should handle reset request successfully', async ({ page }) => {
      await page.goto('/auth/reset/request');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=Check your email')).toBeVisible();
    });
  });

  test.describe('Email Verification', () => {
    test('should display verification page', async ({ page }) => {
      await page.goto('/auth/verify');
      
      await expect(page.locator('h1')).toContainText('Verify Email');
      await expect(page.locator('text=Check your email')).toBeVisible();
    });

    test('should allow resending verification email', async ({ page }) => {
      await page.goto('/auth/verify');
      
      const resendButton = page.locator('button:has-text("Resend Email")');
      if (await resendButton.isVisible()) {
        await resendButton.click();
        await expect(page.locator('text=Verification email sent')).toBeVisible();
      }
    });
  });

  test.describe('Rate Limiting and Lockout', () => {
    test('should show captcha after multiple failed attempts', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', `wrong${i}`);
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=Invalid email or password');
        await page.reload();
      }
      
      // Should show captcha on 4th attempt
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrong3');
      
      // Check for captcha (implementation dependent)
      await expect(page.locator('[data-testid="captcha"]')).toBeVisible();
    });

    test('should show lockout message after 5 failed attempts', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', `wrong${i}`);
        await page.click('button[type="submit"]');
        await page.waitForSelector('text=Invalid email or password', { timeout: 5000 }).catch(() => {});
        if (i < 4) await page.reload();
      }
      
      // Should show lockout message
      await expect(page.locator('text=Account temporarily locked')).toBeVisible();
    });
  });

  test.describe('Offline Handling', () => {
    test('should show retry option when offline', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show offline error with retry option
      await expect(page.locator('text=Network error')).toBeVisible();
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
      
      // Go back online and retry
      await page.context().setOffline(false);
      await page.click('button:has-text("Retry")');
      
      // Should attempt login again
      await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });
  });
});

test.describe('Role-based Access Control', () => {
  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/admin/test-bootstrap');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should show access denied for insufficient permissions', async ({ page }) => {
    // Mock authenticated user without admin role
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'user-123', role: 'member' }
      }));
    });

    await page.goto('/admin/test-bootstrap');
    
    // Should show access denied or redirect
    const accessDenied = page.locator('text=Access denied');
    const loginRedirect = page.url().includes('/auth/login');
    
    expect(await accessDenied.isVisible() || loginRedirect).toBeTruthy();
  });

  test('should allow super admin access to protected routes', async ({ page }) => {
    // Mock super admin user
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'admin-123', role: 'super_admin' }
      }));
    });

    await page.goto('/admin/test-bootstrap');
    
    // Should show admin content
    await expect(page.locator('text=Super Admin Only Area')).toBeVisible();
  });
});