import { supabase } from '@/integrations/supabase/client'

export interface RateLimitResponse {
  allowed: boolean
  requires_captcha: boolean
  locked_until?: string
  attempts_remaining?: number
  message: string
}

export interface RateLimitRequest {
  email: string
  success: boolean
  ip_address?: string
  user_agent?: string
}

/**
 * Check rate limiting status for authentication attempts
 */
export async function checkAuthRateLimit(
  email: string,
  success: boolean,
  captchaToken?: string
): Promise<RateLimitResponse> {
  try {
    const requestData: RateLimitRequest = {
      email,
      success,
      ip_address: undefined, // Will be filled by edge function
      user_agent: navigator.userAgent
    }

    console.log('Checking auth rate limit for:', email, 'success:', success)

    const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
      body: requestData
    })

    if (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow the request if rate limiting service is down
      return {
        allowed: true,
        requires_captcha: false,
        message: 'Rate limiting service unavailable - allowing request'
      }
    }

    console.log('Rate limit response:', data)
    return data as RateLimitResponse

  } catch (error) {
    console.error('Rate limit service error:', error)
    // Fail open on any error
    return {
      allowed: true,
      requires_captcha: false,
      message: 'Rate limiting service error - allowing request'
    }
  }
}

/**
 * Check if user is currently locked out
 */
export async function checkUserLockout(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_user_locked_out', {
      p_email: email
    })

    if (error) {
      console.error('Lockout check error:', error)
      return false // Fail open
    }

    return data || false
  } catch (error) {
    console.error('Lockout check service error:', error)
    return false // Fail open
  }
}