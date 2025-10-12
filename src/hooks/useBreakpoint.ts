import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < BREAKPOINTS.tablet) return 'mobile'
    if (width < BREAKPOINTS.desktop) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      let newBreakpoint: Breakpoint = 'desktop'
      
      if (width < BREAKPOINTS.tablet) {
        newBreakpoint = 'mobile'
      } else if (width < BREAKPOINTS.desktop) {
        newBreakpoint = 'tablet'
      }
      
      setBreakpoint(prev => prev !== newBreakpoint ? newBreakpoint : prev)
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial check

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}
