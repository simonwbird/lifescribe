import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { transcript, familyId } = await req.json()

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is required')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    // Call Lovable AI to extract metadata
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a metadata extraction assistant for family stories. Extract people names, dates, places, and thematic tags from transcripts. Return structured data only.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_story_metadata',
              description: 'Extract structured metadata from a family story transcript',
              parameters: {
                type: 'object',
                properties: {
                  people: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Full names of people mentioned in the story'
                  },
                  dates: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Dates mentioned (ISO format YYYY-MM-DD when possible)'
                  },
                  places: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Places, locations, or venues mentioned'
                  },
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Thematic tags or categories (e.g., "childhood", "war", "wedding", "career")'
                  }
                },
                required: ['people', 'dates', 'places', 'tags'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'extract_story_metadata' }
        }
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      throw new Error('AI Gateway request failed')
    }

    const result = await response.json()
    
    // Extract the function call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0]
    if (!toolCall) {
      throw new Error('No metadata extracted')
    }

    const suggestions = JSON.parse(toolCall.function.arguments)

    return new Response(
      JSON.stringify({
        suggestions,
        confidence: 'high'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Metadata extraction error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: {
          people: [],
          dates: [],
          places: [],
          tags: []
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
