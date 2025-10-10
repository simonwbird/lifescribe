import { useEffect, useState } from 'react'
import { usePerformance } from './usePerformance'

interface PerformanceBudget {
  lcp: number // Largest Contentful Paint in ms
  fid: number // First Input Delay in ms
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte in ms
  fcp: number // First Contentful Paint in ms
}

interface BudgetStatus {
  metric: string
  budget: number
  actual: number
  status: 'pass' | 'warn' | 'fail'
  impact: 'high' | 'medium' | 'low'
}

const DEFAULT_BUDGET: PerformanceBudget = {
  lcp: 2500, // 2.5s for good UX
  fid: 100,  // 100ms for good responsiveness
  cls: 0.1,  // 0.1 for good visual stability
  ttfb: 800, // 800ms for good server response
  fcp: 1800  // 1.8s for good perceived load
}

/**
 * Monitor performance against defined budgets
 * Alerts when metrics exceed thresholds
 */
export function usePerformanceBudget(customBudget?: Partial<PerformanceBudget>) {
  const { metrics } = usePerformance()
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([])
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy')

  const budget = { ...DEFAULT_BUDGET, ...customBudget }

  useEffect(() => {
    const statuses: BudgetStatus[] = []

    // Check LCP
    if (metrics.lcp !== undefined) {
      const status = getMetricStatus(metrics.lcp, budget.lcp, 1.5)
      statuses.push({
        metric: 'Largest Contentful Paint',
        budget: budget.lcp,
        actual: metrics.lcp,
        status,
        impact: 'high'
      })
    }

    // Check FID
    if (metrics.fid !== undefined) {
      const status = getMetricStatus(metrics.fid, budget.fid, 1.5)
      statuses.push({
        metric: 'First Input Delay',
        budget: budget.fid,
        actual: metrics.fid,
        status,
        impact: 'high'
      })
    }

    // Check CLS
    if (metrics.cls !== undefined) {
      const status = getMetricStatus(metrics.cls, budget.cls, 1.5)
      statuses.push({
        metric: 'Cumulative Layout Shift',
        budget: budget.cls,
        actual: metrics.cls,
        status,
        impact: 'medium'
      })
    }

    // Check TTFB
    if (metrics.ttfb !== undefined) {
      const status = getMetricStatus(metrics.ttfb, budget.ttfb, 1.5)
      statuses.push({
        metric: 'Time to First Byte',
        budget: budget.ttfb,
        actual: metrics.ttfb,
        status,
        impact: 'medium'
      })
    }

    // Check FCP
    if (metrics.fcp !== undefined) {
      const status = getMetricStatus(metrics.fcp, budget.fcp, 1.5)
      statuses.push({
        metric: 'First Contentful Paint',
        budget: budget.fcp,
        actual: metrics.fcp,
        status,
        impact: 'high'
      })
    }

    setBudgetStatus(statuses)

    // Calculate overall health
    const failCount = statuses.filter(s => s.status === 'fail' && s.impact === 'high').length
    const warnCount = statuses.filter(s => s.status === 'warn').length

    if (failCount > 0) {
      setOverallHealth('critical')
    } else if (warnCount > 1) {
      setOverallHealth('warning')
    } else {
      setOverallHealth('healthy')
    }

    // Log warnings in development
    if (process.env.NODE_ENV === 'development') {
      statuses.forEach(s => {
        if (s.status === 'fail') {
          console.warn(`Performance budget exceeded: ${s.metric}`, {
            budget: s.budget,
            actual: s.actual,
            impact: s.impact
          })
        }
      })
    }
  }, [metrics, budget])

  return {
    budgetStatus,
    overallHealth,
    metrics
  }
}

function getMetricStatus(
  actual: number,
  budget: number,
  warnMultiplier: number
): 'pass' | 'warn' | 'fail' {
  if (actual <= budget) {
    return 'pass'
  } else if (actual <= budget * warnMultiplier) {
    return 'warn'
  } else {
    return 'fail'
  }
}
