import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JoinByCodeRequest {
  code: string
}

// Rate limiting storage (in-memory for demo, should use Redis in production)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { attempts: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    return true
  }
  
  record.attempts++
  return false
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const { code }: JoinByCodeRequest = await req.json()

    if (!code || code.length < 4 || code.length > 8) {
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Rate limiting by user ID + IP
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = `${user.id}:${clientIP}`
    
    if (isRateLimited(rateLimitKey)) {
      // Track rate limit event
      await supabase.from('analytics_events').insert({
        event_name: 'CODE_RATE_LIMITED',
        user_id: user.id,
        family_id: null,
        properties: {
          code_attempted: code,
          rate_limit_key: rateLimitKey,
          max_attempts: MAX_ATTEMPTS
        }
      })

      return new Response(JSON.stringify({ 
        error: 'Too many attempts. Please wait 15 minutes before trying again.',
        error_code: 'RATE_LIMITED'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Find the invite by code
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        *,
        families:family_id (
          id,
          name,
          status
        )
      `)
      .eq('code', code.toUpperCase())
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      // Track invalid code event
      await supabase.from('analytics_events').insert({
        event_name: 'CODE_INVALID',
        user_id: user.id,
        family_id: null,
        properties: {
          code_attempted: code,
          error_reason: 'code_not_found'
        }
      })

      return new Response(JSON.stringify({ 
        error: 'Invalid family code. Please check the code and try again.',
        error_code: 'INVALID_CODE'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Check if code is expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      // Track expired code event
      await supabase.from('analytics_events').insert({
        event_name: 'CODE_EXPIRED',
        user_id: user.id,
        family_id: invite.family_id,
        properties: {
          code_id: invite.id,
          code_attempted: code,
          expired_at: invite.expires_at
        }
      })

      return new Response(JSON.stringify({ 
        error: 'This family code has expired. Please request a new one.',
        error_code: 'EXPIRED_CODE',
        family_name: invite.families?.name
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Check if max uses exceeded
    if (invite.used_count >= invite.max_uses) {
      return new Response(JSON.stringify({ 
        error: 'This family code has been used too many times. Please request a new one.',
        error_code: 'CODE_EXHAUSTED',
        family_name: invite.families?.name
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('members')
      .select('id, role')
      .eq('profile_id', user.id)
      .eq('family_id', invite.family_id)
      .single()

    if (existingMember) {
      return new Response(JSON.stringify({ 
        error: 'You are already a member of this family.',
        error_code: 'ALREADY_MEMBER',
        family_name: invite.families?.name
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Check feature flag
    const flagResult = await supabase.rpc('evaluate_feature_flag', {
      p_flag_key: 'onboarding.codes_v1',
      p_user_id: user.id,
      p_family_id: invite.family_id
    })

    if (!flagResult.data?.enabled) {
      return new Response(JSON.stringify({ error: 'Family codes feature not available' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Create membership
    const { data: membership, error: membershipError } = await supabase
      .from('members')
      .insert({
        profile_id: user.id,
        family_id: invite.family_id,
        role: invite.role || 'member'
      })
      .select('*')
      .single()

    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return new Response(JSON.stringify({ error: 'Failed to join family' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Update invite usage count
    await supabase
      .from('invites')
      .update({ 
        used_count: invite.used_count + 1,
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    // Track successful join
    await supabase.from('analytics_events').insert({
      event_name: 'CODE_CONSUMED',
      user_id: user.id,
      family_id: invite.family_id,
      properties: {
        code_id: invite.id,
        code_type: 'family_join',
        family_id: invite.family_id,
        success: true,
        join_method: 'code'
      }
    })

    // Track join completed
    await supabase.from('analytics_events').insert({
      event_name: 'JOIN_COMPLETED',
      user_id: user.id,
      family_id: invite.family_id,
      properties: {
        join_method: 'code',
        family_id: invite.family_id,
        role_assigned: invite.role || 'member'
      }
    })

    console.log(`User ${user.id} successfully joined family ${invite.family_id} via code ${code}`)

    return new Response(JSON.stringify({
      success: true,
      family: {
        id: invite.family_id,
        name: invite.families?.name
      },
      membership: {
        id: membership.id,
        role: membership.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error: any) {
    console.error('Error in join-by-code function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
}

serve(handler)