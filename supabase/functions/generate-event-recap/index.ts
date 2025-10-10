import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRecapRequest {
  eventId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { eventId }: GenerateRecapRequest = await req.json();

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'eventId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('life_events')
      .select('*, people(full_name)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Check if recap already exists
    const { data: existingRecap } = await supabase
      .from('event_recaps')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingRecap) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Recap already exists',
          recapId: existingRecap.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all uploads for this event
    const { data: uploads, error: uploadsError } = await supabase
      .from('event_uploads')
      .select('*, media(id, file_path, mime_type)')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: true });

    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError);
    }

    // Get top 20 photos by reactions
    const { data: topPhotos, error: photosError } = await supabase
      .from('media')
      .select(`
        id,
        file_path,
        mime_type,
        reactions:reactions(count)
      `)
      .eq('family_id', event.family_id)
      .contains('tags', ['event-upload'])
      .limit(20);

    if (photosError) {
      console.error('Error fetching top photos:', photosError);
    }

    // Sort by reaction count
    const sortedPhotos = (topPhotos || []).sort((a, b) => {
      const aCount = (a as any).reactions?.[0]?.count || 0;
      const bCount = (b as any).reactions?.[0]?.count || 0;
      return bCount - aCount;
    });

    // Build content
    const photoIds = sortedPhotos.slice(0, 20).map(p => p.id);
    
    const quotes = (uploads || [])
      .filter(u => u.guest_note && u.guest_note.trim().length > 0)
      .map(u => ({
        text: u.guest_note,
        author: u.guest_name || 'Anonymous',
        timestamp: u.uploaded_at,
      }))
      .slice(0, 10);

    const timeline = (uploads || []).map(u => ({
      time: u.uploaded_at,
      description: `${u.guest_name || 'Guest'} uploaded a photo`,
      note: u.guest_note,
    }));

    const content = {
      heroPhotos: photoIds.slice(0, 6),
      quotes,
      timeline,
      stats: {
        totalPhotos: uploads?.length || 0,
        totalGuests: new Set((uploads || []).map(u => u.guest_name)).size,
        totalNotes: quotes.length,
      },
    };

    // Create recap
    const { data: recap, error: recapError } = await supabase
      .from('event_recaps')
      .insert({
        event_id: eventId,
        family_id: event.family_id,
        status: 'draft',
        title: `${event.title} - Event Recap`,
        content,
        photo_ids: photoIds,
        attendee_count: new Set((uploads || []).map(u => u.guest_name)).size,
        auto_generated: true,
      })
      .select()
      .single();

    if (recapError) {
      console.error('Error creating recap:', recapError);
      throw recapError;
    }

    console.log('Event recap generated:', { eventId, recapId: recap.id });

    return new Response(
      JSON.stringify({
        success: true,
        recapId: recap.id,
        content,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating recap:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});