import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCodeRequest {
  familyId: string
  expiresInHours?: number
  maxUses?: number
}

interface JoinByCodeRequest {
  code: string
}

// Crockford Base32 alphabet (excludes similar looking characters)
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function generateFamilyCode(length: number = 6): string {
  let code = ''
  const crypto = globalThis.crypto
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(crypto.getRandomValues(new Uint8Array(1))[0] / 256 * CROCKFORD_ALPHABET.length)
    code += CROCKFORD_ALPHABET[randomIndex]
  }
  
  return code
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // POST /families/{id}/codes - Create a family code
    if (req.method === 'POST' && pathSegments[1] === 'families' && pathSegments[3] === 'codes') {
      const familyId = pathSegments[2]
      const { expiresInHours = 72, maxUses = 10 }: CreateCodeRequest = await req.json()

      // Check if user is admin of the family
      const { data: membership } = await supabase
        .from('members')
        .select('role')
        .eq('profile_id', user.id)
        .eq('family_id', familyId)
        .single()

      if (!membership || membership.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Only family admins can create codes' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Check feature flag
      const flagResult = await supabase.rpc('evaluate_feature_flag', {
        p_flag_key: 'onboarding.codes_v1',
        p_user_id: user.id,
        p_family_id: familyId
      })

      if (!flagResult.data?.enabled) {
        return new Response(JSON.stringify({ error: 'Family codes feature not enabled' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Generate unique code
      let code: string
      let attempts = 0
      const maxAttempts = 10

      do {
        code = generateFamilyCode(6)
        attempts++
        
        const { data: existingCode } = await supabase
          .from('invites')
          .select('id')
          .eq('code', code)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single()

        if (!existingCode) break

        if (attempts >= maxAttempts) {
          return new Response(JSON.stringify({ error: 'Failed to generate unique code' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }
      } while (true)

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expiresInHours)

      // Create the invite with code
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert({
          family_id: familyId,
          invited_by: user.id,
          role: 'member',
          status: 'pending',
          code: code,
          max_uses: maxUses,
          expires_at: expiresAt.toISOString(),
          email: `code-${code}@internal.placeholder` // Placeholder email for code invites
        })
        .select('*')
        .single()

      if (inviteError) {
        console.error('Error creating invite:', inviteError)
        return new Response(JSON.stringify({ error: 'Failed to create family code' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Track telemetry
      await supabase.from('analytics_events').insert({
        event_name: 'CODE_CREATED',
        user_id: user.id,
        family_id: familyId,
        properties: {
          code_id: invite.id,
          code_type: 'family_join',
          expires_at: expiresAt.toISOString(),
          max_uses: maxUses,
          created_by_role: 'admin'
        }
      })

      console.log(`Family code created: ${code} for family ${familyId}`)

      return new Response(JSON.stringify({
        code: code,
        invite_id: invite.id,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
        used_count: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error: any) {
    console.error('Error in family-codes function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
}

serve(handler)