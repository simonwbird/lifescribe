import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateMagicLinkRequest {
  familyId: string;
  roleScope: 'read-only' | 'read-react' | 'read-comment';
  maxUses?: number;
  expiresInDays?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { familyId, roleScope, maxUses = 1, expiresInDays = 7 } = await req.json() as CreateMagicLinkRequest;

    // Verify user is admin of the family
    const { data: membership } = await supabaseClient
      .from('members')
      .select('role')
      .eq('family_id', familyId)
      .eq('profile_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create magic link
    const { data: magicLink, error } = await supabaseClient
      .from('magic_links')
      .insert({
        family_id: familyId,
        token,
        role_scope: roleScope,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
      })
      .select()
      .single();

    if (error) throw error;

    const appUrl = req.headers.get('origin') || 'https://lifescribe.lovable.app';
    const joinUrl = `${appUrl}/invite/${token}`;

    return new Response(
      JSON.stringify({
        success: true,
        magicLink,
        joinUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating magic link:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});