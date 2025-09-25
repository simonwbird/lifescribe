import { supabase } from '@/integrations/supabase/client'
import { Session, User, AuthError } from '@supabase/supabase-js'
import { mapAuthError, MappedAuthError } from './errors'
import { makeCancellable } from './network'

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpData extends AuthCredentials {
  fullName?: string
  metadata?: Record<string, any>
}

export interface AuthResponse<T = any> {
  data: T | null
  error: MappedAuthError | null
}

/**
 * Sign up a new user
 */
export async function signUp(
  { email, password, fullName, metadata = {} }: SignUpData,
  signal?: AbortSignal
): Promise<AuthResponse<{ user: User; session: Session | null }>> {
  try {
    const { data, error } = await makeCancellable(
      supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `https://lifescribe.family/auth/verify`,
          data: {
            full_name: fullName,
            ...metadata
          }
        }
      }),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error, {
          resendVerification: () => resendVerification(email)
        })
      }
    }

    return {
      data: { user: data.user!, session: data.session },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(
  { email, password }: AuthCredentials,
  signal?: AbortSignal
): Promise<AuthResponse<{ user: User; session: Session }>> {
  try {
    const { data, error } = await makeCancellable(
      supabase.auth.signInWithPassword({
        email,
        password
      }),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error, {
          resendVerification: () => resendVerification(email)
        })
      }
    }

    return {
      data: { user: data.user, session: data.session },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(signal?: AbortSignal): Promise<AuthResponse<void>> {
  try {
    const { error } = await makeCancellable(
      supabase.auth.signOut(),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: null,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string,
  signal?: AbortSignal
): Promise<AuthResponse<void>> {
  try {
    const { error } = await makeCancellable(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://lifescribe.family/auth/reset/confirm`
      }),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: null,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Resend email verification
 */
export async function resendVerification(
  email: string,
  signal?: AbortSignal
): Promise<AuthResponse<void>> {
  try {
    const { error } = await makeCancellable(
      supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `https://lifescribe.family/auth/verify`
        }
      }),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: null,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Get current session
 */
export async function getSession(signal?: AbortSignal): Promise<AuthResponse<Session>> {
  try {
    const { data, error } = await makeCancellable(
      supabase.auth.getSession(),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: data.session,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(signal?: AbortSignal): Promise<AuthResponse<Session>> {
  try {
    const { data, error } = await makeCancellable(
      supabase.auth.refreshSession(),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: data.session,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}

/**
 * Update user password (for authenticated users)
 */
export async function updatePassword(
  newPassword: string,
  signal?: AbortSignal
): Promise<AuthResponse<User>> {
  try {
    const { data, error } = await makeCancellable(
      supabase.auth.updateUser({
        password: newPassword
      }),
      signal
    )

    if (error) {
      return {
        data: null,
        error: mapAuthError(error)
      }
    }

    return {
      data: data.user,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: mapAuthError(error)
    }
  }
}