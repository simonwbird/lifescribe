import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user's family memberships
    const { data: memberships } = await supabaseClient
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)

    const familyIds = memberships?.map(m => m.family_id) || []

    // Collect all user data
    const exportData: any = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      exported_at: new Date().toISOString(),
    }

    // Get profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      exportData.profile = profile
    }

    // Get family data
    if (familyIds.length > 0) {
      const { data: families } = await supabaseClient
        .from('families')
        .select('*')
        .in('id', familyIds)
      
      exportData.families = families

      // Get stories authored by user
      const { data: stories } = await supabaseClient
        .from('stories')
        .select('*')
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      exportData.stories = stories

      // Get answers by user
      const { data: answers } = await supabaseClient
        .from('answers')
        .select('*')
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      exportData.answers = answers

      // Get comments by user
      const { data: comments } = await supabaseClient
        .from('comments')
        .select('*')
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      exportData.comments = comments

      // Get reactions by user
      const { data: reactions } = await supabaseClient
        .from('reactions')
        .select('*')
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      exportData.reactions = reactions

      // Get media authored by user
      const { data: media } = await supabaseClient
        .from('media')
        .select('*')
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      exportData.media = media

      // Get recipes created by user  
      const { data: recipes } = await supabaseClient
        .from('recipes')
        .select('*')
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      exportData.recipes = recipes

      // Get properties created by user
      const { data: properties } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      exportData.properties = properties

      // Get pets created by user
      const { data: pets } = await supabaseClient
        .from('pets')
        .select('*')
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      exportData.pets = pets
    }

    // Return JSON data (could be enhanced to create a ZIP file)
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="family-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json"`
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})