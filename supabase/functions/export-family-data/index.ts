import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  familyId: string
  exportType: 'stories' | 'engagement' | 'members' | 'full'
  format: 'json' | 'csv'
  dateRange?: {
    start: string
    end: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { familyId, exportType, format, dateRange }: ExportRequest = await req.json()

    // Verify user is admin of the family
    const { data: memberCheck, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('family_id', familyId)
      .eq('profile_id', user.id)
      .single()

    if (memberError || memberCheck?.role !== 'admin') {
      console.error('Authorization failed:', memberError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let exportData: any = {}
    let filename = `family-export-${new Date().toISOString().split('T')[0]}`

    // Build date filter if provided
    const dateFilter = dateRange ? {
      gte: dateRange.start,
      lte: dateRange.end
    } : null

    console.log(`Exporting ${exportType} data for family ${familyId}`)

    switch (exportType) {
      case 'stories': {
        let query = supabase
          .from('stories')
          .select(`
            id, title, content, occurred_on, is_approx, tags, 
            created_at, updated_at,
            profiles:profile_id (full_name, email),
            comments:comments (
              id, content, created_at,
              profiles:profile_id (full_name)
            ),
            reactions:reactions (
              id, reaction_type, created_at,
              profiles:profile_id (full_name)
            )
          `)
          .eq('family_id', familyId)
          .order('created_at', { ascending: false })

        if (dateFilter) {
          query = query.gte('created_at', dateFilter.gte).lte('created_at', dateFilter.lte)
        }

        const { data: stories, error: storiesError } = await query

        if (storiesError) throw storiesError

        exportData = {
          stories: stories || [],
          metadata: {
            totalStories: stories?.length || 0,
            dateRange: dateRange || 'all time',
            exportedAt: new Date().toISOString()
          }
        }
        filename = `stories-export-${familyId}-${new Date().toISOString().split('T')[0]}`
        break
      }

      case 'engagement': {
        // Get engagement stats
        const [storiesResult, commentsResult, reactionsResult] = await Promise.all([
          supabase
            .from('stories')
            .select('id, created_at, profiles:profile_id (full_name)')
            .eq('family_id', familyId)
            .gte('created_at', dateRange?.start || '2020-01-01')
            .lte('created_at', dateRange?.end || new Date().toISOString()),
          
          supabase
            .from('comments')
            .select('id, created_at, profiles:profile_id (full_name)')
            .eq('family_id', familyId)
            .gte('created_at', dateRange?.start || '2020-01-01')
            .lte('created_at', dateRange?.end || new Date().toISOString()),
          
          supabase
            .from('reactions')
            .select('id, reaction_type, created_at, profiles:profile_id (full_name)')
            .eq('family_id', familyId)
            .gte('created_at', dateRange?.start || '2020-01-01')
            .lte('created_at', dateRange?.end || new Date().toISOString())
        ])

        if (storiesResult.error) throw storiesResult.error
        if (commentsResult.error) throw commentsResult.error
        if (reactionsResult.error) throw reactionsResult.error

        // Calculate engagement metrics
        const stories = storiesResult.data || []
        const comments = commentsResult.data || []
        const reactions = reactionsResult.data || []

        // Group by month for trends
        const monthlyEngagement = new Map()
        
        stories.forEach(story => {
          const month = new Date(story.created_at).toISOString().substring(0, 7)
          if (!monthlyEngagement.has(month)) {
            monthlyEngagement.set(month, { stories: 0, comments: 0, reactions: 0 })
          }
          monthlyEngagement.get(month).stories++
        })

        comments.forEach(comment => {
          const month = new Date(comment.created_at).toISOString().substring(0, 7)
          if (!monthlyEngagement.has(month)) {
            monthlyEngagement.set(month, { stories: 0, comments: 0, reactions: 0 })
          }
          monthlyEngagement.get(month).comments++
        })

        reactions.forEach(reaction => {
          const month = new Date(reaction.created_at).toISOString().substring(0, 7)
          if (!monthlyEngagement.has(month)) {
            monthlyEngagement.set(month, { stories: 0, comments: 0, reactions: 0 })
          }
          monthlyEngagement.get(month).reactions++
        })

        exportData = {
          summary: {
            totalStories: stories.length,
            totalComments: comments.length,
            totalReactions: reactions.length,
            engagementRate: stories.length > 0 ? ((comments.length + reactions.length) / stories.length).toFixed(2) : '0'
          },
          monthlyTrends: Array.from(monthlyEngagement.entries()).map(([month, data]) => ({
            month,
            ...data
          })).sort((a, b) => a.month.localeCompare(b.month)),
          topContributors: Object.entries(
            stories.reduce((acc: any, story: any) => {
              const author = (story.profiles as any)?.full_name || 'Unknown'
              acc[author] = (acc[author] || 0) + 1
              return acc
            }, {})
          ).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 10),
          metadata: {
            dateRange: dateRange || 'all time',
            exportedAt: new Date().toISOString()
          }
        }
        filename = `engagement-export-${familyId}-${new Date().toISOString().split('T')[0]}`
        break
      }

      case 'members': {
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select(`
            id, role, status, joined_at,
            profiles:profile_id (
              full_name, email, created_at, simple_mode,
              settings
            )
          `)
          .eq('family_id', familyId)
          .order('joined_at', { ascending: true })

        if (membersError) throw membersError

        exportData = {
          members: members || [],
          metadata: {
            totalMembers: members?.length || 0,
            adminCount: members?.filter(m => m.role === 'admin').length || 0,
            exportedAt: new Date().toISOString()
          }
        }
        filename = `members-export-${familyId}-${new Date().toISOString().split('T')[0]}`
        break
      }

      case 'full': {
        // Comprehensive export
        const [storiesResult, membersResult, invitesResult] = await Promise.all([
          supabase
            .from('stories')
            .select(`
              id, title, content, occurred_on, tags, created_at,
              profiles:profile_id (full_name, email)
            `)
            .eq('family_id', familyId)
            .order('created_at', { ascending: false }),
          
          supabase
            .from('members')
            .select(`
              id, role, status, joined_at,
              profiles:profile_id (full_name, email, created_at)
            `)
            .eq('family_id', familyId),
          
          supabase
            .from('invites')
            .select('id, email, role, status, created_at, expires_at')
            .eq('family_id', familyId)
        ])

        if (storiesResult.error) throw storiesResult.error
        if (membersResult.error) throw membersResult.error
        if (invitesResult.error) throw invitesResult.error

        exportData = {
          stories: storiesResult.data || [],
          members: membersResult.data || [],
          invites: invitesResult.data || [],
          metadata: {
            exportedAt: new Date().toISOString(),
            totalStories: storiesResult.data?.length || 0,
            totalMembers: membersResult.data?.length || 0,
            totalInvites: invitesResult.data?.length || 0
          }
        }
        filename = `full-export-${familyId}-${new Date().toISOString().split('T')[0]}`
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid export type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Format data based on requested format
    let responseData: string
    let contentType: string

    if (format === 'csv') {
      // Convert to CSV (simplified - would need proper CSV formatting in production)
      if (exportType === 'stories') {
        const csvHeaders = 'Title,Content,Author,Created Date,Tags'
        const csvRows = exportData.stories.map((story: any) => 
          `"${story.title || ''}","${(story.content || '').replace(/"/g, '""')}","${story.profiles?.full_name || ''}","${story.created_at}","${(story.tags || []).join(', ')}"`
        ).join('\n')
        responseData = csvHeaders + '\n' + csvRows
      } else {
        responseData = JSON.stringify(exportData, null, 2) // Fallback to JSON for complex data
      }
      contentType = 'text/csv'
      filename += '.csv'
    } else {
      responseData = JSON.stringify(exportData, null, 2)
      contentType = 'application/json'
      filename += '.json'
    }

    console.log(`Export completed: ${filename}, ${responseData.length} characters`)

    return new Response(responseData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })

  } catch (error: any) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Export failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})