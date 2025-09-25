import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateInviteRequest {
  token: string;
}

serve(async (req) => {
  console.log("invite-validate called", { method: req.method });

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json() as ValidateInviteRequest;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch invite by token using service role (bypasses RLS safely on server)
    const { data: invite, error } = await supabase
      .from("invites")
      .select("id, family_id, email, role, expires_at, accepted_at, families:family_id(name)")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return new Response(JSON.stringify({ error: "Invalid invite" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (invite.accepted_at) {
      return new Response(JSON.stringify({ error: "Invite already accepted" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const nowIso = new Date().toISOString();
    if (invite.expires_at <= nowIso) {
      return new Response(JSON.stringify({ error: "Invite expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Return sanitized payload (avoid leaking family emails etc.)
    return new Response(JSON.stringify({
      success: true,
      invite: {
        id: invite.id,
        family_id: invite.family_id,
        email: invite.email,
        role: invite.role,
        family_name: (invite.families as any)?.name ?? "",
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("invite-validate unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});