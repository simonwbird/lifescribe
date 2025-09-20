import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CollisionResult {
  family_id: string
  name_slug: string
  risk_score: number
  collision_candidates: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting collision detection process...')

    // Run the collision signals computation
    const { data: computeResult, error: computeError } = await supabase
      .rpc('compute_family_collision_signals')

    if (computeError) {
      console.error('Error computing collision signals:', computeError)
      throw computeError
    }

    console.log(`Processed ${computeResult} families for collision detection`)

    // Get high-risk collision candidates
    const { data: collisions, error: collisionError } = await supabase
      .from('family_collision_signals')
      .select('*')
      .gte('risk_score', 20) // Only high-risk collisions
      .order('risk_score', { ascending: false })
      .limit(50)

    if (collisionError) {
      console.error('Error fetching collision candidates:', collisionError)
      throw collisionError
    }

    let suggestionsCreated = 0

    // Process each collision candidate
    for (const collision of collisions as CollisionResult[]) {
      if (collision.collision_candidates && collision.collision_candidates.length > 0) {
        // Check if merge proposal already exists
        const { data: existingProposal } = await supabase
          .from('merge_proposals')
          .select('id')
          .eq('source_family_id', collision.family_id)
          .in('target_family_id', collision.collision_candidates)
          .in('status', ['pending', 'accepted'])
          .single()

        if (!existingProposal) {
          // Create merge suggestion using the suggest-merge function
          const { error: suggestError } = await supabase.functions.invoke('families-suggest-merge', {
            body: {
              source_family_id: collision.family_id,
              target_family_id: collision.collision_candidates[0], // Suggest merge with highest confidence candidate
              confidence_score: Math.min(collision.risk_score / 10, 10), // Convert risk score to confidence (1-10 scale)
              reason: `Automated collision detection - Risk score: ${collision.risk_score}`
            }
          })

          if (suggestError) {
            console.error('Error creating merge suggestion:', suggestError)
          } else {
            suggestionsCreated++
            console.log(`Created merge suggestion for family ${collision.family_id}`)
          }
        }
      }
    }

    console.log(`Collision detection complete. Created ${suggestionsCreated} merge suggestions.`)

    return new Response(
      JSON.stringify({
        success: true,
        families_processed: computeResult,
        collisions_found: collisions.length,
        suggestions_created: suggestionsCreated,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Collision detection error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})