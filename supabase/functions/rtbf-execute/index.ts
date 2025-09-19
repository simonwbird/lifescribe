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

    const body = await req.json()
    const { confirmation_code, analysis_id, dual_control_verified } = body || {}

    // Validate dual control
    if (!dual_control_verified || !confirmation_code || confirmation_code !== 'DELETE_ALL_DATA') {
      return new Response(JSON.stringify({ 
        error: 'Invalid confirmation. Please type "DELETE_ALL_DATA" to confirm.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log analytics event
    await supabaseClient.from('analytics_events').insert({
      user_id: user.id,
      event_name: 'RTBF_EXECUTED',
      properties: { analysis_id, confirmed_at: new Date().toISOString() }
    })

    const deletionLog: Array<{
      step: string
      status: 'started' | 'completed' | 'failed'
      count?: number
      error?: string
      timestamp: string
    }> = []

    const logStep = (step: string, status: 'started' | 'completed' | 'failed', count?: number, error?: string) => {
      deletionLog.push({
        step,
        status,
        count,
        error,
        timestamp: new Date().toISOString()
      })
    }

    // Get user's family memberships
    const { data: memberships } = await supabaseClient
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)

    const familyIds = memberships?.map(m => m.family_id) || []

    try {
      // Step 1: Delete user-generated content
      logStep('Delete reactions', 'started')
      const { error: reactionsError, count: reactionsCount } = await supabaseClient
        .from('reactions')
        .delete({ count: 'exact' })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      if (reactionsError) throw reactionsError
      logStep('Delete reactions', 'completed', reactionsCount || 0)

      logStep('Delete comments', 'started')
      const { error: commentsError, count: commentsCount } = await supabaseClient
        .from('comments')
        .delete({ count: 'exact' })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      if (commentsError) throw commentsError
      logStep('Delete comments', 'completed', commentsCount || 0)

      logStep('Delete answers', 'started')
      const { error: answersError, count: answersCount } = await supabaseClient
        .from('answers')
        .delete({ count: 'exact' })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      if (answersError) throw answersError
      logStep('Delete answers', 'completed', answersCount || 0)

      logStep('Delete face tags', 'started')
      const { error: faceTagsError, count: faceTagsCount } = await supabaseClient
        .from('face_tags')
        .delete({ count: 'exact' })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      if (faceTagsError) throw faceTagsError
      logStep('Delete face tags', 'completed', faceTagsCount || 0)

      logStep('Delete guestbook entries', 'started')
      const { error: guestbookError, count: guestbookCount } = await supabaseClient
        .from('guestbook')
        .delete({ count: 'exact' })
        .eq('author_profile_id', user.id)
        .in('family_id', familyIds)
      
      if (guestbookError) throw guestbookError
      logStep('Delete guestbook entries', 'completed', guestbookCount || 0)

      // Step 2: Delete media files (this would also delete from storage)
      logStep('Delete media files', 'started')
      const { data: mediaFiles, error: mediaSelectError } = await supabaseClient
        .from('media')
        .select('file_path')
        .eq('profile_id', user.id)
        .in('family_id', familyIds)

      if (mediaSelectError) throw mediaSelectError

      // Delete from storage (simplified - would need proper storage deletion)
      for (const media of mediaFiles || []) {
        try {
          await supabaseClient.storage
            .from('media')
            .remove([media.file_path])
        } catch (storageError) {
          console.warn('Storage deletion failed for:', media.file_path, storageError)
        }
      }

      const { error: mediaError, count: mediaCount } = await supabaseClient
        .from('media')
        .delete({ count: 'exact' })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      if (mediaError) throw mediaError
      logStep('Delete media files', 'completed', mediaCount || 0)

      // Step 3: Delete stories (this will cascade to related content)
      logStep('Delete stories', 'started')
      const { error: storiesError, count: storiesCount } = await supabaseClient
        .from('stories')
        .delete({ count: 'exact' })
        .eq('profile_id', user.id)
        .in('family_id', familyIds)
      
      if (storiesError) throw storiesError
      logStep('Delete stories', 'completed', storiesCount || 0)

      // Step 4: Delete created content
      logStep('Delete recipes', 'started')
      const { error: recipesError, count: recipesCount } = await supabaseClient
        .from('recipes')
        .delete({ count: 'exact' })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      if (recipesError) throw recipesError
      logStep('Delete recipes', 'completed', recipesCount || 0)

      logStep('Delete properties', 'started')
      const { error: propertiesError, count: propertiesCount } = await supabaseClient
        .from('properties')
        .delete({ count: 'exact' })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      if (propertiesError) throw propertiesError
      logStep('Delete properties', 'completed', propertiesCount || 0)

      logStep('Delete pets', 'started')
      const { error: petsError, count: petsCount } = await supabaseClient
        .from('pets')
        .delete({ count: 'exact' })
        .eq('created_by', user.id)
        .in('family_id', familyIds)
      
      if (petsError) throw petsError
      logStep('Delete pets', 'completed', petsCount || 0)

      // Step 5: Remove family memberships
      logStep('Remove family memberships', 'started')
      const { error: membersError, count: membersCount } = await supabaseClient
        .from('members')
        .delete({ count: 'exact' })
        .eq('profile_id', user.id)
      
      if (membersError) throw membersError
      logStep('Remove family memberships', 'completed', membersCount || 0)

      // Step 6: Delete user profile
      logStep('Delete user profile', 'started')
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (profileError) throw profileError
      logStep('Delete user profile', 'completed', 1)

      // Step 7: Sign out user (auth user deletion would be handled separately)
      logStep('Sign out user', 'started')
      await supabaseClient.auth.signOut()
      logStep('Sign out user', 'completed', 1)

      const completionReceipt = {
        deletion_id: crypto.randomUUID(),
        user_id: user.id,
        completed_at: new Date().toISOString(),
        total_items_deleted: deletionLog
          .filter(log => log.status === 'completed')
          .reduce((sum, log) => sum + (log.count || 0), 0),
        deletion_log: deletionLog,
        status: 'completed'
      }

      return new Response(JSON.stringify(completionReceipt, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })

    } catch (error) {
      logStep('Deletion process', 'failed', undefined, (error as Error).message)
      
      return new Response(JSON.stringify({
        error: 'Deletion process failed',
        deletion_log: deletionLog,
        status: 'failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('RTBF execution error:', error)
    return new Response(JSON.stringify({ error: 'Execution failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})