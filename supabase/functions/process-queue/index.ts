import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('Processing queue worker started')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get pending jobs
    const { data: jobs, error } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(5) // Process 5 jobs at a time

    if (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }

    console.log(`Found ${jobs?.length || 0} pending jobs`)

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No jobs to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each job
    const results = []
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} - Type: ${job.job_type}`)
        
        // Update job status to processing
        await supabase
          .from('processing_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        // Process based on job type
        switch (job.job_type) {
          case 'video_transcode':
            await processVideoTranscode(supabase, job)
            break
          case 'thumbnail_generate':
            await processThumbnailGeneration(supabase, job)
            break
          case 'audio_process':
            await processAudio(supabase, job)
            break
          default:
            throw new Error(`Unknown job type: ${job.job_type}`)
        }

        // Mark as completed
        await supabase
          .from('processing_queue')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        results.push({ job_id: job.id, status: 'completed' })
        console.log(`Job ${job.id} completed successfully`)

      } catch (jobError: any) {
        console.error(`Job ${job.id} failed:`, jobError.message)

        // Mark as failed
        await supabase
          .from('processing_queue')
          .update({
            status: job.attempts + 1 >= 3 ? 'failed' : 'pending',
            error_message: jobError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)

        results.push({ job_id: job.id, status: 'failed', error: jobError.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Processing completed', 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Worker error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processVideoTranscode(supabase: any, job: any) {
  console.log(`Transcoding video for asset ${job.asset_id}`)

  // Update asset processing state
  await supabase
    .from('story_assets')
    .update({
      processing_state: 'processing',
      processing_started_at: new Date().toISOString()
    })
    .eq('id', job.asset_id)

  // Simulate transcoding (in production, use a real service like AWS MediaConvert)
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Get asset details
  const { data: asset } = await supabase
    .from('story_assets')
    .select('url')
    .eq('id', job.asset_id)
    .single()

  // Update with transcoded URL (for now, same as original)
  await supabase
    .from('story_assets')
    .update({
      processing_state: 'ready',
      processing_completed_at: new Date().toISOString(),
      transcoded_url: asset?.url || null
    })
    .eq('id', job.asset_id)

  // Check if all assets for this story are ready
  await updateStoryProcessingState(supabase, job.story_id)

  console.log(`Video transcoding completed for asset ${job.asset_id}`)
}

async function processThumbnailGeneration(supabase: any, job: any) {
  console.log(`Generating thumbnail for asset ${job.asset_id}`)

  // Simulate thumbnail generation
  await new Promise(resolve => setTimeout(resolve, 2000))

  // In production: extract frame from video and upload

  console.log(`Thumbnail generation completed for asset ${job.asset_id}`)
}

async function processAudio(supabase: any, job: any) {
  console.log(`Processing audio for asset ${job.asset_id}`)

  await supabase
    .from('story_assets')
    .update({
      processing_state: 'processing',
      processing_started_at: new Date().toISOString()
    })
    .eq('id', job.asset_id)

  // Simulate audio processing
  await new Promise(resolve => setTimeout(resolve, 2000))

  await supabase
    .from('story_assets')
    .update({
      processing_state: 'ready',
      processing_completed_at: new Date().toISOString()
    })
    .eq('id', job.asset_id)

  await updateStoryProcessingState(supabase, job.story_id)

  console.log(`Audio processing completed for asset ${job.asset_id}`)
}

async function updateStoryProcessingState(supabase: any, storyId: string) {
  // Get all assets for this story
  const { data: assets } = await supabase
    .from('story_assets')
    .select('processing_state')
    .eq('story_id', storyId)

  if (!assets || assets.length === 0) {
    return
  }

  // Check if all are ready
  const allReady = assets.every((a: any) => 
    a.processing_state === 'ready' || !a.processing_state
  )
  const anyFailed = assets.some((a: any) => a.processing_state === 'failed')

  const newState = anyFailed ? 'failed' : allReady ? 'ready' : 'processing'

  await supabase
    .from('stories')
    .update({
      processing_state: newState,
      processing_completed_at: allReady || anyFailed ? new Date().toISOString() : null
    })
    .eq('id', storyId)

  console.log(`Updated story ${storyId} processing state to ${newState}`)
}