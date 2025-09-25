/**
 * Phase 7: Unit tests for secure roles hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSecureRoles, useIsSuperAdmin, useIsFamilyAdmin } from '@/hooks/useSecureRoles'

// Mock AuthProvider
const mockAuth = {
  user: { id: 'user-123', email: 'test@example.com' },
  session: { access_token: 'token' }
}

vi.mock('@/contexts/AuthProvider', () => ({
  useAuth: () => mockAuth
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  
  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSecureRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user roles from database', async () => {
    global.mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { settings: { role: 'super_admin', bootstrap_admin: true } },
            error: null
          })
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: [], error: null })
      }
    })

    const { result } = renderHook(() => useSecureRoles(), { wrapper: createWrapper() })
    
    // Wait for query to resolve
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(result.current.data?.systemRole).toBe('super_admin')
    expect(result.current.data?.isBootstrapAdmin).toBe(true)
  })
})