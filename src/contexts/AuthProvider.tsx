import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { UserProfile, UserRole, OnboardingState, getProfile, getRolesFromMembers, getOnboardingState } from '@/services/user'
import { MappedAuthError } from '@/services/errors'
import * as Sentry from '@sentry/react'

export interface AuthState {
  // Core auth state
  session: Session | null
  user: User | null
  
  // Extended user data
  profile: UserProfile | null
  roles: UserRole[]
  onboarding: OnboardingState | null
  
  // Loading states
  loading: boolean
  profileLoading: boolean
  rolesLoading: boolean
  
  // Actions
  refreshProfile: () => Promise<void>
  refreshRoles: () => Promise<void>
  refreshOnboarding: () => Promise<void>
  
  // Computed properties
  isAuthenticated: boolean
  isSuperAdmin: boolean
  needsOnboarding: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Core auth state
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  // Extended user data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    
    setProfileLoading(true)
    try {
      const { data, error } = await getProfile(user.id)
      if (error) {
        console.error('Failed to refresh profile:', error)
        Sentry.captureException(error.originalError, {
          tags: { auth: 'profile_refresh' },
          user: { id: user.id }
        })
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile refresh error:', error)
      Sentry.captureException(error, {
        tags: { auth: 'profile_refresh' },
        user: { id: user.id }
      })
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  // Refresh roles data
  const refreshRoles = useCallback(async () => {
    if (!user?.id) return
    
    setRolesLoading(true)
    try {
      const { data, error } = await getRolesFromMembers(user.id)
      if (error) {
        console.error('Failed to refresh roles:', error)
        Sentry.captureException(error.originalError, {
          tags: { auth: 'roles_refresh' },
          user: { id: user.id }
        })
      } else {
        setRoles(data || [])
      }
    } catch (error) {
      console.error('Roles refresh error:', error)
      Sentry.captureException(error, {
        tags: { auth: 'roles_refresh' },
        user: { id: user.id }
      })
    } finally {
      setRolesLoading(false)
    }
  }, [user?.id])

  // Refresh onboarding state
  const refreshOnboarding = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await getOnboardingState(user.id)
      if (error) {
        console.error('Failed to refresh onboarding:', error)
        Sentry.captureException(error.originalError, {
          tags: { auth: 'onboarding_refresh' },
          user: { id: user.id }
        })
      } else {
        setOnboarding(data)
      }
    } catch (error) {
      console.error('Onboarding refresh error:', error)
      Sentry.captureException(error, {
        tags: { auth: 'onboarding_refresh' },
        user: { id: user.id }
      })
    }
  }, [user?.id])

  // Track if extended user data has been loaded to avoid flicker in dev StrictMode
  const hasLoadedExtended = useRef(false)
  const initRef = useRef(false)

  const fetchAllUserData = useCallback(async (userId: string) => {
    try {
      const [profileResult, rolesResult, onboardingResult] = await Promise.all([
        getProfile(userId),
        getRolesFromMembers(userId),
        getOnboardingState(userId)
      ])
      if (profileResult.data) setProfile(profileResult.data)
      if (rolesResult.data) setRoles(rolesResult.data || [])
      if (onboardingResult.data) setOnboarding(onboardingResult.data)
    } catch (error) {
      console.error('Failed to load user data:', error)
      Sentry.captureException(error, {
        tags: { auth: 'initial_load' },
      })
    }
  }, [])

  // Handle auth state changes (sync only; defer async work)
  const handleAuthStateChange = useCallback((event: string, newSession: Session | null) => {
    console.log('Auth state change:', event, newSession?.user?.id)

    setSession(newSession)
    setUser(newSession?.user ?? null)

    // Clear extended data when signing out
    if (!newSession?.user) {
      setProfile(null)
      setRoles([])
      setOnboarding(null)
      setLoading(false)
      hasLoadedExtended.current = false
      return
    }

    // Set user context for Sentry
    Sentry.setUser({
      id: newSession.user.id,
      email: newSession.user.email
    })

    // Load extended user data on first load or explicit sign-in
    // Skip TOKEN_REFRESHED and other events to prevent loading flicker
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      const shouldLoad = event === 'SIGNED_IN' || !hasLoadedExtended.current
      if (shouldLoad) {
        setLoading(true)
        setTimeout(() => {
          fetchAllUserData(newSession.user!.id)
            .finally(() => {
              setLoading(false)
              hasLoadedExtended.current = true
            })
        }, 0)
      } else {
        // Already loaded, ensure loading is false
        setLoading(false)
      }
    } else {
      // For TOKEN_REFRESHED and other events, ensure loading stays false if data already loaded
      if (hasLoadedExtended.current) {
        setLoading(false)
      }
    }
  }, [fetchAllUserData])

  // Initialize auth state: subscribe first, then read session. Guard for StrictMode double-invoke.
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session)
    })

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleAuthStateChange('INITIAL_SESSION', initialSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [handleAuthStateChange])

  // Computed properties
  const isAuthenticated = !!(session && user)
  // Note: isSuperAdmin should be checked server-side via isSuperAdmin() function
  // This client-side flag is for UI convenience only and should not be trusted for security
  const isSuperAdmin = false // Always validate on server side
  const needsOnboarding = onboarding ? !onboarding.isComplete : false

  const value: AuthState = {
    // Core auth state
    session,
    user,
    
    // Extended user data
    profile,
    roles,
    onboarding,
    
    // Loading states
    loading,
    profileLoading,
    rolesLoading,
    
    // Actions
    refreshProfile,
    refreshRoles,
    refreshOnboarding,
    
    // Computed properties
    isAuthenticated,
    isSuperAdmin,
    needsOnboarding
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}