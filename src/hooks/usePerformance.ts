import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
  fcp?: number
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})

  useEffect(() => {
    // Track Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      const newMetrics: PerformanceMetrics = { ...metrics }

      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            newMetrics.lcp = entry.startTime
            break
          case 'first-input':
            newMetrics.fid = (entry as any).processingStart - entry.startTime
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              newMetrics.cls = (newMetrics.cls || 0) + (entry as any).value
            }
            break
        }
      }

      setMetrics(newMetrics)
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }

    return () => observer.disconnect()
  }, [])

  // Performance budget checks
  const isWithinBudget = {
    lcp: (metrics.lcp || 0) <= 2200, // 2.2s budget
    cls: (metrics.cls || 0) <= 0.06, // 0.06 budget
    fid: (metrics.fid || 0) <= 100 // 100ms budget
  }

  const overallScore = Object.values(isWithinBudget).filter(Boolean).length / Object.keys(isWithinBudget).length

  return {
    metrics,
    isWithinBudget,
    overallScore,
    grade: overallScore >= 0.9 ? 'A' : overallScore >= 0.7 ? 'B' : overallScore >= 0.5 ? 'C' : 'F'
  }
}