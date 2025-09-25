import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MergeSuggestionRequest {
  source_family_id: string
  target_family_id: string
  confidence_score?: number
  reason?: string
  suggested_by?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { 
      source_family_id, 
      target_family_id, 
      confidence_score = 5,
      reason = 'Manual merge suggestion',
      suggested_by = 'system'
    }: MergeSuggestionRequest = await req.json()

    console.log(`Creating merge suggestion: ${source_family_id} -> ${target_family_id}`)

    // Validate that both families exist
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name, status')
      .in('id', [source_family_id, target_family_id])

    if (familiesError) {
      throw new Error(`Error fetching families: ${familiesError.message}`)
    }

    if (!families || families.length !== 2) {
      throw new Error('One or both families not found')
    }

    // Check if families are in valid state for merging
    const invalidFamilies = families.filter(f => f.status !== 'active' && f.status !== 'provisional')
    if (invalidFamilies.length > 0) {
      throw new Error(`Cannot merge families with status: ${invalidFamilies.map(f => f.status).join(', ')}`)
    }

    // Check if merge proposal already exists
    const { data: existingProposal } = await supabase
      .from('merge_proposals')
      .select('id, status')
      .eq('source_family_id', source_family_id)
      .eq('target_family_id', target_family_id)
      .single()

    if (existingProposal) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Merge proposal already exists',
          existing_proposal_id: existingProposal.id,
          status: existingProposal.status
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      )
    }

    // Get merge analysis
    const { data: analysis, error: analysisError } = await supabase
      .rpc('get_merge_analysis', {
        p_source_family_id: source_family_id,
        p_target_family_id: target_family_id
      })

    if (analysisError) {
      console.error('Error getting merge analysis:', analysisError)
      throw analysisError
    }

    // Create merge proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('merge_proposals')
      .insert({
        source_family_id,
        target_family_id,
        proposed_by: null, // System suggestion
        confidence_score,
        reason,
        analysis_data: analysis,
        status: 'pending'
      })
      .select()
      .single()

    if (proposalError) {
      console.error('Error creating merge proposal:', proposalError)
      throw proposalError
    }

    console.log(`Merge proposal created with ID: ${proposal.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        proposal_id: proposal.id,
        source_family: families.find(f => f.id === source_family_id),
        target_family: families.find(f => f.id === target_family_id),
        analysis: analysis,
        confidence_score,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
      }
    )

  } catch (error) {
    console.error('Merge suggestion error:', error)
    
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