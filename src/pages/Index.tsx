import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { useOnboarding } from '@/hooks/useOnboarding'
import Landing from './Landing'

const Index = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const { state: onboardingState, loading: onboardingLoading } = useOnboarding()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleRouting = async () => {
      // Wait for auth to load
      if (authLoading) return

      // Not authenticated - show landing page
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      // Wait for onboarding state to load
      if (onboardingLoading) return

      // User is authenticated, check onboarding state
      if (user && !user.email_confirmed_at) {
        // Email not verified - redirect to verification
        navigate('/auth/verify', { 
          state: { email: user.email },
          replace: true 
        })
        return
      }

      if (onboardingState) {
        if (onboardingState.isComplete) {
          // Onboarding complete - go to home
          navigate('/home')
        } else {
          // Needs onboarding - go to wizard
          navigate('/onboarding')
        }
      } else {
        // No onboarding state found - start onboarding
        navigate('/onboarding')
      }
    }

    handleRouting()
  }, [navigate, isAuthenticated, authLoading, onboardingLoading, onboardingState, user])

  if (loading || authLoading || onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <Landing />
  }

  // This should not render as authenticated users are redirected
  return null
}

export default Index;
