import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRequest {
  personId: string
  csvData: string // CSV content as string
  imageMapping: Record<string, string> // filename -> storage URL mapping
}

interface CSVRow {
  date: string
  title: string
  body: string
  tags: string
  visibility: 'public' | 'family' | 'private'
  images?: string // comma-separated image filenames
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { personId, csvData, imageMapping }: ImportRequest = await req.json()

    // Check user has permission to import (owner/steward/co_curator)
    const { data: personRole } = await supabaseClient
      .from('person_roles')
      .select('role')
      .eq('person_id', personId)
      .eq('profile_id', user.id)
      .is('revoked_at', null)
      .single()

    if (!personRole || !['owner', 'steward', 'co_curator'].includes(personRole.role)) {
      return new Response(JSON.stringify({ error: 'No permission to import for this person' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get person data
    const { data: person, error: personError } = await supabaseClient
      .from('people')
      .select('*')
      .eq('id', personId)
      .single()

    if (personError || !person) {
      return new Response(JSON.stringify({ error: 'Person not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse CSV
    const rows = parseCSV(csvData)
    
    // Create import job
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        person_id: personId,
        family_id: person.family_id,
        created_by: user.id,
        status: 'processing',
        total_items: rows.length
      })
      .select()
      .single()

    if (jobError || !importJob) {
      console.error('Error creating import job:', jobError)
      return new Response(JSON.stringify({ error: 'Failed to create import job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Process each row
    let processedCount = 0
    let failedCount = 0
    const errorLog: any[] = []

    for (const row of rows) {
      try {
        // Create story
        const { data: story, error: storyError } = await supabaseClient
          .from('stories')
          .insert({
            family_id: person.family_id,
            profile_id: user.id,
            title: row.title || 'Untitled',
            body: row.body || '',
            occurred_on: row.date ? new Date(row.date).toISOString() : null,
            visibility: row.visibility || 'family',
            tags: row.tags ? row.tags.split(',').map(t => t.trim()) : []
          })
          .select()
          .single()

        if (storyError) {
          throw new Error(`Failed to create story: ${storyError.message}`)
        }

        // Handle images if present
        if (row.images && story) {
          const imageFilenames = row.images.split(',').map(f => f.trim())
          for (const filename of imageFilenames) {
            const imageUrl = imageMapping[filename]
            if (imageUrl) {
              // Create media entry
              await supabaseClient
                .from('media')
                .insert({
                  family_id: person.family_id,
                  profile_id: user.id,
                  url: imageUrl,
                  mime_type: 'image/jpeg', // Default, should be determined from actual file
                  visibility: row.visibility || 'family'
                })
            }
          }
        }

        // Create block for the story
        const { data: maxPosition } = await supabaseClient
          .from('person_page_blocks')
          .select('position')
          .eq('person_id', personId)
          .order('position', { ascending: false })
          .limit(1)
          .single()

        const nextPosition = (maxPosition?.position || 0) + 1

        await supabaseClient
          .from('person_page_blocks')
          .insert({
            person_id: personId,
            block_type: 'story',
            content_id: story.id,
            position: nextPosition,
            visibility: row.visibility || 'family'
          })

        processedCount++
      } catch (error) {
        failedCount++
        errorLog.push({
          row: processedCount + failedCount,
          title: row.title,
          error: error.message
        })
        console.error(`Error processing row ${processedCount + failedCount}:`, error)
      }

      // Update progress
      await supabaseClient
        .from('import_jobs')
        .update({
          processed_items: processedCount,
          failed_items: failedCount,
          error_log: errorLog
        })
        .eq('id', importJob.id)
    }

    // Mark job as completed
    const finalStatus = failedCount === 0 ? 'completed' : (processedCount > 0 ? 'partial' : 'failed')
    await supabaseClient
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        processed_items: processedCount,
        failed_items: failedCount,
        error_log: errorLog
      })
      .eq('id', importJob.id)

    return new Response(JSON.stringify({
      success: true,
      jobId: importJob.id,
      processed: processedCount,
      failed: failedCount,
      errors: errorLog
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({ error: 'Import failed', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row as CSVRow)
  }

  return rows
}
