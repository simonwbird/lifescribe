import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from '@/hooks/use-toast'

export type OnboardingStep = 'welcome' | 'profile_setup' | 'family_setup' | 'preferences' | 'completed'

export interface OnboardingState {
  currentStep: OnboardingStep
  isComplete: boolean
  completedAt?: string
  emailVerified: boolean
  emailVerifiedAt?: string
  isLocked: boolean
  lockedUntil?: string
  hasProfile: boolean
  hasFamily: boolean
  familyInfo?: {
    id: string
    name: string
    role: string
  }
  settings: any
}

export interface OnboardingActions {
  updateStep: (step: OnboardingStep, data?: any) => Promise<boolean>
  refreshState: () => Promise<void>
  completeOnboarding: () => Promise<boolean>
  resetOnboarding: () => Promise<boolean>
}

export function useOnboarding(): {
  state: OnboardingState | null
  loading: boolean
  error: string | null
  actions: OnboardingActions
} {
  const { user } = useAuth()
  const { toast } = useToast()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch onboarding state from database
  const fetchOnboardingState = useCallback(async (): Promise<OnboardingState | null> => {
    if (!user?.id) return null

    try {
      const { data, error } = await supabase.rpc('get_onboarding_state', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching onboarding state:', error)
        throw error
      }

      return data ? {
        currentStep: (data as any).current_step as OnboardingStep,
        isComplete: (data as any).is_complete,
        completedAt: (data as any).completed_at,
        emailVerified: (data as any).email_verified,
        emailVerifiedAt: (data as any).email_verified_at,
        isLocked: (data as any).is_locked,
        lockedUntil: (data as any).locked_until,
        hasProfile: (data as any).has_profile,
        hasFamily: (data as any).has_family,
        familyInfo: (data as any).family_info,
        settings: (data as any).settings || {}
      } : null
    } catch (err) {
      console.error('Failed to fetch onboarding state:', err)
      setError('Failed to load onboarding progress')
      return null
    }
  }, [user?.id])

  // Update onboarding step
  const updateStep = useCallback(async (step: OnboardingStep, data: any = {}): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const { data: result, error } = await supabase.rpc('update_onboarding_step', {
        p_user_id: user.id,
        p_step: step,
        p_data: data
      })

      if (error) {
        console.error('Error updating onboarding step:', error)
        toast({
          title: 'Error',
          description: 'Failed to save progress. Please try again.',
          variant: 'destructive'
        })
        return false
      }

      if (result && typeof result === 'object' && 'success' in result && (result as any).success) {
        // Refresh state after successful update
        await refreshState()
        
        toast({
          title: 'Progress saved',
          description: `Successfully updated to ${step.replace('_', ' ')} step.`
        })
        return true
      }

      return false
    } catch (err) {
      console.error('Failed to update onboarding step:', err)
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive'
      })
      return false
    }
  }, [user?.id, toast])

  // Refresh onboarding state
  const refreshState = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const newState = await fetchOnboardingState()
      setState(newState)
    } catch (err) {
      setError('Failed to refresh onboarding state')
    } finally {
      setLoading(false)
    }
  }, [user?.id, fetchOnboardingState])

  // Complete onboarding
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    const success = await updateStep('completed')
    if (success) {
      toast({
        title: 'Welcome to LifeScribe!',
        description: 'Your account setup is complete. Enjoy exploring your family stories!'
      })
    }
    return success
  }, [updateStep, toast])

  // Reset onboarding (admin/dev function)
  const resetOnboarding = useCallback(async (): Promise<boolean> => {
    return await updateStep('welcome')
  }, [updateStep])

  // Initialize and load state when user changes
  useEffect(() => {
    if (user?.id) {
      refreshState()
    } else {
      setState(null)
      setLoading(false)
    }
  }, [user?.id, refreshState])

  const actions: OnboardingActions = {
    updateStep,
    refreshState,
    completeOnboarding,
    resetOnboarding
  }

  return {
    state,
    loading,
    error,
    actions
  }
}