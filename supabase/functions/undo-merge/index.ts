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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { mergeId, undoneBy } = await req.json()

    console.log('Starting undo merge:', { mergeId, undoneBy })

    // Get merge history
    const { data: mergeHistory, error: historyError } = await supabaseClient
      .from('merge_history')
      .select('*')
      .eq('id', mergeId)
      .is('undone_at', null)
      .single()

    if (historyError || !mergeHistory) {
      throw new Error('Merge record not found or already undone')
    }

    const { canonical_id, duplicate_id, entity_type } = mergeHistory

    // Restore duplicate record
    const { error: restoreError } = await supabaseClient
      .from('people')
      .update({ 
        merged_into: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', duplicate_id)

    if (restoreError) {
      console.error('Restore failed:', restoreError)
      throw restoreError
    }

    // Restore entity_links (transfer back)
    const { error: linksError } = await supabaseClient
      .from('entity_links')
      .update({ entity_id: duplicate_id })
      .eq('entity_id', canonical_id)
      .gte('created_at', mergeHistory.performed_at)

    if (linksError) console.warn('Entity links restore warning:', linksError)

    // Restore relationships
    const { error: relFromError } = await supabaseClient
      .from('relationships')
      .update({ from_person_id: duplicate_id })
      .eq('from_person_id', canonical_id)
      .gte('created_at', mergeHistory.performed_at)

    if (relFromError) console.warn('Relationships restore warning:', relFromError)

    const { error: relToError } = await supabaseClient
      .from('relationships')
      .update({ to_person_id: duplicate_id })
      .eq('to_person_id', canonical_id)
      .gte('created_at', mergeHistory.performed_at)

    if (relToError) console.warn('Relationships restore warning:', relToError)

    // Mark merge as undone
    const { error: undoError } = await supabaseClient
      .from('merge_history')
      .update({
        undone_at: new Date().toISOString(),
        undone_by: undoneBy
      })
      .eq('id', mergeId)

    if (undoError) throw undoError

    // Update duplicate_candidates status
    const { error: candidateError } = await supabaseClient
      .from('duplicate_candidates')
      .update({ status: 'pending' })
      .or(`person_a_id.eq.${duplicate_id},person_b_id.eq.${duplicate_id}`)

    if (candidateError) console.warn('Candidate restore warning:', candidateError)

    // Log audit event
    const { error: auditError } = await supabaseClient.rpc('log_audit_event', {
      p_actor_id: undoneBy,
      p_action: 'PERSON_MERGE_UNDO',
      p_entity_type: 'merge_history',
      p_entity_id: mergeId,
      p_details: {
        canonical_id,
        duplicate_id
      },
      p_risk_score: 20
    })

    if (auditError) console.warn('Audit log warning:', auditError)

    console.log('Undo completed successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Undo error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
