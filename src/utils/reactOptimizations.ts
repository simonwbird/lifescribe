// React optimization utilities
import { useCallback, useMemo, useRef } from 'react'

/**
 * Hook for stable callback references to prevent unnecessary re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const ref = useRef<T>(callback)
  ref.current = callback
  
  return useCallback(((...args: any[]) => ref.current(...args)) as T, [])
}

/**
 * Hook for memoizing expensive computations with deep comparison
 */
export function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const depsRef = useRef<any[]>()
  const resultRef = useRef<T>()
  
  if (!depsRef.current || !deepEqual(depsRef.current, deps)) {
    depsRef.current = deps
    resultRef.current = factory()
  }
  
  return resultRef.current as T
}

function deepEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, i) => {
    if (typeof val === 'object' && val !== null && typeof b[i] === 'object' && b[i] !== null) {
      return JSON.stringify(val) === JSON.stringify(b[i])
    }
    return val === b[i]
  })
}

/**
 * Hook for debouncing expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback(((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }) as T, [callback, delay])
}