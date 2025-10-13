import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingJob {
  id: string
  story_id: string
  asset_id: string | null
  job_type: 'video_transcode' | 'thumbnail_generate' | 'audio_process'
  metadata: Record<string, any>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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

    const { action, job_id } = await req.json()

    if (action === 'poll') {
      // Poll for pending jobs
      const { data: jobs, error } = await supabase
        .from('processing_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10)

      if (error) throw error

      console.log(`Found ${jobs?.length || 0} pending jobs`)

      return new Response(
        JSON.stringify({ jobs: jobs || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'process' && job_id) {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('processing_queue')
        .select('*')
        .eq('id', job_id)
        .single()

      if (jobError) throw jobError
      if (!job) throw new Error('Job not found')

      console.log(`Processing job ${job.id} - Type: ${job.job_type}`)

      // Update job to processing
      await supabase
        .from('processing_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          attempts: job.attempts + 1
        })
        .eq('id', job_id)

      // Process in background
      EdgeRuntime.waitUntil(processJob(supabase, job as ProcessingJob))

      return new Response(
        JSON.stringify({ success: true, message: 'Processing started' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processJob(supabase: any, job: ProcessingJob) {
  try {
    console.log(`Starting background processing for job ${job.id}`)

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

    // Mark job as completed
    await supabase
      .from('processing_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    console.log(`Job ${job.id} completed successfully`)

  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error.message)

    // Mark job as failed
    await supabase
      .from('processing_queue')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    // Update asset processing state
    if (job.asset_id) {
      await supabase.rpc('update_asset_processing_state', {
        p_asset_id: job.asset_id,
        p_state: 'failed',
        p_error: error.message
      })
    }
  }
}

async function processVideoTranscode(supabase: any, job: ProcessingJob) {
  if (!job.asset_id) throw new Error('No asset_id provided')

  console.log(`Transcoding video for asset ${job.asset_id}`)

  // Get asset details
  const { data: asset, error: assetError } = await supabase
    .from('story_assets')
    .select('*')
    .eq('id', job.asset_id)
    .single()

  if (assetError) throw assetError
  if (!asset) throw new Error('Asset not found')

  // Update processing state
  await supabase.rpc('update_asset_processing_state', {
    p_asset_id: job.asset_id,
    p_state: 'processing'
  })

  // Simulate video transcoding (in production, use a real transcoding service)
  // For MVP, we'll just use the original video with a delay to simulate processing
  await new Promise(resolve => setTimeout(resolve, 3000))

  // In production, you would:
  // 1. Download the video from storage
  // 2. Transcode to multiple formats (MP4, WebM, HLS)
  // 3. Upload transcoded versions
  // 4. Update the asset with transcoded URLs

  // For now, just mark as ready
  await supabase.rpc('update_asset_processing_state', {
    p_asset_id: job.asset_id,
    p_state: 'ready'
  })

  // Update the transcoded_url to point to the original for now
  await supabase
    .from('story_assets')
    .update({ transcoded_url: asset.url })
    .eq('id', job.asset_id)

  console.log(`Video transcoding completed for asset ${job.asset_id}`)
}

async function processThumbnailGeneration(supabase: any, job: ProcessingJob) {
  if (!job.asset_id) throw new Error('No asset_id provided')

  console.log(`Generating thumbnail for asset ${job.asset_id}`)

  // Get asset details
  const { data: asset, error: assetError } = await supabase
    .from('story_assets')
    .select('*')
    .eq('id', job.asset_id)
    .single()

  if (assetError) throw assetError
  if (!asset) throw new Error('Asset not found')

  // Simulate thumbnail generation
  await new Promise(resolve => setTimeout(resolve, 2000))

  // In production, you would:
  // 1. Download the video from storage
  // 2. Extract frame at specific timestamp
  // 3. Generate optimized thumbnail
  // 4. Upload thumbnail
  // 5. Update asset with thumbnail URL

  console.log(`Thumbnail generation completed for asset ${job.asset_id}`)
}

async function processAudio(supabase: any, job: ProcessingJob) {
  if (!job.asset_id) throw new Error('No asset_id provided')

  console.log(`Processing audio for asset ${job.asset_id}`)

  // Update processing state
  await supabase.rpc('update_asset_processing_state', {
    p_asset_id: job.asset_id,
    p_state: 'processing'
  })

  // Simulate audio processing (normalization, format conversion)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Mark as ready
  await supabase.rpc('update_asset_processing_state', {
    p_asset_id: job.asset_id,
    p_state: 'ready'
  })

  console.log(`Audio processing completed for asset ${job.asset_id}`)
}