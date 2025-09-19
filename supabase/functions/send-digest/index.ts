import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SendDigestRequest {
  family_id: string;
  send_type?: 'scheduled' | 'forced';
  sent_by?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { family_id, send_type = 'scheduled', sent_by }: SendDigestRequest = await req.json();

    console.log(`Starting digest send for family ${family_id}, type: ${send_type}`);

    // Get family details and digest settings
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('name')
      .eq('id', family_id)
      .single();

    if (familyError || !family) {
      throw new Error(`Family not found: ${familyError?.message}`);
    }

    const { data: settings, error: settingsError } = await supabase
      .from('weekly_digest_settings')
      .select('*')
      .eq('family_id', family_id)
      .single();

    if (settingsError || !settings) {
      throw new Error(`Digest settings not found: ${settingsError?.message}`);
    }

    // Check if digest is enabled and not paused
    if (!settings.enabled) {
      return new Response(
        JSON.stringify({ error: 'Digest is disabled for this family' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (settings.is_paused && send_type !== 'forced') {
      return new Response(
        JSON.stringify({ error: 'Digest is paused for this family' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get family members with email addresses
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select(`
        profile_id,
        profiles!inner(email, full_name)
      `)
      .eq('family_id', family_id);

    if (membersError) {
      throw new Error(`Failed to get family members: ${membersError.message}`);
    }

    const recipients = members
      .filter(m => m.profiles?.email)
      .map(m => ({
        email: m.profiles.email,
        name: m.profiles.full_name || 'Family Member'
      }));

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipients found' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate digest content
    const { data: digestContent, error: contentError } = await supabase
      .rpc('generate_digest_preview', { p_family_id: family_id });

    if (contentError) {
      throw new Error(`Failed to generate digest content: ${contentError.message}`);
    }

    // Get recent content for the digest
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, title, excerpt, created_at')
      .eq('family_id', family_id)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: photos, error: photosError } = await supabase
      .from('media')
      .select('id, file_name, created_at')
      .eq('family_id', family_id)
      .like('mime_type', 'image/%')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(6);

    // Generate HTML email content
    const emailContent = generateDigestHTML({
      familyName: family.name,
      digestContent,
      stories: stories || [],
      photos: photos || [],
      weekStartDate: weekAgo.toLocaleDateString()
    });

    // Send emails using Resend (simplified - in production you'd use React Email)
    const emailPromises = recipients.map(async (recipient) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'LifeScribe Weekly Digest <updates@updates.lifescribe.family>',
          to: [recipient.email],
          subject: `${family.name} Weekly Digest`,
          html: emailContent,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to send email to ${recipient.email}:`, error);
        return { success: false, email: recipient.email, error };
      }

      return { success: true, email: recipient.email };
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter(r => r.success).length;

    // Log the digest send
    const currentWeek = new Date();
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());

    await supabase
      .from('digest_send_log')
      .upsert({
        family_id,
        digest_week: currentWeek.toISOString().split('T')[0],
        send_type,
        sent_by,
        recipient_count: successCount,
        content_summary: {
          stories: digestContent.stories || 0,
          photos: digestContent.photos || 0,
          comments: digestContent.comments || 0,
          birthdays: digestContent.birthdays || 0
        }
      });

    // Update last_sent_at in settings
    await supabase
      .from('weekly_digest_settings')
      .update({ 
        last_sent_at: new Date().toISOString(),
        ...(send_type === 'forced' && {
          last_forced_send_at: new Date().toISOString(),
          forced_send_by: sent_by
        })
      })
      .eq('family_id', family_id);

    console.log(`Digest sent successfully to ${successCount}/${recipients.length} recipients`);

    return new Response(
      JSON.stringify({
        success: true,
        recipients_sent: successCount,
        total_recipients: recipients.length,
        failed_sends: emailResults.filter(r => !r.success).map(r => r.email)
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in send-digest function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

function generateDigestHTML({ familyName, digestContent, stories, photos, weekStartDate }: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${familyName} Weekly Digest</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content-section { margin-bottom: 25px; }
        .story-item { margin-bottom: 15px; padding: 10px; border-left: 4px solid #3b82f6; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
        .photo-placeholder { aspect-ratio: 1; background: #f3f4f6; border-radius: 8px; }
        .stats { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${familyName} Weekly Digest</h1>
        <p>Week of ${weekStartDate}</p>
      </div>

      <div class="stats">
        <h3>This Week's Activity</h3>
        <p>📖 ${digestContent.stories || 0} new stories</p>
        <p>📸 ${digestContent.photos || 0} new photos</p>
        <p>💬 ${digestContent.comments || 0} new comments</p>
        <p>🎂 ${digestContent.birthdays || 0} upcoming birthdays</p>
      </div>

      ${stories.length > 0 ? `
        <div class="content-section">
          <h3>📖 Recent Stories</h3>
          ${stories.map(story => `
            <div class="story-item">
              <h4>${story.title}</h4>
              <p>${story.excerpt || 'New family story shared...'}</p>
              <small>Shared ${new Date(story.created_at).toLocaleDateString()}</small>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${photos.length > 0 ? `
        <div class="content-section">
          <h3>📸 Recent Photos</h3>
          <div class="photo-grid">
            ${photos.map(photo => `
              <div class="photo-placeholder"></div>
            `).join('')}
          </div>
          <p><small>${photos.length} new photos this week</small></p>
        </div>
      ` : ''}

      <div class="footer">
        <p>You're receiving this because you're part of the ${familyName} family.</p>
        <p>Family Stories • Bringing families together through shared memories</p>
      </div>
    </body>
    </html>
  `;
}