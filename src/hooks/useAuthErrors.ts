import { useCallback } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { MappedAuthError, getErrorToastConfig } from '@/services/errors'
import * as Sentry from '@sentry/react'

/**
 * Hook for handling authentication errors with consistent UX
 */
export function useAuthErrors() {
  const { toast } = useToast()

  const handleError = useCallback((error: MappedAuthError, context?: { userId?: string }) => {
    // Log error to Sentry
    Sentry.captureException(error.originalError, {
      tags: { 
        auth_error: error.code,
        actionable: error.actionable
      },
      user: context?.userId ? { id: context.userId } : undefined,
      extra: {
        errorCode: error.code,
        originalMessage: error.originalError?.message
      }
    })

    // Show user-friendly toast
    const toastConfig = getErrorToastConfig(error)
    const { action, ...restConfig } = toastConfig
    
    toast(restConfig)
    
    // Handle action separately if needed
    if (action) {
      console.log(`Action available: ${action.label}`)
      // TODO: Consider showing action as a separate button or inline link
    }
  }, [toast])

  const handleErrorWithFallback = useCallback((error: any, fallbackMessage = 'An unexpected error occurred') => {
    if (error && typeof error === 'object' && 'code' in error) {
      handleError(error as MappedAuthError)
    } else {
      // Create a generic error for non-mapped errors
      const genericError: MappedAuthError = {
        code: 'AUTH/UNKNOWN',
        message: fallbackMessage,
        originalError: error,
        actionable: true
      }
      handleError(genericError)
    }
  }, [handleError])

  return {
    handleError,
    handleErrorWithFallback
  }
}