import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message_id, audio_base64, user_id, family_id } = await req.json()

    console.log('Transcribing message:', message_id)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0))

    // Transcribe with OpenAI Whisper
    const formData = new FormData()
    const audioBlob = new Blob([binaryAudio], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!transcriptionResponse.ok) {
      throw new Error(`Transcription failed: ${await transcriptionResponse.text()}`)
    }

    const transcription = await transcriptionResponse.json()
    const transcript = transcription.text

    console.log('Transcription complete:', transcript.substring(0, 100))

    // Create draft story
    const { data: story, error: storyError } = await supabaseClient
      .from('stories')
      .insert({
        title: 'Voice Message',
        content: transcript,
        family_id: family_id,
        created_by: user_id,
        is_draft: true,
        draft_data: {
          source: 'phone',
          auto_transcribed: true,
          created_from_inbound: true
        }
      })
      .select()
      .single()

    if (storyError) {
      console.error('Failed to create draft:', storyError)
      throw storyError
    }

    console.log('Created draft story:', story.id)

    // Update inbound message
    const { error: updateError } = await supabaseClient
      .from('inbound_voice_messages')
      .update({
        transcript: transcript,
        status: 'completed',
        draft_id: story.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', message_id)

    if (updateError) {
      console.error('Failed to update message:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript,
        draft_id: story.id,
        message_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})