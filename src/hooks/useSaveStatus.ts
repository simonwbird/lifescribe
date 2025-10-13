import { useState, useEffect, useRef } from 'react'

export type SaveStatus = 'saving' | 'saved' | 'idle'

export function useSaveStatus(dependencies: any[], debounceMs: number = 500) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timeoutRef = useRef<NodeJS.Timeout>()
  const savedTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current)
    }

    // Show "saving" immediately
    setStatus('saving')

    // After debounce, show "saved"
    timeoutRef.current = setTimeout(() => {
      setStatus('saved')
      
      // After 2 seconds, change to "All changes saved"
      savedTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
      }, 2000)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
    }
  }, dependencies)

  return status
}
