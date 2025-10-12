import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const { storyId, title, content, familyId } = await req.json()
    
    if (!storyId || !title || !familyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check for duplicates using AI
    const { data: existingStories } = await supabaseClient
      .from('stories')
      .select('id, title, content, created_at')
      .eq('family_id', familyId)
      .neq('id', storyId)
      .limit(20)

    let duplicateScore = 0
    let duplicateIds: string[] = []

    if (existingStories && existingStories.length > 0) {
      // Use AI to detect semantic duplicates
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: 'You analyze story similarity. Return JSON with duplicate_score (0-100) and duplicate_ids array.'
            },
            {
              role: 'user',
              content: `New story: "${title}" - ${content || '(no content)'}

Existing stories:
${existingStories.map(s => `- [${s.id}] "${s.title}" - ${s.content?.substring(0, 200) || '(no content)'}`).join('\n')}

Are there semantic duplicates? Return: {"duplicate_score": 0-100, "duplicate_ids": ["id1", "id2"]}`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'report_duplicates',
              description: 'Report duplicate detection results',
              parameters: {
                type: 'object',
                properties: {
                  duplicate_score: { 
                    type: 'number',
                    description: 'Similarity score 0-100, where >70 is likely duplicate'
                  },
                  duplicate_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'IDs of stories that are similar'
                  }
                },
                required: ['duplicate_score', 'duplicate_ids'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'report_duplicates' } }
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
        if (toolCall?.function?.arguments) {
          const result = JSON.parse(toolCall.function.arguments)
          duplicateScore = result.duplicate_score || 0
          duplicateIds = result.duplicate_ids || []
        }
      }
    }

    // 2. Check for sensitive content using AI
    const sensitivityResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You analyze content for sensitivity issues. Return JSON with sensitivity_score (0-100) and concerns array.'
          },
          {
            role: 'user',
            content: `Analyze this story for sensitivity issues (offensive language, graphic content, privacy concerns, inappropriate material):

Title: "${title}"
Content: ${content || '(no content)'}

Return: {"sensitivity_score": 0-100, "concerns": ["concern1", "concern2"]}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'report_sensitivity',
            description: 'Report content sensitivity analysis',
            parameters: {
              type: 'object',
              properties: {
                sensitivity_score: { 
                  type: 'number',
                  description: 'Sensitivity score 0-100, where >60 needs review'
                },
                concerns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of specific concerns found'
                }
              },
              required: ['sensitivity_score', 'concerns'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'report_sensitivity' } }
      })
    })

    let sensitivityScore = 0
    let concerns: string[] = []

    if (sensitivityResponse.ok) {
      const aiData = await sensitivityResponse.json()
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments)
        sensitivityScore = result.sensitivity_score || 0
        concerns = result.concerns || []
      }
    }

    // 3. Calculate priority based on AI analysis
    let priority = 1 // default low
    if (sensitivityScore > 70 || duplicateScore > 80) priority = 3 // high
    else if (sensitivityScore > 40 || duplicateScore > 60) priority = 2 // medium

    return new Response(
      JSON.stringify({
        duplicate_score: duplicateScore,
        duplicate_ids: duplicateIds,
        sensitivity_score: sensitivityScore,
        concerns,
        priority,
        needs_review: sensitivityScore > 40 || duplicateScore > 60
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Moderation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
