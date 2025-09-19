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

    // Log analytics event
    await supabaseClient.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'RTBF_REQUESTED',
      properties: { type: 'dry_run' }
    })

    // Get user's family memberships to analyze impact
    const { data: memberships } = await supabaseClient
      .from('members')
      .select('family_id, families!inner(name)')
      .eq('profile_id', user.id)

    const familyIds = memberships?.map(m => m.family_id) || []
    const familyNames = memberships?.map(m => (m as any).families.name) || []

    // Analyze what will be deleted
    const deletionAnalysis = {
      user_data: {
        profile: 1,
        family_memberships: memberships?.length || 0,
        affected_families: familyNames,
      },
      content_data: {
        stories: 0,
        answers: 0,
        comments: 0,
        reactions: 0,
        media_files: 0,
        recipes: 0,
        properties: 0,
        pets: 0,
        face_tags: 0,
        guestbook_entries: 0,
      },
      impact_analysis: {
        total_items: 0,
        affected_families: familyNames.length,
        orphaned_content: [],
        shared_content_warnings: [],
      }
    }

    if (familyIds.length > 0) {
      // Count stories
      const { count: storiesCount } = await supabaseClient
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.stories = storiesCount || 0

      // Count answers
      const { count: answersCount } = await supabaseClient
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.answers = answersCount || 0

      // Count comments
      const { count: commentsCount } = await supabaseClient
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.comments = commentsCount || 0

      // Count reactions
      const { count: reactionsCount } = await supabaseClient
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.reactions = reactionsCount || 0

      // Count media files
      const { count: mediaCount } = await supabaseClient
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.media_files = mediaCount || 0

      // Count recipes
      const { count: recipesCount } = await supabaseClient
        .from('recipes')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.recipes = recipesCount || 0

      // Count properties
      const { count: propertiesCount } = await supabaseClient
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.properties = propertiesCount || 0

      // Count pets
      const { count: petsCount } = await supabaseClient
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.pets = petsCount || 0

      // Count face tags
      const { count: faceTagsCount } = await supabaseClient
        .from('face_tags')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.face_tags = faceTagsCount || 0

      // Count guestbook entries
      const { count: guestbookCount } = await supabaseClient
        .from('guestbook')
        .select('*', { count: 'exact', head: true })
        .eq('author_profile_id', user.id)
        .in('family_id', familyIds)
      deletionAnalysis.content_data.guestbook_entries = guestbookCount || 0

      // Check for shared content that might be orphaned
      if (deletionAnalysis.content_data.stories > 0) {
        const { data: storiesWithComments } = await supabaseClient
          .from('stories')
          .select('id, title, comments(count)')
          .eq('profile_id', user.id)
          .in('family_id', familyIds)
          .limit(5)

        if (storiesWithComments) {
          deletionAnalysis.impact_analysis.orphaned_content.push({
            type: 'stories_with_comments',
            items: storiesWithComments.map(s => ({
              id: s.id,
              title: s.title,
              comment_count: (s as any).comments?.length || 0
            }))
          })
        }
      }
    }

    // Calculate total items
    deletionAnalysis.impact_analysis.total_items = 
      deletionAnalysis.user_data.profile +
      deletionAnalysis.user_data.family_memberships +
      Object.values(deletionAnalysis.content_data).reduce((sum, count) => sum + count, 0)

    // Add warnings for shared content
    if (deletionAnalysis.content_data.stories > 0) {
      deletionAnalysis.impact_analysis.shared_content_warnings.push(
        `${deletionAnalysis.content_data.stories} stories will be permanently deleted`
      )
    }
    if (deletionAnalysis.content_data.comments > 0) {
      deletionAnalysis.impact_analysis.shared_content_warnings.push(
        `${deletionAnalysis.content_data.comments} comments on family stories will be removed`
      )
    }
    if (deletionAnalysis.content_data.media_files > 0) {
      deletionAnalysis.impact_analysis.shared_content_warnings.push(
        `${deletionAnalysis.content_data.media_files} media files will be permanently deleted`
      )
    }

    return new Response(JSON.stringify({
      analysis_id: crypto.randomUUID(),
      user_id: user.id,
      analyzed_at: new Date().toISOString(),
      deletion_analysis: deletionAnalysis,
      warnings: [
        "This action cannot be undone",
        "All your content will be permanently deleted",
        "Other family members will lose access to content you created",
        "Comments and reactions on your content will also be removed",
        "Your family tree connections will be severed"
      ],
      next_steps: [
        "Review all content that will be deleted",
        "Consider exporting your data first",
        "Confirm deletion with dual-control verification",
        "Process cannot be stopped once started"
      ]
    }, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('RTBF analysis error:', error)
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})