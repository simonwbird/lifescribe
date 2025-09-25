import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MergeRequest {
  proposal_id: string
  action: 'accept' | 'reject' | 'execute'
  confirmed_by: string
  reason?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { proposal_id, action, confirmed_by, reason }: MergeRequest = await req.json()

    console.log(`Processing merge ${action} for proposal ${proposal_id}`)

    // Get the merge proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('merge_proposals')
      .select('*')
      .eq('id', proposal_id)
      .single()

    if (proposalError || !proposal) {
      throw new Error('Merge proposal not found')
    }

    if (action === 'reject') {
      // Reject the proposal
      const { error: rejectError } = await supabase
        .from('merge_proposals')
        .update({
          status: 'rejected',
          reviewed_by: confirmed_by,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || 'Manual rejection'
        })
        .eq('id', proposal_id)

      if (rejectError) {
        throw rejectError
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'rejected',
          proposal_id,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'accept') {
      // Accept the proposal
      const { error: acceptError } = await supabase
        .from('merge_proposals')
        .update({
          status: 'accepted',
          reviewed_by: confirmed_by,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', proposal_id)

      if (acceptError) {
        throw acceptError
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'accepted',
          proposal_id,
          message: 'Proposal accepted. Ready for execution.',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'execute') {
      // Execute the merge
      if (proposal.status !== 'accepted') {
        throw new Error('Proposal must be accepted before execution')
      }

      // Execute the merge using the database function
      const { data: mergeResult, error: mergeError } = await supabase
        .rpc('execute_family_merge', {
          p_merge_proposal_id: proposal_id,
          p_confirmed_by: confirmed_by
        })

      if (mergeError) {
        console.error('Merge execution error:', mergeError)
        
        // Mark proposal as failed
        await supabase
          .from('merge_proposals')
          .update({
            status: 'failed',
            error_details: { error: mergeError.message }
          })
          .eq('id', proposal_id)

        throw mergeError
      }

      console.log('Merge executed successfully:', mergeResult)

      return new Response(
        JSON.stringify({
          success: true,
          action: 'executed',
          proposal_id,
          merge_result: mergeResult,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    throw new Error(`Invalid action: ${action}`)

  } catch (error) {
    console.error('Merge operation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})