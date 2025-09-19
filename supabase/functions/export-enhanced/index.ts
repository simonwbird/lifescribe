import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

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

    const body = await req.json()
    const { includeMedia = true } = body || {}

    // Log analytics event
    await supabaseClient.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'EXPORT_REQUESTED',
      properties: { include_media: includeMedia }
    })

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
      export_version: '2.0',
      include_media: includeMedia,
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

      // Get other content
      const { data: recipes } = await supabaseClient
        .from('recipes')
        .select('*')
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      exportData.recipes = recipes

      const { data: properties } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      exportData.properties = properties

      const { data: pets } = await supabaseClient
        .from('pets')
        .select('*')
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      exportData.pets = pets
    }

    // Calculate data size estimates
    const jsonSize = new TextEncoder().encode(JSON.stringify(exportData)).length
    let totalSize = jsonSize
    let mediaCount = 0

    if (includeMedia && exportData.media) {
      mediaCount = exportData.media.length
      // Estimate media size (rough calculation)
      totalSize += exportData.media.reduce((acc: number, m: any) => acc + (m.file_size || 0), 0)
    }

    // Create ZIP structure (simplified - in production, you'd use a proper ZIP library)
    const zipContents = {
      'data/index.json': JSON.stringify(exportData, null, 2),
      'data/summary.json': JSON.stringify({
        export_date: new Date().toISOString(),
        user_id: user.id,
        total_stories: exportData.stories?.length || 0,
        total_photos: exportData.media?.filter((m: any) => m.mime_type?.startsWith('image/')).length || 0,
        total_audio: exportData.media?.filter((m: any) => m.mime_type?.startsWith('audio/')).length || 0,
        total_comments: exportData.comments?.length || 0,
        total_reactions: exportData.reactions?.length || 0,
        estimated_size_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      }, null, 2),
      'README.txt': `Family Data Export
Generated: ${new Date().toISOString()}
User: ${user.email}

This export contains:
- Your profile information
- Stories you've created
- Comments you've made
- Reactions you've given
- Media files you've uploaded
- Other content you've created

File Structure:
- data/index.json: Complete data export
- data/summary.json: Export summary
- media/: Your uploaded files (if included)
- README.txt: This file
`
    }

    // Log completion
    await supabaseClient.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'EXPORT_COMPLETED',
      properties: { 
        include_media: includeMedia,
        estimated_size_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        media_count: mediaCount
      }
    })

    // For now, return JSON structure (in production, would create actual ZIP)
    return new Response(JSON.stringify({
      export_id: crypto.randomUUID(),
      status: 'ready',
      estimated_size_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      media_count: mediaCount,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      download_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/export-data`, // Fallback
      zip_contents: zipContents,
    }, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
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