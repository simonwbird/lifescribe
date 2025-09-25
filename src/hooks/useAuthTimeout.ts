import { useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface AuthTimeoutOptions {
  timeout?: number // Timeout in milliseconds, default 10000 (10 seconds)
  onTimeout?: () => void
  onCancel?: () => void
}

/**
 * Hook for handling authentication operations with timeout and cancellation
 */
export function useAuthTimeout() {
  const { toast } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const executeWithTimeout = useCallback(async <T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options: AuthTimeoutOptions = {}
  ): Promise<T> => {
    const { 
      timeout = 10000, // 10 second default timeout
      onTimeout,
      onCancel 
    } = options

    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      timeoutRef.current = setTimeout(() => {
        controller.abort()
        onTimeout?.()
        
        toast({
          title: 'Connection Timeout',
          description: 'The request took too long to complete. Please check your connection and try again.',
          variant: 'destructive'
        })
        
        reject(new Error('Operation timed out'))
      }, timeout)

      // Handle abort
      controller.signal.addEventListener('abort', () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        onCancel?.()
        reject(new Error('Operation cancelled'))
      })

      // Execute the operation
      operation(controller.signal)
        .then(result => {
          // Clear timeout on success
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          resolve(result)
        })
        .catch(error => {
          // Clear timeout on error
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }

          // Handle different error types
          if (error.name === 'AbortError') {
            reject(new Error('Operation cancelled'))
          } else if (error.message?.includes('fetch')) {
            // Network error
            toast({
              title: 'Connection Error',
              description: 'Unable to connect. Please check your internet connection and try again.',
              variant: 'destructive'
            })
            reject(new Error('Network error'))
          } else {
            reject(error)
          }
        })
    })
  }, [toast])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const isActive = useCallback(() => {
    return abortControllerRef.current !== null && !abortControllerRef.current.signal.aborted
  }, [])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cancel()
  }, [cancel])

  return {
    executeWithTimeout,
    cancel,
    isActive,
    cleanup
  }
}