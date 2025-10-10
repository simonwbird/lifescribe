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

    const { 
      sourcePersonId, 
      targetPersonId, 
      familyId, 
      mergeData,
      candidateId,
      confidenceScore,
      matchReasons
    } = await req.json();

    if (!sourcePersonId || !targetPersonId || !familyId || !mergeData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    // Use service role for merge operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get source and target person data for backup
    const { data: sourcePerson } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('id', sourcePersonId)
      .single();

    const { data: targetPerson } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('id', targetPersonId)
      .single();

    if (!sourcePerson || !targetPerson) {
      return new Response(JSON.stringify({ error: 'Person not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update target person with merged data
    const { error: updateError } = await supabaseAdmin
      .from('people')
      .update(mergeData.targetData)
      .eq('id', targetPersonId);

    if (updateError) throw updateError;

    // Move relationships from source to target
    await supabaseAdmin
      .from('relationships')
      .update({ from_person_id: targetPersonId })
      .eq('from_person_id', sourcePersonId);

    await supabaseAdmin
      .from('relationships')
      .update({ to_person_id: targetPersonId })
      .eq('to_person_id', sourcePersonId);

    // Move face tags
    await supabaseAdmin
      .from('face_tags')
      .update({ person_id: targetPersonId })
      .eq('person_id', sourcePersonId);

    // Move entity links
    await supabaseAdmin
      .from('entity_links')
      .update({ entity_id: targetPersonId })
      .eq('entity_id', sourcePersonId)
      .eq('entity_type', 'person');

    // Create merge record
    const { data: merge, error: mergeError } = await supabaseAdmin
      .from('person_merges')
      .insert({
        family_id: familyId,
        source_person_id: sourcePersonId,
        target_person_id: targetPersonId,
        merged_by: user.id,
        merge_data: {
          source: sourcePerson,
          target: targetPerson,
          merged: mergeData,
        },
        confidence_score: confidenceScore,
        merge_reasons: matchReasons,
      })
      .select()
      .single();

    if (mergeError) throw mergeError;

    // Create redirect
    await supabaseAdmin
      .from('person_redirects')
      .insert({
        old_person_id: sourcePersonId,
        new_person_id: targetPersonId,
        family_id: familyId,
        merge_id: merge.id,
      });

    // Mark duplicate candidate as merged if provided
    if (candidateId) {
      await supabaseAdmin
        .from('duplicate_candidates')
        .update({
          status: 'merged',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', candidateId);
    }

    // Delete source person (soft delete via marking)
    await supabaseAdmin
      .from('people')
      .delete()
      .eq('id', sourcePersonId);

    // Log audit event
    await supabaseAdmin.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_action: 'PERSON_MERGE',
      p_entity_type: 'person_merge',
      p_entity_id: merge.id,
      p_family_id: familyId,
      p_details: {
        source_id: sourcePersonId,
        target_id: targetPersonId,
        confidence: confidenceScore,
      },
      p_risk_score: 10,
    });

    return new Response(
      JSON.stringify({
        success: true,
        mergeId: merge.id,
        targetPersonId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error merging people:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});