import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { ImpersonationState, ImpersonationTarget, ImpersonationAnalyticsEvent } from '@/lib/impersonationTypes'
import { IMPERSONATION_TIMEOUT_MS } from '@/lib/impersonationTypes'

interface ImpersonationContextType {
  impersonationState: ImpersonationState
  startImpersonation: (target: ImpersonationTarget) => void
  endImpersonation: () => void
  isWriteBlocked: boolean
}

const ImpersonationContext = createContext<ImpersonationContextType | null>(null)

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonationState, setImpersonationState] = useState<ImpersonationState>({
    isImpersonating: false,
    target: null,
    startedAt: null,
    timeoutId: null
  })

  const { track } = useAnalytics()
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-revert on navigation away from admin routes
  useEffect(() => {
    if (impersonationState.isImpersonating && !location.pathname.startsWith('/admin')) {
      endImpersonation()
    }
  }, [location.pathname, impersonationState.isImpersonating])

  const startImpersonation = (target: ImpersonationTarget) => {
    // Clear any existing timeout
    if (impersonationState.timeoutId) {
      clearTimeout(impersonationState.timeoutId)
    }

    // Set up auto-timeout
    const timeoutId = setTimeout(() => {
      endImpersonation('timeout')
    }, IMPERSONATION_TIMEOUT_MS)

    const startTime = new Date().toISOString()

    setImpersonationState({
      isImpersonating: true,
      target,
      startedAt: startTime,
      timeoutId
    })

    // Track impersonation start
    track('ADMIN_IMPERSONATE_STARTED', {
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      startTime
    })

    // Navigate to the appropriate space
    if (target.type === 'user' && target.primaryFamilyId) {
      navigate('/home')
    } else if (target.type === 'family') {
      navigate('/home')
    }
  }

  const endImpersonation = (reason: 'manual' | 'timeout' | 'navigation' = 'manual') => {
    const { target, startedAt, timeoutId } = impersonationState

    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const endTime = new Date().toISOString()
    const duration = startedAt ? new Date(endTime).getTime() - new Date(startedAt).getTime() : 0

    setImpersonationState({
      isImpersonating: false,
      target: null,
      startedAt: null,
      timeoutId: null
    })

    // Track impersonation end
    if (target) {
      const eventType = reason === 'timeout' ? 'ADMIN_IMPERSONATE_TIMEOUT' : 'ADMIN_IMPERSONATE_ENDED'
      track(eventType, {
        targetId: target.id,
        targetName: target.name,
        targetType: target.type,
        duration,
        reason,
        endTime
      })
    }

    // Navigate back to admin
    navigate('/admin')
  }

  // Block all write operations during impersonation
  const isWriteBlocked = impersonationState.isImpersonating

  const contextValue: ImpersonationContextType = {
    impersonationState,
    startImpersonation,
    endImpersonation,
    isWriteBlocked
  }

  return (
    <ImpersonationContext.Provider value={contextValue}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider')
  }
  return context
}