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

    const { mergeId } = await req.json();

    if (!mergeId) {
      return new Response(JSON.stringify({ error: 'Merge ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for undo operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get merge record
    const { data: merge, error: fetchError } = await supabaseAdmin
      .from('person_merges')
      .select('*')
      .eq('id', mergeId)
      .single();

    if (fetchError || !merge) {
      return new Response(JSON.stringify({ error: 'Merge not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin of the family
    const { data: membership } = await supabaseClient
      .from('members')
      .select('role')
      .eq('family_id', merge.family_id)
      .eq('profile_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if undo is still allowed
    if (!merge.can_undo || new Date(merge.undo_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Undo period has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (merge.undone_at) {
      return new Response(JSON.stringify({ error: 'Merge already undone' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mergeData = merge.merge_data;

    // Restore source person
    const { data: restoredPerson, error: restoreError } = await supabaseAdmin
      .from('people')
      .insert(mergeData.source)
      .select()
      .single();

    if (restoreError) throw restoreError;

    // Restore target person to original state
    await supabaseAdmin
      .from('people')
      .update(mergeData.target)
      .eq('id', merge.target_person_id);

    // Remove redirect
    await supabaseAdmin
      .from('person_redirects')
      .delete()
      .eq('merge_id', mergeId);

    // Mark merge as undone
    await supabaseAdmin
      .from('person_merges')
      .update({
        undone_at: new Date().toISOString(),
        undone_by: user.id,
      })
      .eq('id', mergeId);

    // Restore duplicate candidate if it exists
    await supabaseAdmin
      .from('duplicate_candidates')
      .update({ status: 'pending' })
      .or(`person_a_id.eq.${merge.source_person_id},person_b_id.eq.${merge.source_person_id}`)
      .eq('family_id', merge.family_id);

    // Log audit event
    await supabaseAdmin.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_action: 'PERSON_MERGE_UNDO',
      p_entity_type: 'person_merge',
      p_entity_id: mergeId,
      p_family_id: merge.family_id,
      p_details: {
        source_id: merge.source_person_id,
        target_id: merge.target_person_id,
      },
      p_risk_score: 5,
    });

    return new Response(
      JSON.stringify({
        success: true,
        restoredPersonId: restoredPerson.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error undoing merge:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});