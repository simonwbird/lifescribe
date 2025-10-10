import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JoinWaitlistRequest {
  email: string;
  roleIntent: 'owner' | 'executor' | 'guardian' | 'beneficiary';
  notes?: string;
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

    const { email, roleIntent, notes }: JoinWaitlistRequest = await req.json();

    if (!email || !roleIntent) {
      return new Response(
        JSON.stringify({ error: 'Email and role intent are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user and family info if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    let familyId = null;

    if (user) {
      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      familyId = membership?.family_id || null;
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('safebox_waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          error: 'You are already on the waitlist',
          alreadyJoined: true 
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert waitlist entry
    const { data: entry, error: insertError } = await supabase
      .from('safebox_waitlist')
      .insert({
        user_id: user?.id || null,
        family_id: familyId,
        email,
        role_intent: roleIntent,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Waitlist entry created:', {
      id: entry.id,
      email,
      roleIntent,
      userId: user?.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully joined the SafeBox waitlist',
        entryId: entry.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});