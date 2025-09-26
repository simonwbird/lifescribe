import { useEffect } from 'react'

interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
  fcp?: number
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      const metrics: PerformanceMetrics = {}

      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            metrics.lcp = entry.startTime
            break
          case 'first-input':
            metrics.fid = (entry as any).processingStart - entry.startTime
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + (entry as any).value
            }
            break
        }
      }

      // Log metrics for debugging (remove in production)
      if (Object.keys(metrics).length > 0) {
        console.log('Performance metrics:', metrics)
      }
    })

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }

    // Track additional metrics
    const trackAdditionalMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const metrics: PerformanceMetrics = {
          ttfb: navigation.responseStart - navigation.requestStart,
          fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
        }
        console.log('Navigation metrics:', metrics)
      }
    }

    // Track metrics after page load
    if (document.readyState === 'complete') {
      trackAdditionalMetrics()
    } else {
      window.addEventListener('load', trackAdditionalMetrics)
    }

    return () => {
      observer.disconnect()
      window.removeEventListener('load', trackAdditionalMetrics)
    }
  }, [])

  return null
}