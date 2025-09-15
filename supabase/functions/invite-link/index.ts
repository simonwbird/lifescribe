import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteLinkRequest {
  familyId: string;
  role?: string;
}

serve(async (req) => {
  console.log("invite-link called", { method: req.method });

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    const { familyId, role = "member" } = await req.json() as InviteLinkRequest;
    if (!familyId) {
      return new Response(JSON.stringify({ error: "Missing familyId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure requester is an admin of the family
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("role")
      .eq("family_id", familyId)
      .eq("profile_id", user.id)
      .single();

    if (memberError || !member || member.role !== "admin") {
      console.error("Admin check failed:", memberError, member);
      return new Response(JSON.stringify({ error: "Only family admins can create invite links" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create a token-backed invite row usable by link
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // We use a placeholder email so InviteLanding can work; UI will clear it.
    const placeholderEmail = "shareable-link@lifescribe.local";

    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .insert({
        family_id: familyId,
        email: placeholderEmail,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (inviteError) {
      console.error("Error creating link invite:", inviteError);
      return new Response(JSON.stringify({ error: "Failed to create invite link" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const appUrl = Deno.env.get("APP_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
    const joinUrl = `${appUrl}/invite/${token}`;

    return new Response(
      JSON.stringify({ success: true, inviteId: invite.id, token, joinUrl, expiresAt: expiresAt.toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("invite-link unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});