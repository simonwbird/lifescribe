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
    const { personId, familyId, tone } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get person details
    const { data: person } = await supabaseClient
      .from('people')
      .select('full_name, birth_date, death_date')
      .eq('id', personId)
      .single()

    if (!person) {
      throw new Error('Person not found')
    }

    // Get timeline stories
    const { data: stories } = await supabaseClient
      .rpc('get_person_timeline_items', { p_person_id: personId })
      .limit(10)

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    const toneInstructions = {
      classic: 'Write in a formal, respectful, and timeless style',
      warm: 'Write in a warm, personal, and intimate style',
      vivid: 'Write in a vivid, colorful, and engaging style with sensory details'
    }

    const storyContext = stories?.map(s => 
      `${s.happened_on ? new Date(s.happened_on).getFullYear() : 'Undated'}: ${s.title} - ${s.excerpt}`
    ).join('\n') || ''

    const systemPrompt = `You are a compassionate biographer writing memorial tributes. ${toneInstructions[tone as keyof typeof toneInstructions]}.

Your task is to write two versions of a biography:
1. A short_bio (120-140 characters) - a single powerful sentence
2. A long_bio (120-160 words) - a fuller portrait

Focus on:
- Who they were as a person, not just what they did
- Their character, values, and impact on others
- Weaving in specific stories and moments
- Making them feel present and real

Return ONLY valid JSON with this structure:
{
  "short_bio": "string",
  "long_bio": "string (markdown)",
  "sources": [{"type": "story", "id": "story_id", "title": "story_title"}]
}`

    const userPrompt = `Write a ${tone} biography for ${person.full_name} (${person.birth_date ? new Date(person.birth_date).getFullYear() : '?'} - ${person.death_date ? new Date(person.death_date).getFullYear() : '?'}).

Stories and timeline:
${storyContext}

Remember:
- short_bio: 120-140 characters, one powerful sentence
- long_bio: 120-160 words, markdown formatted
- Include sources array with story references used`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI generation error:', error)
      throw new Error('Failed to generate bio')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content generated')
    }

    // Parse JSON response
    const bioData = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

    return new Response(
      JSON.stringify(bioData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
