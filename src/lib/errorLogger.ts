import * as Sentry from '@sentry/react'
import { supabase } from '@/lib/supabase'

interface LogErrorParams {
  route: string
  error: Error | string
  userId?: string
  familyId?: string
}

/**
 * Logs errors to Sentry if DSN is configured, otherwise to error_logs table
 */
export async function logError({ route, error, userId, familyId }: LogErrorParams) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack
  
  // Always try Sentry first if configured
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: { route },
      user: userId ? { id: userId } : undefined,
      extra: {
        familyId,
        route,
      }
    })
  }
  
  // Also log to database for local tracking
  try {
    await supabase.from('error_logs').insert({
      route,
      error: errorMessage,
      error_stack: errorStack,
      user_id: userId || null,
      family_id: familyId || null,
      user_agent: navigator.userAgent,
    })
  } catch (dbError) {
    // Silently fail if database logging fails
    console.error('Failed to log error to database:', dbError)
  }
}
