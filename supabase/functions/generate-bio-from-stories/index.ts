import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { personId, tone = 'warm' } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch person details
    const { data: person, error: personError } = await supabaseClient
      .from('people')
      .select('first_name, last_name, birth_date, death_date')
      .eq('id', personId)
      .single()

    if (personError) throw personError

    // Fetch stories for this person
    const { data: stories, error: storiesError } = await supabaseClient
      .from('stories')
      .select('id, title, content')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (storiesError) throw storiesError

    if (!stories || stories.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No stories found for this person. Add some stories first.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare prompt for AI
    const personName = `${person.first_name} ${person.last_name}`
    const lifeYears = person.birth_date && person.death_date 
      ? `(${new Date(person.birth_date).getFullYear()}-${new Date(person.death_date).getFullYear()})`
      : person.birth_date 
      ? `(born ${new Date(person.birth_date).getFullYear()})`
      : ''

    const storiesText = stories.map(s => `"${s.title}": ${s.content}`).join('\n\n')

    const toneInstructions = {
      classic: 'Write in a formal, respectful tone suitable for an obituary or memorial.',
      warm: 'Write in a warm, personal tone that celebrates their life and personality.',
      vivid: 'Write in a vivid, storytelling tone that brings their character to life.'
    }

    const prompt = `Based on these stories about ${personName} ${lifeYears}, write two biographies:

1. A SHORT_BIO (40-160 characters): A brief, compelling summary for search engines and social media.
2. A LONG_BIO (2-4 paragraphs): A detailed biography that captures who they were, what they loved, and how they lived.

${toneInstructions[tone as keyof typeof toneInstructions]}

Stories:
${storiesText}

Return ONLY a JSON object with this exact structure:
{
  "short_bio": "...",
  "long_bio": "...",
  "sources": [${stories.slice(0, 5).map(s => `{"type": "story", "id": "${s.id}", "title": "${s.title}"}`).join(', ')}]
}`

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional biographer who writes touching, accurate life stories. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIData = await openAIResponse.json()
    const generatedContent = JSON.parse(openAIData.choices[0].message.content)

    return new Response(
      JSON.stringify(generatedContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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
