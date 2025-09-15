import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Transcription request received')
    const { audio } = await req.json()
    
    if (!audio) {
      console.error('No audio data provided')
      throw new Error('No audio data provided')
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OpenAI API key not configured')
      throw new Error('OpenAI API key not configured')
    }

    console.log(`Processing audio data of length: ${audio.length}`)
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio)
    console.log(`Processed binary audio: ${binaryAudio.length} bytes`)
    
    // Prepare form data
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'json')
    formData.append('language', 'en') // Can be made dynamic

    console.log('Sending to OpenAI Whisper API...')
    // Send to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI API error: ${response.status} ${errorText}`)
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log(`Transcription successful. Text length: ${result.text?.length || 0} characters`)
    console.log(`First 100 chars: ${result.text?.substring(0, 100)}...`)

    return new Response(
      JSON.stringify({ 
        text: result.text,
        language: result.language || 'en',
        confidence: 0.9 // OpenAI doesn't provide confidence scores
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})