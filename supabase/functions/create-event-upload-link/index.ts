import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUploadLinkRequest {
  eventId: string;
  familyId: string;
  expiresInDays?: number;
  maxUploads?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { eventId, familyId, expiresInDays = 7, maxUploads = null }: CreateUploadLinkRequest =
      await req.json();

    if (!eventId || !familyId) {
      return new Response(
        JSON.stringify({ error: 'eventId and familyId are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user is admin of the family
    const { data: membership, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('profile_id', user.id)
      .eq('family_id', familyId)
      .single();

    if (memberError || membership?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate token
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'generate_event_upload_token'
    );

    if (tokenError || !tokenData) {
      throw new Error('Failed to generate token');
    }

    const token = tokenData as string;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Insert upload token
    const { data: uploadToken, error: insertError } = await supabase
      .from('event_upload_tokens')
      .insert({
        event_id: eventId,
        token,
        created_by: user.id,
        family_id: familyId,
        expires_at: expiresAt.toISOString(),
        max_uploads: maxUploads,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Upload link created:', { eventId, token, userId: user.id });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        uploadUrl: `${req.headers.get('origin')}/events/${eventId}/upload/${token}`,
        expiresAt: expiresAt.toISOString(),
        maxUploads,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating upload link:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});