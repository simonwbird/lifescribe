import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitRequest {
  email: string
  ip_address?: string
  success: boolean
  user_agent?: string
}

interface RateLimitResponse {
  allowed: boolean
  requires_captcha: boolean
  locked_until?: string
  attempts_remaining?: number
  message: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, ip_address, success, user_agent }: RateLimitRequest = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clientIp = ip_address || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    console.log(`Rate limit check for email: ${email}, IP: ${clientIp}, success: ${success}`)

    // Create composite key for tracking
    const trackingKey = `${email}:${clientIp}`
    const now = new Date()
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)

    if (success) {
      // Clear failed attempts on successful login
      const { error: clearError } = await supabase
        .from('auth_rate_limits')
        .delete()
        .eq('tracking_key', trackingKey)

      if (clearError) {
        console.error('Error clearing rate limits:', clearError)
      }

      return new Response(
        JSON.stringify({
          allowed: true,
          requires_captcha: false,
          message: 'Success - rate limits cleared'
        } as RateLimitResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Track failed attempt
    const { error: insertError } = await supabase
      .from('auth_rate_limits')
      .insert({
        tracking_key: trackingKey,
        email: email,
        ip_address: clientIp,
        user_agent: user_agent,
        attempted_at: now.toISOString()
      })

    if (insertError) {
      console.error('Error inserting rate limit record:', insertError)
    }

    // Count recent failed attempts
    const { data: recentAttempts, error: countError } = await supabase
      .from('auth_rate_limits')
      .select('attempted_at')
      .eq('tracking_key', trackingKey)
      .gte('attempted_at', fifteenMinutesAgo.toISOString())
      .order('attempted_at', { ascending: false })

    if (countError) {
      console.error('Error counting attempts:', countError)
      // Fail open - allow the request if we can't check rate limits
      return new Response(
        JSON.stringify({
          allowed: true,
          requires_captcha: false,
          message: 'Rate limit check failed - allowing request'
        } as RateLimitResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const attemptCount = recentAttempts?.length || 0
    console.log(`Found ${attemptCount} recent attempts for ${trackingKey}`)

    // Determine response based on attempt count
    let response: RateLimitResponse

    if (attemptCount >= 5) {
      // 5+ attempts = 15-minute lockout
      const lockoutUntil = new Date(now.getTime() + 15 * 60 * 1000)
      
      // Update user profile with lockout
      const { error: lockoutError } = await supabase
        .from('profiles')
        .update({ locked_until: lockoutUntil.toISOString() })
        .eq('email', email)

      if (lockoutError) {
        console.error('Error setting lockout:', lockoutError)
      }

      response = {
        allowed: false,
        requires_captcha: false,
        locked_until: lockoutUntil.toISOString(),
        message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.'
      }
    } else if (attemptCount >= 3) {
      // 3-4 attempts = require captcha
      response = {
        allowed: false,
        requires_captcha: true,
        attempts_remaining: 5 - attemptCount,
        message: 'Too many failed attempts. Please complete the captcha to continue.'
      }
    } else {
      // < 3 attempts = allow with warning
      response = {
        allowed: true,
        requires_captcha: false,
        attempts_remaining: 3 - attemptCount,
        message: `${3 - attemptCount} attempts remaining before captcha required.`
      }
    }

    console.log(`Rate limit response:`, response)

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rate limit function error:', error)
    
    // Fail open - allow the request if something goes wrong
    return new Response(
      JSON.stringify({
        allowed: true,
        requires_captcha: false,
        message: 'Rate limit service unavailable - allowing request'
      } as RateLimitResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})