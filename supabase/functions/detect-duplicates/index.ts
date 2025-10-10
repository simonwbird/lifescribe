import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { familyId, forceRefresh = false } = await req.json();

    if (!familyId) {
      return new Response(JSON.stringify({ error: 'Family ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin
    const { data: membership } = await supabaseClient
      .from('members')
      .select('role')
      .eq('family_id', familyId)
      .eq('profile_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If not forcing refresh, return existing pending candidates
    if (!forceRefresh) {
      const { data: existingCandidates, error: fetchError } = await supabaseClient
        .from('duplicate_candidates')
        .select(`
          *,
          person_a:people!duplicate_candidates_person_a_id_fkey(*),
          person_b:people!duplicate_candidates_person_b_id_fkey(*)
        `)
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      if (existingCandidates && existingCandidates.length > 0) {
        return new Response(
          JSON.stringify({
            candidates: existingCandidates,
            fromCache: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get all people in the family
    const { data: people, error: peopleError } = await supabaseClient
      .from('people')
      .select('*')
      .eq('family_id', familyId);

    if (peopleError) throw peopleError;

    // Use service role for calculating scores
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const candidates = [];

    // Compare each pair of people
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const personA = people[i];
        const personB = people[j];

        // Calculate duplicate score
        const { data: scoreResult, error: scoreError } = await supabaseAdmin
          .rpc('calculate_duplicate_score', {
            p_person_a_id: personA.id,
            p_person_b_id: personB.id,
          });

        if (scoreError) {
          console.error('Error calculating score:', scoreError);
          continue;
        }

        const result = scoreResult[0];
        if (result && result.score >= 0.5) {
          candidates.push({
            family_id: familyId,
            person_a_id: personA.id,
            person_b_id: personB.id,
            confidence_score: result.score,
            match_reasons: result.reasons,
            heuristic_details: result.details,
          });
        }
      }
    }

    // Insert candidates into database
    if (candidates.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('duplicate_candidates')
        .upsert(candidates, {
          onConflict: 'family_id,person_a_id,person_b_id',
          ignoreDuplicates: false,
        });

      if (insertError) throw insertError;
    }

    // Fetch the candidates with person data
    const { data: enrichedCandidates, error: enrichError } = await supabaseClient
      .from('duplicate_candidates')
      .select(`
        *,
        person_a:people!duplicate_candidates_person_a_id_fkey(*),
        person_b:people!duplicate_candidates_person_b_id_fkey(*)
      `)
      .eq('family_id', familyId)
      .eq('status', 'pending')
      .order('confidence_score', { ascending: false })
      .limit(50);

    if (enrichError) throw enrichError;

    return new Response(
      JSON.stringify({
        candidates: enrichedCandidates || [],
        fromCache: false,
        totalFound: candidates.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});