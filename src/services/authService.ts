import { supabase } from '@/integrations/supabase/client'
import { checkAuthRateLimit, checkUserLockout } from './authRateLimit'
import { mapAuthError, type MappedAuthError } from './errors'
import type { AuthError } from '@supabase/supabase-js'

export interface AuthResponse<T = any> {
  data?: T
  error?: MappedAuthError
  rateLimitInfo?: {
    allowed: boolean
    requires_captcha: boolean
    locked_until?: string
    attempts_remaining?: number
  }
}

export interface SignInCredentials {
  email: string
  password: string
  captchaToken?: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName?: string
  captchaToken?: string
}

/**
 * Enhanced sign in with rate limiting and timeout support
 */
export async function signInWithPassword(
  credentials: SignInCredentials,
  signal?: AbortSignal
): Promise<AuthResponse> {
  const { email, password, captchaToken } = credentials

  try {
    // Check if user is locked out
    const isLockedOut = await checkUserLockout(email)
    if (isLockedOut) {
      return {
        error: {
          code: 'AUTH/RATE_LIMITED',
          message: 'Account is temporarily locked. Please try again later.',
          originalError: new Error('Account locked'),
          actionable: false
        }
      }
    }

    // Check rate limiting before attempting sign in
    const rateLimitCheck = await checkAuthRateLimit(email, false)
    
    if (!rateLimitCheck.allowed) {
      return {
        error: {
          code: rateLimitCheck.requires_captcha ? 'AUTH/CAPTCHA_REQUIRED' : 'AUTH/RATE_LIMITED',
          message: rateLimitCheck.message,
          originalError: new Error('Rate limited'),
          actionable: rateLimitCheck.requires_captcha
        },
        rateLimitInfo: rateLimitCheck
      }
    }

    // If captcha is required but not provided
    if (rateLimitCheck.requires_captcha && !captchaToken) {
      return {
        error: {
          code: 'AUTH/CAPTCHA_REQUIRED',
          message: 'Please complete the security verification.',
          originalError: new Error('Captcha required'),
          actionable: true
        },
        rateLimitInfo: rateLimitCheck
      }
    }

    // Attempt sign in with timeout support
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    // Handle authentication result
    if (error) {
      // Track failed attempt
      await checkAuthRateLimit(email, false)
      
      const mappedError = mapAuthError(error)
      return { error: mappedError }
    }

    if (data.user) {
      // Track successful login (clears rate limits)
      await checkAuthRateLimit(email, true)
      
      return { data: data.user }
    }

    return {
      error: {
        code: 'AUTH/UNKNOWN',
        message: 'Sign in failed for unknown reason',
        originalError: new Error('Unknown error'),
        actionable: true
      }
    }

  } catch (err) {
    // Track failed attempt on any error
    await checkAuthRateLimit(email, false)
    
    const mappedError = mapAuthError(err)
    return { error: mappedError }
  }
}

/**
 * Enhanced sign up with rate limiting
 */
export async function signUpWithPassword(
  credentials: SignUpCredentials,
  signal?: AbortSignal
): Promise<AuthResponse> {
  const { email, password, fullName, captchaToken } = credentials

  try {
    // Check rate limiting for sign up attempts
    const rateLimitCheck = await checkAuthRateLimit(email, false)
    
    if (!rateLimitCheck.allowed && rateLimitCheck.requires_captcha && !captchaToken) {
      return {
        error: {
          code: 'AUTH/CAPTCHA_REQUIRED',
          message: 'Please complete the security verification.',
          originalError: new Error('Captcha required'),
          actionable: true
        },
        rateLimitInfo: rateLimitCheck
      }
    }

    const redirectUrl = `${window.location.origin}/`
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: fullName ? { full_name: fullName } : undefined
      }
    })

    if (error) {
      const mappedError = mapAuthError(error)
      return { error: mappedError }
    }

    if (data.user) {
      // Track successful signup
      await checkAuthRateLimit(email, true)
      return { data: data.user }
    }

    return {
      error: {
        code: 'AUTH/UNKNOWN',
        message: 'Sign up failed for unknown reason',
        originalError: new Error('Unknown error'),
        actionable: true
      }
    }

  } catch (err) {
    const mappedError = mapAuthError(err)
    return { error: mappedError }
  }
}

/**
 * Sign out with cleanup
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      const mappedError = mapAuthError(error)
      return { error: mappedError }
    }

    return { data: true }
  } catch (err) {
    const mappedError = mapAuthError(err)
    return { error: mappedError }
  }
}

/**
 * Reset password with rate limiting
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const redirectUrl = `${window.location.origin}/auth/reset/confirm`
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    })

    if (error) {
      const mappedError = mapAuthError(error)
      return { error: mappedError }
    }

    return { data: true }
  } catch (err) {
    const mappedError = mapAuthError(err)
    return { error: mappedError }
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      const mappedError = mapAuthError(error)
      return { error: mappedError }
    }

    return { data: data.user }
  } catch (err) {
    const mappedError = mapAuthError(err)
    return { error: mappedError }
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const redirectUrl = `${window.location.origin}/auth/callback`

    // Get the OAuth URL without attempting to open a popup (works inside iframes)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' }
      }
    })

    if (error) {
      const mappedError = mapAuthError(error)
      return { error: mappedError }
    }

    if (data?.url) {
      try {
        if (window.top) {
          window.top.location.href = data.url
        } else {
          window.location.href = data.url
        }
      } catch {
        window.location.href = data.url
      }
      return { data: true }
    }

    return {
      error: {
        code: 'AUTH/UNKNOWN',
        message: 'Could not initiate Google sign-in',
        originalError: new Error('Missing OAuth URL'),
        actionable: true
      }
    }
  } catch (err) {
    const mappedError = mapAuthError(err)
    return { error: mappedError }
  }
}