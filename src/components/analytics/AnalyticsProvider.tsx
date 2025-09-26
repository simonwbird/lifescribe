import { createContext, useContext, ReactNode } from 'react'
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics'

interface AnalyticsContextType {
  track: (event: any) => void
  trackPromptView: (promptId: string, type: string, position: number, source: string) => void
  trackPromptShuffle: (previousPrompts: string[], newPrompts: string[], shuffleCount: number) => void
  trackStoryStart: (storyType: string, promptId?: string, source?: string) => void
  trackStorySave: (storyId: string, storyType: string, promptId?: string, contentLength?: number, timeToComplete?: number) => void
  trackStreakContinue: (streakCount: number, daysSinceLast: number, milestoneReached?: boolean) => void
  trackInviteSend: (method: string, recipientCount: number, source: string) => void
  trackInviteAccept: (inviteToken: string, inviteAgeHours: number, signupMethod: string) => void
  sessionId: string
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const analytics = useEnhancedAnalytics()

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return context
}