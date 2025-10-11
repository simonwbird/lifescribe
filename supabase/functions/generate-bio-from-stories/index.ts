import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personId, tone = 'warm' } = await req.json();

    if (!personId) {
      return new Response(
        JSON.stringify({ error: "personId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch person details
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('full_name, birth_date, death_date, birth_place, status')
      .eq('id', personId)
      .single();

    if (personError || !person) {
      return new Response(
        JSON.stringify({ error: "Person not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch latest timeline items (stories, milestones, etc.)
    const { data: timelineItems } = await supabase
      .from('timeline_items')
      .select('title, description, happened_on, item_type')
      .eq('person_id', personId)
      .order('happened_on', { ascending: false })
      .limit(10);

    // Fetch stories about this person
    const { data: stories } = await supabase
      .from('stories')
      .select('title, content')
      .contains('tagged_people', [personId])
      .order('created_at', { ascending: false })
      .limit(5);

    // Build context for AI
    const context = {
      person: {
        name: person.full_name,
        birth: person.birth_date,
        death: person.death_date,
        birthPlace: person.birth_place,
        status: person.status,
      },
      timelineItems: timelineItems || [],
      stories: stories || [],
    };

    // Call Lovable AI to generate bio
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a compassionate biography writer. Create a ${tone}, engaging biography from the provided life events and stories. The bio should:
- Be 120-180 words for the long version
- Have a 40-160 character short version suitable for SEO
- Capture the person's essence and impact
- Use natural, conversational language
- Focus on what made them special
- Include specific details that bring them to life

Return ONLY a JSON object with this structure:
{
  "short_bio": "...",
  "long_bio": "..."
}`;

    const userPrompt = `Generate a biography for ${person.full_name}.

Context:
- Born: ${person.birth_date || 'Unknown'} ${person.birth_place ? `in ${person.birth_place}` : ''}
- Status: ${person.status}
${person.death_date ? `- Passed: ${person.death_date}` : ''}

Timeline Events:
${timelineItems?.map(item => `- ${item.title}: ${item.description || ''}`).join('\n') || 'None'}

Stories:
${stories?.map(story => `${story.title}\n${story.content}`).join('\n\n') || 'None'}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate biography" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const generatedText = aiResult.choices[0].message.content;
    const bioData = JSON.parse(generatedText);

    return new Response(
      JSON.stringify({
        short_bio: bioData.short_bio,
        long_bio: bioData.long_bio,
        sources: [
          ...(timelineItems?.map(item => ({
            type: 'timeline_item' as const,
            id: item.id,
            title: item.title,
          })) || []),
          ...(stories?.map(story => ({
            type: 'story' as const,
            id: story.id,
            title: story.title,
          })) || []),
        ],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating bio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
