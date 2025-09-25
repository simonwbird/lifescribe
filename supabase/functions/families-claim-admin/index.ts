import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClaimAdminRequest {
  family_id: string
  claim_type: 'endorsement' | 'email_challenge'
  original_owner_email?: string
  reason?: string
}

interface EndorseClaimRequest {
  claim_id: string
  endorsement_type: 'support' | 'oppose'
  reason?: string
}

interface ProcessClaimRequest {
  claim_id: string
  action: 'process' | 'grant_admin' | 'verify_email'
  email_token?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resend = new Resend(resendApiKey)
    
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    if (req.method === 'POST') {
      if (action === 'claim') {
        // Create admin claim
        const { family_id, claim_type, original_owner_email, reason }: ClaimAdminRequest = await req.json()
        
        // Get current user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('Authorization header required')
        }
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        if (authError || !user) {
          throw new Error('Authentication required')
        }

        console.log(`Processing admin claim for family ${family_id} by user ${user.id}`)

        // Check if family exists and is orphaned
        const { data: family, error: familyError } = await supabase
          .from('families')
          .select('id, name, created_by')
          .eq('id', family_id)
          .single()

        if (familyError || !family) {
          throw new Error('Family not found')
        }

        // Check if user is a member of the family
        const { data: membership } = await supabase
          .from('members')
          .select('role')
          .eq('family_id', family_id)
          .eq('profile_id', user.id)
          .single()

        if (!membership) {
          throw new Error('You must be a family member to claim admin rights')
        }

        // Check if family is orphaned
        const { data: orphanCheck } = await supabase
          .rpc('is_family_orphaned', { p_family_id: family_id })

        if (!orphanCheck) {
          throw new Error('Family already has active administrators')
        }

        // Check for existing active claim
        const { data: existingClaim } = await supabase
          .from('admin_claims')
          .select('id, status')
          .eq('family_id', family_id)
          .eq('claimant_id', user.id)
          .in('status', ['pending', 'approved'])
          .single()

        if (existingClaim) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'You already have an active claim for this family',
              existing_claim_id: existingClaim.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
          )
        }

        let claimData: any = {
          family_id,
          claimant_id: user.id,
          claim_type,
          reason: reason || 'Claiming admin rights for orphaned family'
        }

        // Handle email challenge type
        if (claim_type === 'email_challenge') {
          if (!original_owner_email) {
            throw new Error('Original owner email required for email challenge')
          }

          // Generate secure token
          const emailToken = crypto.randomUUID()
          claimData.email_challenge_token = emailToken
          claimData.email_challenge_sent_at = new Date().toISOString()
          claimData.email_challenge_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

          // Send email challenge
          try {
            await resend.emails.send({
              from: 'LifeScribe <noreply@lifescribe.app>',
              to: [original_owner_email],
              subject: 'Admin Claim Request for Your Family',
              html: `
                <h2>Admin Claim Request</h2>
                <p>Someone has requested to claim admin rights for your family "${family.name}".</p>
                <p>If you approve this request, click the link below:</p>
                <p><a href="${supabaseUrl}/functions/v1/families-claim-admin/verify?token=${emailToken}&claim_id={{claim_id}}">Approve Admin Claim</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not expect this email, please ignore it.</p>
              `
            })
            console.log('Email challenge sent to:', original_owner_email)
          } catch (emailError) {
            console.error('Failed to send email challenge:', emailError)
            throw new Error('Failed to send email challenge')
          }
        }

        // Create the claim
        const { data: claim, error: claimError } = await supabase
          .from('admin_claims')
          .insert(claimData)
          .select()
          .single()

        if (claimError) {
          console.error('Error creating claim:', claimError)
          throw claimError
        }

        // If email challenge, update the claim ID in the metadata
        if (claim_type === 'email_challenge') {
          await supabase
            .from('admin_claims')
            .update({
              metadata: { email_sent_to: original_owner_email }
            })
            .eq('id', claim.id)
        }

        // Notify other family members about the claim
        const { data: familyMembers } = await supabase
          .from('members')
          .select('profile_id')
          .eq('family_id', family_id)
          .neq('profile_id', user.id)

        if (familyMembers) {
          const notifications = familyMembers.map(member => ({
            claim_id: claim.id,
            recipient_id: member.profile_id,
            notification_type: 'admin_claim_started',
            title: 'Admin Claim Request',
            message: `A family member has requested admin rights. ${claim_type === 'endorsement' ? 'Your endorsement may be needed.' : 'Email verification is in progress.'}`
          }))

          await supabase
            .from('admin_claim_notifications')
            .insert(notifications)
        }

        console.log(`Admin claim created with ID: ${claim.id}`)

        return new Response(
          JSON.stringify({
            success: true,
            claim_id: claim.id,
            claim_type,
            status: 'pending',
            message: claim_type === 'endorsement' 
              ? 'Claim created. Waiting for endorsements from family members.'
              : 'Email challenge sent. Please check the original owner\'s email.',
            expires_at: claim.expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
        )
      }

      if (action === 'endorse') {
        // Endorse or oppose a claim
        const { claim_id, endorsement_type, reason }: EndorseClaimRequest = await req.json()
        
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('Authorization header required')
        }
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        if (authError || !user) {
          throw new Error('Authentication required')
        }

        // Check if claim exists and user can endorse
        const { data: claim, error: claimError } = await supabase
          .from('admin_claims')
          .select('id, family_id, claimant_id, status, claim_type')
          .eq('id', claim_id)
          .single()

        if (claimError || !claim) {
          throw new Error('Claim not found')
        }

        if (claim.status !== 'pending') {
          throw new Error('Claim is no longer accepting endorsements')
        }

        if (claim.claimant_id === user.id) {
          throw new Error('You cannot endorse your own claim')
        }

        // Verify user is family member
        const { data: membership } = await supabase
          .from('members')
          .select('role')
          .eq('family_id', claim.family_id)
          .eq('profile_id', user.id)
          .single()

        if (!membership) {
          throw new Error('Only family members can endorse claims')
        }

        // Create or update endorsement
        const { data: endorsement, error: endorsementError } = await supabase
          .from('admin_claim_endorsements')
          .upsert({
            claim_id,
            endorser_id: user.id,
            endorsement_type,
            reason
          })
          .select()
          .single()

        if (endorsementError) {
          console.error('Error creating endorsement:', endorsementError)
          throw endorsementError
        }

        // Process the claim to check if requirements are met
        const { data: processResult } = await supabase
          .rpc('process_admin_claim', { p_claim_id: claim_id })

        console.log(`Endorsement created for claim ${claim_id}: ${endorsement_type}`)

        return new Response(
          JSON.stringify({
            success: true,
            endorsement_id: endorsement.id,
            endorsement_type,
            claim_status: processResult?.status || 'pending',
            message: processResult?.message || 'Endorsement recorded'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      if (action === 'process') {
        // Process claim or grant admin rights
        const { claim_id, action: processAction, email_token }: ProcessClaimRequest = await req.json()
        
        if (processAction === 'verify_email' && email_token) {
          // Verify email challenge token
          const { data: claim, error: claimError } = await supabase
            .from('admin_claims')
            .select('*')
            .eq('email_challenge_token', email_token)
            .eq('status', 'pending')
            .single()

          if (claimError || !claim) {
            throw new Error('Invalid or expired email verification token')
          }

          if (new Date() > new Date(claim.email_challenge_expires_at)) {
            throw new Error('Email verification token has expired')
          }

          // Mark email challenge as completed
          const { data: processResult } = await supabase
            .rpc('process_admin_claim', { p_claim_id: claim.id })

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Email verification completed',
              claim_status: processResult?.status,
              cooling_off_until: processResult?.cooling_off_until
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        if (processAction === 'grant_admin') {
          // Grant admin rights after cooling-off period
          const { data: grantResult, error: grantError } = await supabase
            .rpc('grant_admin_after_cooling_off', { p_claim_id: claim_id })

          if (grantError) {
            throw grantError
          }

          return new Response(
            JSON.stringify({
              success: grantResult.success,
              message: grantResult.message,
              error: grantResult.error,
              claimed_at: grantResult.claimed_at,
              cooling_off_until: grantResult.cooling_off_until
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // Default process action
        const { data: processResult } = await supabase
          .rpc('process_admin_claim', { p_claim_id: claim_id })

        return new Response(
          JSON.stringify(processResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    if (req.method === 'GET') {
      if (action === 'verify') {
        // Handle email verification link
        const token = url.searchParams.get('token')
        const claimId = url.searchParams.get('claim_id')
        
        if (!token) {
          throw new Error('Verification token required')
        }

        // Verify the token and approve the claim
        const verifyResponse = await fetch(`${req.url.split('/verify')[0]}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          body: JSON.stringify({
            claim_id: claimId,
            action: 'verify_email',
            email_token: token
          })
        })

        const result = await verifyResponse.json()

        // Return HTML response for email verification
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Admin Claim Verification</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                .success { color: #16a34a; }
                .error { color: #dc2626; }
              </style>
            </head>
            <body>
              <h1>Admin Claim Verification</h1>
              ${result.success 
                ? `<p class="success">✅ Email verification completed successfully!</p>
                   <p>The admin claim has been approved and will be granted after a 7-day cooling-off period.</p>`
                : `<p class="error">❌ Verification failed: ${result.message}</p>`
              }
              <p><a href="${supabaseUrl.replace('.supabase.co', '.netlify.app') || 'https://your-app.com'}">Return to LifeScribe</a></p>
            </body>
          </html>
        `

        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        })
      }
    }

    throw new Error('Invalid request')

  } catch (error) {
    console.error('Admin claim error:', error)
    
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