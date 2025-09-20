import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Get family ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const familyId = pathParts[pathParts.length - 2] // /families/{id}/verify

    if (!familyId) {
      return new Response(
        JSON.stringify({ error: 'Family ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin of this family
    const { data: membership } = await supabaseClient
      .from('members')
      .select('role')
      .eq('profile_id', user.id)
      .eq('family_id', familyId)
      .eq('role', 'admin')
      .single()

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Only family admins can verify families' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the family
    const { data: family, error: updateError } = await supabaseClient
      .from('families')
      .update({
        status: 'active',
        verified_at: new Date().toISOString()
      })
      .eq('id', familyId)
      .eq('status', 'provisional')
      .select()
      .single()

    if (updateError) {
      console.error('Error verifying family:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify family' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!family) {
      return new Response(
        JSON.stringify({ error: 'Family not found or already verified' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log audit event
    await supabaseClient
      .select('log_audit_event')
      .rpc('log_audit_event', {
        p_actor_id: user.id,
        p_action: 'FAMILY_VERIFIED',
        p_entity_type: 'family',
        p_entity_id: familyId,
        p_family_id: familyId,
        p_details: { verification_type: 'manual' }
      })

    console.log(`Family ${familyId} manually verified by admin ${user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        family: {
          id: family.id,
          name: family.name,
          status: family.status,
          verified_at: family.verified_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in families-verify function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})