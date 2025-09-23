import { AuthError } from '@supabase/supabase-js'

export type AuthErrorCode = 
  | 'AUTH/INVALID_CREDENTIALS'
  | 'AUTH/EMAIL_NOT_VERIFIED' 
  | 'AUTH/RATE_LIMITED'
  | 'AUTH/SESSION_EXPIRED'
  | 'AUTH/NETWORK'
  | 'AUTH/UNKNOWN'

export interface MappedAuthError {
  code: AuthErrorCode
  message: string
  originalError: any
  actionable?: boolean
  action?: {
    label: string
    handler: () => void
  }
}

/**
 * Maps Supabase and network errors to standardized error codes
 */
export function mapAuthError(error: any, context?: { resendVerification?: () => void }): MappedAuthError {
  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code || error?.status
  
  // Invalid credentials
  if (
    errorMessage.includes('invalid login credentials') ||
    errorMessage.includes('email not confirmed') ||
    errorCode === 'invalid_credentials'
  ) {
    return {
      code: 'AUTH/INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please check your credentials and try again.',
      originalError: error,
      actionable: true
    }
  }
  
  // Email not verified
  if (
    errorMessage.includes('email not confirmed') ||
    errorMessage.includes('verify your email') ||
    errorCode === 'email_not_confirmed'
  ) {
    return {
      code: 'AUTH/EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address before signing in.',
      originalError: error,
      actionable: true,
      action: context?.resendVerification ? {
        label: 'Resend verification',
        handler: context.resendVerification
      } : undefined
    }
  }
  
  // Rate limiting
  if (
    errorMessage.includes('too many requests') ||
    errorMessage.includes('rate limit') ||
    errorCode === 'rate_limit_exceeded' ||
    errorCode === 429
  ) {
    return {
      code: 'AUTH/RATE_LIMITED',
      message: 'Too many attempts. Please wait a moment before trying again.',
      originalError: error,
      actionable: false
    }
  }
  
  // Session expired
  if (
    errorMessage.includes('jwt expired') ||
    errorMessage.includes('session expired') ||
    errorMessage.includes('refresh token') ||
    errorCode === 'token_expired'
  ) {
    return {
      code: 'AUTH/SESSION_EXPIRED',
      message: 'Your session has expired. Please sign in again.',
      originalError: error,
      actionable: true
    }
  }
  
  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    error instanceof TypeError ||
    errorCode >= 500
  ) {
    return {
      code: 'AUTH/NETWORK',
      message: 'Network error. Please check your connection and try again.',
      originalError: error,
      actionable: true
    }
  }
  
  // Unknown error
  return {
    code: 'AUTH/UNKNOWN',
    message: 'An unexpected error occurred. Please try again.',
    originalError: error,
    actionable: true
  }
}

/**
 * Creates user-friendly error messages for toast display
 */
export function getErrorToastConfig(error: MappedAuthError) {
  return {
    title: getErrorTitle(error.code),
    description: error.message,
    variant: 'destructive' as const,
    action: error.action
  }
}

function getErrorTitle(code: AuthErrorCode): string {
  switch (code) {
    case 'AUTH/INVALID_CREDENTIALS':
      return 'Invalid Credentials'
    case 'AUTH/EMAIL_NOT_VERIFIED':
      return 'Email Not Verified'
    case 'AUTH/RATE_LIMITED':
      return 'Too Many Attempts'
    case 'AUTH/SESSION_EXPIRED':
      return 'Session Expired'
    case 'AUTH/NETWORK':
      return 'Connection Error'
    case 'AUTH/UNKNOWN':
      return 'Authentication Error'
    default:
      return 'Error'
  }
}