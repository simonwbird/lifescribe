import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAccessRequestRequest {
  familyId: string
  message?: string
  relationship?: string
  knownMember?: string
}

interface ApproveRequestRequest {
  requestId: string
  approvedRole?: string
}

interface DenyRequestRequest {
  requestId: string
  reason?: string
}

// Rate limiting for access requests (in-memory, should use Redis in production)
const requestRateLimit = new Map<string, { count: number; resetTime: number }>()
const MAX_REQUESTS_PER_DAY = 3
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

function isRequestRateLimited(userId: string): boolean {
  const now = Date.now()
  const record = requestRateLimit.get(userId)
  
  if (!record || now > record.resetTime) {
    requestRateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  
  if (record.count >= MAX_REQUESTS_PER_DAY) {
    return true
  }
  
  record.count++
  return false
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const resend = new Resend(resendApiKey)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // POST /families/{id}/requests - Create access request
    if (req.method === 'POST' && pathSegments[1] === 'families' && pathSegments[3] === 'requests' && pathSegments.length === 4) {
      const familyId = pathSegments[2]
      const { message, relationship, knownMember }: CreateAccessRequestRequest = await req.json()

      // Check feature flag
      const flagResult = await supabase.rpc('evaluate_feature_flag', {
        p_flag_key: 'onboarding.requests_v1',
        p_user_id: user.id,
        p_family_id: familyId
      })

      if (!flagResult.data?.enabled) {
        return new Response(JSON.stringify({ error: 'Access requests feature not enabled' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Rate limiting
      if (isRequestRateLimited(user.id)) {
        return new Response(JSON.stringify({ 
          error: 'You have reached the daily limit for access requests. Please try again tomorrow.',
          error_code: 'RATE_LIMITED'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Check if family exists and is active
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name, status')
        .eq('id', familyId)
        .eq('status', 'active')
        .single()

      if (familyError || !family) {
        return new Response(JSON.stringify({ error: 'Family not found or inactive' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', user.id)
        .eq('family_id', familyId)
        .single()

      if (existingMember) {
        return new Response(JSON.stringify({ 
          error: 'You are already a member of this family',
          error_code: 'ALREADY_MEMBER'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Check for existing pending request
      const { data: existingRequest } = await supabase
        .from('access_requests')
        .select('id, status')
        .eq('requester_id', user.id)
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .single()

      if (existingRequest) {
        return new Response(JSON.stringify({ 
          error: 'You already have a pending request for this family',
          error_code: 'REQUEST_EXISTS',
          request_id: existingRequest.id
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Create the access request
      const { data: request, error: requestError } = await supabase
        .from('access_requests')
        .insert({
          family_id: familyId,
          requester_id: user.id,
          requested_role: 'member',
          message: message || null,
          status: 'pending'
        })
        .select('*')
        .single()

      if (requestError) {
        console.error('Error creating access request:', requestError)
        return new Response(JSON.stringify({ error: 'Failed to create access request' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Get user profile for email
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      // Get family admins for notification
      const { data: adminMembers } = await supabase
        .from('members')
        .select(`
          profile_id,
          profiles:profile_id (
            full_name,
            email
          )
        `)
        .eq('family_id', familyId)
        .eq('role', 'admin')

      // Send notification emails to admins
      if (adminMembers && adminMembers.length > 0) {
        for (const admin of adminMembers) {
          if (!admin.profiles?.email) continue

          const approveUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/family-requests/${familyId}/requests/${request.id}/approve?token=${btoa(JSON.stringify({ adminId: admin.profile_id, requestId: request.id, action: 'approve' }))}`
          const denyUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/family-requests/${familyId}/requests/${request.id}/deny?token=${btoa(JSON.stringify({ adminId: admin.profile_id, requestId: request.id, action: 'deny' }))}`

          try {
            await resend.emails.send({
              from: "LifeScribe <notifications@lifescribe.app>",
              to: [admin.profiles.email],
              subject: `New family access request for ${family.name}`,
              html: `
                <h2>New Access Request</h2>
                <p><strong>${requesterProfile?.full_name || 'Someone'}</strong> (${requesterProfile?.email || user.email}) has requested to join your family "${family.name}".</p>
                
                ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                ${relationship ? `<p><strong>Relationship:</strong> ${relationship}</p>` : ''}
                ${knownMember ? `<p><strong>Says they know:</strong> ${knownMember}</p>` : ''}
                
                <div style="margin: 20px 0;">
                  <a href="${approveUrl}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve Request</a>
                  <a href="${denyUrl}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Deny Request</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">You can also manage this request from your LifeScribe admin dashboard.</p>
              `,
            })
          } catch (emailError) {
            console.error('Failed to send admin notification email:', emailError)
          }
        }
      }

      // Track telemetry
      await supabase.from('analytics_events').insert({
        event_name: 'REQUEST_SUBMITTED',
        user_id: user.id,
        family_id: familyId,
        properties: {
          request_id: request.id,
          family_id: familyId,
          requested_role: 'member',
          has_message: !!message,
          has_relationship: !!relationship,
          has_known_member: !!knownMember
        }
      })

      console.log(`Access request created: ${request.id} for family ${familyId} by user ${user.id}`)

      return new Response(JSON.stringify({
        request_id: request.id,
        family: {
          id: familyId,
          name: family.name
        },
        status: 'pending',
        message: 'Your access request has been submitted to the family admins'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // POST /families/{id}/requests/{reqId}/approve - Approve request
    if (req.method === 'POST' && pathSegments[1] === 'families' && pathSegments[3] === 'requests' && pathSegments[5] === 'approve') {
      const familyId = pathSegments[2]
      const requestId = pathSegments[4]
      const { approvedRole = 'member' }: ApproveRequestRequest = await req.json()

      // Check if user is admin of the family
      const { data: membership } = await supabase
        .from('members')
        .select('role')
        .eq('profile_id', user.id)
        .eq('family_id', familyId)
        .eq('role', 'admin')
        .single()

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Only family admins can approve requests' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Get the request
      const { data: request, error: requestError } = await supabase
        .from('access_requests')
        .select(`
          *,
          families:family_id (name),
          profiles:requester_id (full_name, email)
        `)
        .eq('id', requestId)
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .single()

      if (requestError || !request) {
        return new Response(JSON.stringify({ error: 'Request not found or already processed' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Create membership
      const { data: newMembership, error: membershipError } = await supabase
        .from('members')
        .insert({
          profile_id: request.requester_id,
          family_id: familyId,
          role: approvedRole
        })
        .select('*')
        .single()

      if (membershipError) {
        console.error('Error creating membership:', membershipError)
        return new Response(JSON.stringify({ error: 'Failed to create membership' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Update request status
      await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      // Send approval email to requester
      if (request.profiles?.email) {
        try {
          await resend.emails.send({
            from: "LifeScribe <notifications@lifescribe.app>",
            to: [request.profiles.email],
            subject: `Welcome to ${request.families?.name}!`,
            html: `
              <h2>Your access request has been approved!</h2>
              <p>Great news! You've been approved to join <strong>${request.families?.name}</strong> on LifeScribe.</p>
              
              <p>You can now:</p>
              <ul>
                <li>View and add family stories and memories</li>
                <li>Explore the family tree</li>
                <li>Connect with other family members</li>
                <li>Share photos, recipes, and more</li>
              </ul>
              
              <div style="margin: 20px 0;">
                <a href="https://lifescribe.app/home" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Start Exploring</a>
              </div>
              
              <p>Welcome to the family!</p>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError)
        }
      }

      // Track telemetry
      await supabase.from('analytics_events').insert({
        event_name: 'REQUEST_APPROVED',
        user_id: user.id,
        family_id: familyId,
        properties: {
          request_id: requestId,
          family_id: familyId,
          approved_by_id: user.id,
          approved_role: approvedRole
        }
      })

      console.log(`Access request ${requestId} approved by ${user.id}`)

      return new Response(JSON.stringify({
        success: true,
        membership: newMembership,
        message: 'Request approved successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // POST /families/{id}/requests/{reqId}/deny - Deny request
    if (req.method === 'POST' && pathSegments[1] === 'families' && pathSegments[3] === 'requests' && pathSegments[5] === 'deny') {
      const familyId = pathSegments[2]
      const requestId = pathSegments[4]
      const { reason }: DenyRequestRequest = await req.json()

      // Check if user is admin of the family
      const { data: membership } = await supabase
        .from('members')
        .select('role')
        .eq('profile_id', user.id)
        .eq('family_id', familyId)
        .eq('role', 'admin')
        .single()

      if (!membership) {
        return new Response(JSON.stringify({ error: 'Only family admins can deny requests' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Get the request
      const { data: request, error: requestError } = await supabase
        .from('access_requests')
        .select(`
          *,
          families:family_id (name),
          profiles:requester_id (full_name, email)
        `)
        .eq('id', requestId)
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .single()

      if (requestError || !request) {
        return new Response(JSON.stringify({ error: 'Request not found or already processed' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }

      // Update request status
      await supabase
        .from('access_requests')
        .update({
          status: 'denied',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_reason: reason || null
        })
        .eq('id', requestId)

      // Send denial email to requester
      if (request.profiles?.email) {
        try {
          await resend.emails.send({
            from: "LifeScribe <notifications@lifescribe.app>",
            to: [request.profiles.email],
            subject: `Update on your access request`,
            html: `
              <h2>Access Request Update</h2>
              <p>Thank you for your interest in joining <strong>${request.families?.name}</strong> on LifeScribe.</p>
              
              <p>After careful consideration, your access request was not approved at this time.</p>
              
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              
              <p>If you believe this was an error or would like to discuss this further, please reach out to a family member directly.</p>
              
              <p>You can also create your own family space on LifeScribe to start preserving your own memories.</p>
              
              <div style="margin: 20px 0;">
                <a href="https://lifescribe.app/onboarding" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Create Your Family Space</a>
              </div>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send denial email:', emailError)
        }
      }

      // Track telemetry
      await supabase.from('analytics_events').insert({
        event_name: 'REQUEST_DENIED',
        user_id: user.id,
        family_id: familyId,
        properties: {
          request_id: requestId,
          family_id: familyId,
          denied_by_id: user.id,
          denial_reason: reason || null
        }
      })

      console.log(`Access request ${requestId} denied by ${user.id}`)

      return new Response(JSON.stringify({
        success: true,
        message: 'Request denied successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error: any) {
    console.error('Error in family-requests function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
}

serve(handler)