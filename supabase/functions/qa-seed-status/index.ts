import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client with service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Identify QA family
    let familyId: string | null = null

    // 1) Prefer explicit qa_seed marker if present
    const { data: qaFollowPrefs, error: followError } = await supabaseAdmin
      .from('digest_follow_preferences')
      .select('family_id')
      .eq('qa_seed', true)
      .limit(1)

    if (followError) {
      console.error('Error finding QA data (qa_seed marker):', followError)
      // don't return yet, we'll try a fallback
    }

    if (qaFollowPrefs && qaFollowPrefs.length > 0) {
      familyId = qaFollowPrefs[0].family_id as string
      console.log('QA seed status: using familyId from qa_seed marker')
    }

    // 2) Fallback: infer from current authenticated user's family memberships
    if (!familyId) {
      const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
      const token = authHeader?.split(' ')[1] ?? null

      if (token) {
        const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token)
        if (userErr) {
          console.error('Error fetching user from token:', userErr)
        }

        const userId = userRes?.user?.id
        if (userId) {
          // Try family_memberships first
          const { data: memberships, error: memErr } = await supabaseAdmin
            .from('family_memberships')
            .select('family_id')
            .eq('profile_id', userId)
            .eq('status', 'active')
            .limit(1)

          if (!memErr && memberships && memberships.length > 0) {
            familyId = memberships[0].family_id as string
            console.log('QA seed status: using familyId from family_memberships for user')
          } else {
            // Fallback to legacy members table if present
            const { data: membersAlt, error: membersAltErr } = await supabaseAdmin
              .from('members')
              .select('family_id')
              .eq('profile_id', userId)
              .limit(1)

            if (!membersAltErr && membersAlt && membersAlt.length > 0) {
              familyId = membersAlt[0].family_id as string
              console.log('QA seed status: using familyId from members table for user')
            }
          }
        }
      }
    }

    if (!familyId) {
      return new Response(
        JSON.stringify({ 
          success: true,
          status: null,
          message: 'No QA seeded data found'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const familyIdValue = familyId

    // Count entities using service role to bypass RLS
    const [
      { count: peopleCount },
      { count: storiesCount },
      { count: recipesCount },
      { count: propertiesCount },
      { count: tributesCount },
      { count: promptsCount },
      { count: digestSettingsCount },
      { count: followPrefsCount }
    ] = await Promise.all([
      supabaseAdmin.from('people').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('stories').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('recipes').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('properties').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('tributes').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('prompt_instances').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('weekly_digest_settings').select('id', { count: 'exact', head: true }).eq('family_id', familyId),
      supabaseAdmin.from('digest_follow_preferences').select('id', { count: 'exact', head: true }).eq('family_id', familyId)
    ])

    const status = {
      people: peopleCount || 0,
      stories: storiesCount || 0,
      recipes: recipesCount || 0,
      properties: propertiesCount || 0,
      tributes: tributesCount || 0,
      prompts: promptsCount || 0,
      digest_settings: digestSettingsCount || 0,
      follow_prefs: followPrefsCount || 0,
      total: (peopleCount || 0) + (storiesCount || 0) + (recipesCount || 0) + 
             (propertiesCount || 0) + (tributesCount || 0) + (promptsCount || 0) +
             (digestSettingsCount || 0) + (followPrefsCount || 0)
    }

    console.log('QA seed status:', status)

    return new Response(
      JSON.stringify({ 
        success: true,
        status,
        message: 'QA seed status retrieved successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in qa-seed-status:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        status: null,
        message: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
