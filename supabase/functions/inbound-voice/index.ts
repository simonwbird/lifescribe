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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse Twilio webhook data
    const formData = await req.formData()
    const phoneCode = formData.get('Digits') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    const fromNumber = formData.get('From') as string
    const duration = formData.get('RecordingDuration') as string

    console.log('Received voice message:', { phoneCode, recordingUrl, fromNumber, duration })

    if (!phoneCode || !recordingUrl) {
      throw new Error('Missing required fields')
    }

    // Look up user by phone code
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('elder_phone_code', phoneCode)
      .single()

    if (profileError || !profile) {
      console.error('Profile not found for code:', phoneCode)
      throw new Error('Invalid phone code')
    }

    // Get user's family
    const { data: member, error: memberError } = await supabaseClient
      .from('members')
      .select('family_id')
      .eq('profile_id', profile.id)
      .limit(1)
      .single()

    if (memberError) {
      console.error('Member not found:', memberError)
    }

    // Download audio from Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const authHeader = `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`

    const audioResponse = await fetch(recordingUrl, {
      headers: { 'Authorization': authHeader }
    })

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Twilio')
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    // Create inbound message record
    const { data: message, error: messageError } = await supabaseClient
      .from('inbound_voice_messages')
      .insert({
        user_id: profile.id,
        family_id: member?.family_id,
        phone_number: fromNumber,
        audio_url: recordingUrl,
        duration_seconds: parseInt(duration),
        source: 'phone',
        status: 'processing'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Failed to create message:', messageError)
      throw messageError
    }

    console.log('Created inbound message:', message.id)

    // Trigger transcription asynchronously
    const transcribeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/transcribe-voice-message`
    fetch(transcribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        message_id: message.id,
        audio_base64: audioBase64,
        user_id: profile.id,
        family_id: member?.family_id
      })
    }).catch(err => console.error('Transcription trigger failed:', err))

    // Respond to Twilio with TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for your message! It will be saved to your family timeline.</Say>
  <Hangup/>
</Response>`

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
    })

  } catch (error) {
    console.error('Error processing voice message:', error)
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, we encountered an error. Please try again later.</Say>
  <Hangup/>
</Response>`

    return new Response(errorTwiml, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
    })
  }
})