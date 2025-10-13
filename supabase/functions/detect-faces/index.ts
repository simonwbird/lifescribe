import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { filePath, imageData } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    // Use Lovable AI vision model to detect faces
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
            content: 'You are a face detection assistant. Analyze images and return structured data about detected faces.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Detect all faces in this image and provide their approximate locations and characteristics. Return only valid JSON with this structure: { "faces": [{ "id": "face_1", "bbox": { "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.4 }, "confidence": 0.95, "characteristics": "description" }] }'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData || `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/media/${filePath}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'detect_faces',
              description: 'Detect faces in an image',
              parameters: {
                type: 'object',
                properties: {
                  faces: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        bbox: {
                          type: 'object',
                          properties: {
                            x: { type: 'number' },
                            y: { type: 'number' },
                            width: { type: 'number' },
                            height: { type: 'number' }
                          },
                          required: ['x', 'y', 'width', 'height']
                        },
                        confidence: { type: 'number' },
                        characteristics: { type: 'string' }
                      },
                      required: ['id', 'bbox', 'confidence']
                    }
                  }
                },
                required: ['faces']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'detect_faces' } }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI Gateway error:', response.status, error)
      throw new Error(`AI Gateway error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Face detection result:', JSON.stringify(data, null, 2))
    
    // Extract structured output from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
    const faces = toolCall ? JSON.parse(toolCall.function.arguments).faces : []

    return new Response(
      JSON.stringify({ 
        faces,
        matches: [] // TODO: Implement person matching
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Face detection error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
