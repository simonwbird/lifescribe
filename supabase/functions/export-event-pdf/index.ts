import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportPDFRequest {
  recapId: string;
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

    const { recapId }: ExportPDFRequest = await req.json();

    if (!recapId) {
      return new Response(
        JSON.stringify({ error: 'recapId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get recap details
    const { data: recap, error: recapError } = await supabase
      .from('event_recaps')
      .select('*, life_events(title, event_date, event_type)')
      .eq('id', recapId)
      .single();

    if (recapError || !recap) {
      throw new Error('Recap not found');
    }

    // Verify user has access
    const { data: membership, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('profile_id', user.id)
      .eq('family_id', recap.family_id)
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate simple HTML for PDF conversion (in real implementation, use a PDF library)
    const htmlContent = generateRecapHTML(recap);

    console.log('PDF export requested:', { recapId, userId: user.id });

    // Note: This is a simplified version. In production, you'd use a library like
    // puppeteer or a PDF generation service to convert HTML to PDF
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF generation in progress',
        htmlContent, // In production, return PDF blob
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateRecapHTML(recap: any): string {
  const event = recap.life_events;
  const content = recap.content || {};
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${recap.title}</title>
      <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        h1 { color: #333; border-bottom: 3px solid #4A90E2; padding-bottom: 10px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .quote { border-left: 4px solid #4A90E2; padding-left: 15px; margin: 15px 0; font-style: italic; }
        .timeline { margin: 20px 0; }
        .timeline-item { margin: 10px 0; padding: 10px; border-left: 2px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>${recap.title}</h1>
      <p><strong>Event:</strong> ${event?.title || 'Untitled Event'}</p>
      <p><strong>Date:</strong> ${event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}</p>
      
      <div class="stats">
        <div class="stat">
          <strong>${content.stats?.totalPhotos || 0}</strong><br>Photos
        </div>
        <div class="stat">
          <strong>${content.stats?.totalGuests || 0}</strong><br>Contributors
        </div>
        <div class="stat">
          <strong>${content.stats?.totalNotes || 0}</strong><br>Messages
        </div>
      </div>

      <h2>Memorable Quotes</h2>
      ${(content.quotes || []).map((q: any) => `
        <div class="quote">
          "${q.text}"<br>
          <small>- ${q.author}</small>
        </div>
      `).join('')}

      <h2>Event Timeline</h2>
      <div class="timeline">
        ${(content.timeline || []).slice(0, 15).map((t: any) => `
          <div class="timeline-item">
            <strong>${new Date(t.time).toLocaleTimeString()}</strong> - ${t.description}
            ${t.note ? `<br><em>${t.note}</em>` : ''}
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}