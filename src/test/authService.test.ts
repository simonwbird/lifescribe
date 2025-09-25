/**
 * Phase 7: Unit tests for authentication service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, signOut, sendPasswordReset } from '@/services/auth'

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should sign up a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      global.mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signUp({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      })

      expect(result.error).toBeNull()
      expect(global.mockSupabase.auth.signUp).toHaveBeenCalled()
    })

    it('should handle signup errors correctly', async () => {
      const mockError = { message: 'Email already registered' }
      
      global.mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await signUp({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      global.mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.error).toBeNull()
      expect(global.mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      global.mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      const result = await signOut()
      expect(result.error).toBeNull()
    })
  })

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      global.mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
      const result = await sendPasswordReset('test@example.com')
      expect(result.error).toBeNull()
    })
  })
})