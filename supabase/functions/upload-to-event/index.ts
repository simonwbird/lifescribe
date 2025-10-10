import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadToEventRequest {
  token: string;
  eventId: string;
  guestName?: string;
  guestNote?: string;
  taggedPeople?: string[];
  fileData: string; // base64 encoded
  fileName: string;
  mimeType: string;
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

    const {
      token,
      eventId,
      guestName,
      guestNote,
      taggedPeople = [],
      fileData,
      fileName,
      mimeType,
    }: UploadToEventRequest = await req.json();

    if (!token || !eventId || !fileData || !fileName) {
      return new Response(
        JSON.stringify({ error: 'token, eventId, fileData, and fileName are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate token
    const { data: uploadToken, error: tokenError } = await supabase
      .from('event_upload_tokens')
      .select('*, life_events(family_id)')
      .eq('token', token)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single();

    if (tokenError || !uploadToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired upload token' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token has expired
    if (new Date(uploadToken.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Upload token has expired' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check max uploads
    if (uploadToken.max_uploads && uploadToken.current_uploads >= uploadToken.max_uploads) {
      return new Response(
        JSON.stringify({ error: 'Maximum uploads reached for this link' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const familyId = (uploadToken.life_events as any)?.family_id;
    if (!familyId) {
      throw new Error('Could not determine family_id');
    }

    // Decode base64 file data
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));

    // Upload to storage
    const storagePath = `${familyId}/event-uploads/${eventId}/${Date.now()}-${fileName}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('media')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(storagePath);

    // Create media record
    const { data: mediaRecord, error: mediaError } = await supabase
      .from('media')
      .insert({
        family_id: familyId,
        file_path: storagePath,
        mime_type: mimeType,
        file_size: fileBuffer.length,
        uploaded_by: uploadToken.created_by,
        tags: ['event-upload'],
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Media error:', mediaError);
      throw mediaError;
    }

    // Create event upload record
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('event_uploads')
      .insert({
        event_id: eventId,
        upload_token_id: uploadToken.id,
        family_id: familyId,
        media_id: mediaRecord.id,
        guest_name: guestName || 'Anonymous Guest',
        guest_note: guestNote,
        tagged_people: taggedPeople,
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent'),
      })
      .select()
      .single();

    if (uploadError) {
      console.error('Upload record error:', uploadError);
      throw uploadError;
    }

    // Increment upload counter
    await supabase
      .from('event_upload_tokens')
      .update({ current_uploads: uploadToken.current_uploads + 1 })
      .eq('id', uploadToken.id);

    console.log('Event upload successful:', {
      eventId,
      mediaId: mediaRecord.id,
      guestName,
    });

    return new Response(
      JSON.stringify({
        success: true,
        uploadId: uploadRecord.id,
        mediaId: mediaRecord.id,
        url: urlData.publicUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error uploading to event:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});