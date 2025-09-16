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

interface SmartTranscriptionResult {
  text: string
  language: string
  confidence: number
  extractedInfo: {
    title: string
    people: Array<{ name: string; relationship?: string }>
    dates: Array<{ text: string; date: string; precision: string }>
    locations: Array<string>
    emotions: Array<string>
    themes: Array<string>
    keyMoments: Array<string>
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Smart transcription request received')
    const { audio, prompt } = await req.json()
    
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
    
    // Step 1: Transcribe the audio using Whisper
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'json')
    formData.append('language', 'en')

    console.log('Sending to OpenAI Whisper API...')
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error(`OpenAI Whisper API error: ${whisperResponse.status} ${errorText}`)
      throw new Error(`OpenAI Whisper API error: ${whisperResponse.status} ${errorText}`)
    }

    const whisperResult = await whisperResponse.json()
    const transcriptText = whisperResult.text
    console.log(`Transcription successful. Text: "${transcriptText}"`)

    // Step 2: Use GPT to extract structured information from the transcript
    const analysisPrompt = `
You are an expert at analyzing family stories and memories. Extract structured information from this voice transcript.

Original Prompt Context: ${prompt || 'No specific prompt provided'}

Transcript: "${transcriptText}"

Please extract and return a JSON object with the following structure:
{
  "title": "A short, engaging title for this story (max 60 chars)",
  "people": [
    {
      "name": "Person's name",
      "relationship": "their relationship to the speaker (optional)"
    }
  ],
  "dates": [
    {
      "text": "the original text mentioning the date",  
      "date": "YYYY-MM-DD format if specific, or YYYY-MM-01 for month/year, or YYYY-01-01 for year only",
      "precision": "day|month|year|unknown"
    }
  ],
  "locations": ["place names mentioned"],
  "emotions": ["emotions expressed or implied"],
  "themes": ["main themes or topics"],
  "keyMoments": ["important moments or highlights from the story"]
}

Rules:
- Only extract people who are clearly mentioned by name or clear relationship
- For dates, be intelligent about relative terms (last summer = approximate date)
- Extract actual place names, not just "home" or "there"
- Identify genuine emotions, not just descriptive words
- Focus on meaningful themes, not just topics
- Key moments should be specific, memorable parts of the story
- Return valid JSON only, no additional text or markdown
`

    console.log('Analyzing transcript with GPT...')
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing family stories and extracting structured information. Always return valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    })

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text()
      console.error(`OpenAI GPT API error: ${gptResponse.status} ${errorText}`)
      // Fall back to basic extraction if GPT fails
      throw new Error(`OpenAI GPT API error: ${gptResponse.status} ${errorText}`)
    }

    const gptResult = await gptResponse.json()
    const analysisText = gptResult.choices[0].message.content

    let extractedInfo
    try {
      extractedInfo = JSON.parse(analysisText)
    } catch (e) {
      console.error('Failed to parse GPT analysis as JSON:', analysisText)
      // Fallback to empty structure
      extractedInfo = {
        title: transcriptText.substring(0, 60) + (transcriptText.length > 60 ? '...' : ''),
        people: [],
        dates: [],
        locations: [],
        emotions: [],
        themes: [],
        keyMoments: []
      }
    }

    console.log('Analysis complete:', extractedInfo)

    const result: SmartTranscriptionResult = {
      text: transcriptText,
      language: whisperResult.language || 'en',
      confidence: 0.9, // OpenAI doesn't provide confidence scores
      extractedInfo
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Smart transcription error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})