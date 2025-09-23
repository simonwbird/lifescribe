import { useAuth } from '@/contexts/AuthProvider'
import { OnboardingState } from '@/services/user'

export type OnboardingStep = 
  | 'profile'
  | 'mode_selection' 
  | 'family_setup'
  | 'complete'

/**
 * Hook for managing onboarding state machine
 */
export function useOnboarding(): {
  state: OnboardingState | null
  loading: boolean
  currentStep: OnboardingStep
  needsOnboarding: boolean
  refresh: () => Promise<void>
} {
  const { onboarding, loading, needsOnboarding, refreshOnboarding } = useAuth()

  // Determine current onboarding step
  const getCurrentStep = (): OnboardingStep => {
    if (!onboarding) return 'profile'
    
    if (!onboarding.hasProfile) {
      return 'profile'
    }
    
    if (onboarding.needsModeSelection) {
      return 'mode_selection'
    }
    
    if (!onboarding.hasDefaultFamily) {
      return 'family_setup'
    }
    
    return 'complete'
  }

  return {
    state: onboarding,
    loading,
    currentStep: getCurrentStep(),
    needsOnboarding,
    refresh: refreshOnboarding
  }
}