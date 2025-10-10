import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for validation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get magic link
    const { data: magicLink, error: linkError } = await supabaseAdmin
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !magicLink) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate link
    if (magicLink.revoked) {
      return new Response(JSON.stringify({ error: 'Link has been revoked' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link has expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (magicLink.current_uses >= magicLink.max_uses) {
      return new Response(JSON.stringify({ error: 'Link has reached maximum uses' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment use count
    await supabaseAdmin
      .from('magic_links')
      .update({ 
        current_uses: magicLink.current_uses + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', magicLink.id);

    // Create guest session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('guest_sessions')
      .insert({
        magic_link_id: magicLink.id,
        family_id: magicLink.family_id,
        session_token: sessionToken,
        role_scope: magicLink.role_scope,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIp,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Get family info
    const { data: family } = await supabaseAdmin
      .from('families')
      .select('name')
      .eq('id', magicLink.family_id)
      .single();

    // Log audit event
    await supabaseAdmin.rpc('log_audit_event', {
      p_action: 'INVITE_LINK_USED',
      p_entity_type: 'magic_link',
      p_entity_id: magicLink.id,
      p_family_id: magicLink.family_id,
      p_details: {
        role_scope: magicLink.role_scope,
        session_id: session.id
      },
      p_risk_score: 3
    });

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          token: sessionToken,
          familyId: magicLink.family_id,
          familyName: family?.name,
          roleScope: magicLink.role_scope,
          expiresAt: expiresAt.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error validating magic link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});