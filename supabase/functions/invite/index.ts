import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  familyId: string;
  email: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Invite function called with method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header and validate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limiting: Check recent invites from this user (max 10 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentInvites, error: rateLimitError } = await supabase
      .from("invites")
      .select("id")
      .eq("invited_by", user.id)
      .gte("created_at", oneHourAgo.toISOString());

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    } else if (recentInvites && recentInvites.length >= 10) {
      console.warn("Rate limit exceeded for user:", user.id);
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please wait before sending more invitations." 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse request body
    const { familyId, email, role = "member" }: InviteRequest = await req.json();

    if (!familyId || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate user is admin of the family
    const { data: memberCheck, error: memberError } = await supabase
      .from("members")
      .select("role")
      .eq("family_id", familyId)
      .eq("profile_id", user.id)
      .single();

    if (memberError || !memberCheck || memberCheck.role !== "admin") {
      console.error("Admin check failed:", memberError, memberCheck);
      return new Response(JSON.stringify({ error: "Only family admins can send invites" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get family details for email
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single();

    if (familyError || !family) {
      console.error("Family fetch error:", familyError);
      return new Response(JSON.stringify({ error: "Family not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate invite token and expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check if invite already exists for this email/family
    const { data: existingInvite } = await supabase
      .from("invites")
      .select("id")
      .eq("family_id", familyId)
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    let inviteId;
    
    if (existingInvite) {
      // Update existing invite
      const { data: updatedInvite, error: updateError } = await supabase
        .from("invites")
        .update({
          token,
          role,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", existingInvite.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error updating invite:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update invite" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      inviteId = updatedInvite.id;
    } else {
      // Create new invite
      const { data: newInvite, error: inviteError } = await supabase
        .from("invites")
        .insert({
          family_id: familyId,
          email,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (inviteError) {
        console.error("Error creating invite:", inviteError);
        return new Response(JSON.stringify({ error: "Failed to create invite" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      inviteId = newInvite.id;
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendApiKey);
    
    // Build join URL
    const appUrl = Deno.env.get("APP_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    const joinUrl = `${appUrl}/invite/${token}`;

    // Format expiration date
    const expiresAtFormatted = expiresAt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // HTML Email Template
    const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>LifeScribe Invitation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      /* Minimal inline-safe styles */
      .container { width: 100%; background:#f6f7fb; padding: 24px 0; }
      .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px;
              box-shadow: 0 2px 8px rgba(16,24,40,0.08); padding: 28px; font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; color:#111827; }
      .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 18px; color:#111827; }
      .muted { color:#6b7280; }
      .h1 { font-size: 22px; font-weight: 700; margin: 16px 0 8px; }
      .p { font-size: 15px; line-height: 1.6; margin: 8px 0; }
      .cta { display:inline-block; background:#111827; color:#ffffff; text-decoration:none; font-weight:600;
             padding:12px 18px; border-radius:10px; margin-top: 14px; }
      .footer { font-size: 12px; color:#6b7280; margin-top: 22px; }
      .divider { height:1px; background:#e5e7eb; margin: 20px 0; }
    </style>
  </head>
  <body class="container" style="margin:0;padding:0;background:#f6f7fb;">
    <div class="card">
      <div class="brand">
        <img src="https://via.placeholder.co/28x28" width="28" height="28" alt="" style="border-radius:6px;background:#111827;">
        <span>LifeScribe</span>
      </div>

      <h1 class="h1">Join the ${family.name} family on LifeScribe</h1>
      <p class="p">Hello ${email},</p>
      <p class="p">You've been invited to join <strong>${family.name}</strong> on <strong>LifeScribe</strong> — a private place to share stories, photos, and memories across generations.</p>

      <a class="cta" href="${joinUrl}" target="_blank" rel="noopener">Accept Invitation</a>

      <p class="p" style="margin-top:14px;">This link expires on <strong>${expiresAtFormatted}</strong>. If you didn't expect this email, you can ignore it.</p>

      <div class="divider"></div>
      <p class="footer">LifeScribe — Private family memories, preserved.</p>
      <p class="footer">If the button doesn't work, copy and paste this link into your browser:<br>${joinUrl}</p>
    </div>
  </body>
</html>`;

    // Text fallback
    const textContent = `Hello ${email},

You've been invited to join the "${family.name}" family space on LifeScribe — a private place to share stories, photos, and memories across generations.

Accept your invitation:
${joinUrl}

This link expires on ${expiresAtFormatted}. If you didn't expect this email, you can ignore it.

LifeScribe — Private family memories, preserved.`;

    // Send email
    const fromAddress = Deno.env.get("INVITE_FROM_EMAIL") || "LifeScribe <onboarding@resend.dev>";
    const sendResult = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "You've been invited to join LifeScribe",
      html: htmlContent,
      text: textContent,
    });

    const emailError = (sendResult as any)?.error;
    if (emailError) {
      console.error("Email sending error:", emailError);
      // Provide clearer guidance when the domain isn't verified
      const message = typeof emailError?.error === 'string' && emailError.error.includes('not verified')
        ? 'Email domain is not verified in Resend. Please verify your domain at https://resend.com/domains or set INVITE_FROM_EMAIL to onboarding@resend.dev.'
        : 'Failed to send invitation email';

      const status = (typeof emailError?.statusCode === 'number' && emailError.statusCode !== 200) ? emailError.statusCode : 500;
      return new Response(JSON.stringify({ error: message, code: 'email_failed' }), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Invitation sent successfully to:", email);
    
    // Security audit log
    console.log("SECURITY_EVENT: invite_sent", {
      action: "invite_sent",
      inviter_id: user.id,
      family_id: familyId,
      target_email: email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email in logs
      role,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitation sent successfully",
      inviteId 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);