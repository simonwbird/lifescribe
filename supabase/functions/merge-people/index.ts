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

    const { canonicalId, duplicateId, mergedData, reason, performedBy } = await req.json()

    console.log('Starting merge:', { canonicalId, duplicateId, performedBy })

    // Create merge history record
    const { data: mergeRecord, error: mergeError } = await supabaseClient
      .from('merge_history')
      .insert({
        entity_type: 'person',
        canonical_id: canonicalId,
        duplicate_id: duplicateId,
        merged_data: mergedData,
        reason,
        performed_by: performedBy
      })
      .select()
      .single()

    if (mergeError) {
      console.error('Merge record creation failed:', mergeError)
      throw mergeError
    }

    console.log('Merge record created:', mergeRecord.id)

    // Update canonical record with merged data
    const { error: updateError } = await supabaseClient
      .from('people')
      .update(mergedData)
      .eq('id', canonicalId)

    if (updateError) {
      console.error('Canonical update failed:', updateError)
      throw updateError
    }

    // Transfer all entity_links from duplicate to canonical
    const { error: linksError } = await supabaseClient
      .from('entity_links')
      .update({ entity_id: canonicalId })
      .eq('entity_id', duplicateId)
      .eq('entity_type', 'person')

    if (linksError) console.warn('Entity links transfer warning:', linksError)

    // Transfer all relationships
    const { error: relFromError } = await supabaseClient
      .from('relationships')
      .update({ from_person_id: canonicalId })
      .eq('from_person_id', duplicateId)

    if (relFromError) console.warn('Relationships from transfer warning:', relFromError)

    const { error: relToError } = await supabaseClient
      .from('relationships')
      .update({ to_person_id: canonicalId })
      .eq('to_person_id', duplicateId)

    if (relToError) console.warn('Relationships to transfer warning:', relToError)

    // Mark duplicate as merged
    const { error: deleteError } = await supabaseClient
      .from('people')
      .update({ 
        merged_into: canonicalId,
        updated_at: new Date().toISOString()
      })
      .eq('id', duplicateId)

    if (deleteError) {
      console.error('Duplicate marking failed:', deleteError)
      throw deleteError
    }

    // Update duplicate_candidates status
    const { error: candidateError } = await supabaseClient
      .from('duplicate_candidates')
      .update({ 
        status: 'merged',
        reviewed_by: performedBy,
        reviewed_at: new Date().toISOString()
      })
      .or(`person_a_id.eq.${duplicateId},person_b_id.eq.${duplicateId}`)

    if (candidateError) console.warn('Candidate update warning:', candidateError)

    // Log to audit
    const { error: auditError } = await supabaseClient.rpc('log_audit_event', {
      p_actor_id: performedBy,
      p_action: 'PERSON_MERGE',
      p_entity_type: 'merge_history',
      p_entity_id: mergeRecord.id,
      p_details: {
        canonical_id: canonicalId,
        duplicate_id: duplicateId,
        reason
      },
      p_risk_score: 15
    })

    if (auditError) console.warn('Audit log warning:', auditError)

    console.log('Merge completed successfully:', mergeRecord.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        mergeId: mergeRecord.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Merge error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
