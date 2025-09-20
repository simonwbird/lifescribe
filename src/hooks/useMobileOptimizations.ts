import { useEffect } from 'react'
import { useIsMobile } from './use-mobile.tsx'

/**
 * Hook that applies mobile-specific optimizations and behaviors
 */
export function useMobileOptimizations() {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!isMobile) return

    // Prevent zoom on double-tap for better UX
    let lastTouchEnd = 0
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    // Add viewport meta tag optimizations
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
    }

    // Improve scroll behavior
    document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch')
    document.documentElement.style.setProperty('scroll-behavior', 'smooth')

    // Handle safe area for devices with notches
    const setCSSVariables = () => {
      const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0px'
      const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0px'
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop)
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom)
    }

    // Apply mobile-specific event listeners
    document.addEventListener('touchend', preventZoom, { passive: false })
    setCSSVariables()

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventZoom)
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
      }
    }
  }, [isMobile])

  // Mobile keyboard handling
  useEffect(() => {
    if (!isMobile) return

    const handleKeyboardShow = () => {
      // Adjust viewport when virtual keyboard appears
      document.documentElement.style.setProperty('--keyboard-visible', '1')
    }

    const handleKeyboardHide = () => {
      document.documentElement.style.setProperty('--keyboard-visible', '0')
    }

    // Listen for viewport changes that indicate keyboard
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const isKeyboardVisible = window.visualViewport.height < window.innerHeight * 0.75
        document.documentElement.style.setProperty('--keyboard-visible', isKeyboardVisible ? '1' : '0')
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleVisualViewportChange)
      }
    }

    // Fallback for older browsers
    window.addEventListener('focusin', handleKeyboardShow)
    window.addEventListener('focusout', handleKeyboardHide)

    return () => {
      window.removeEventListener('focusin', handleKeyboardShow)
      window.removeEventListener('focusout', handleKeyboardHide)
    }
  }, [isMobile])

  return {
    isMobile,
    // Helper functions for mobile-specific behavior
    getOptimalTouchTarget: (size: 'sm' | 'md' | 'lg') => {
      if (!isMobile) return size
      const mobileMapping = { sm: 'md', md: 'lg', lg: 'lg' } as const
      return mobileMapping[size]
    },
    getMobileSafeSpacing: (spacing: number) => {
      return isMobile ? Math.max(spacing, 16) : spacing
    }
  }
}

/**
 * Hook for mobile-aware dialog/modal behavior
 */
export function useMobileDialog() {
  const isMobile = useIsMobile()

  return {
    shouldUseDrawer: isMobile,
    getDialogProps: (size: 'sm' | 'md' | 'lg' | 'xl') => ({
      className: isMobile ? 'mobile-dialog' : undefined,
      style: isMobile ? { 
        maxHeight: '95vh',
        margin: '1rem',
        width: 'calc(100vw - 2rem)'
      } : undefined
    })
  }
}