import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QAActionRequest {
  action: 'mark_verified' | 'wont_fix' | 'merge_bugs';
  bugId?: string;
  currentBugId?: string;
  parentBugId?: string;
  mergeReason?: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('settings')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.settings as any)?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: QAActionRequest = await req.json();
    let result: any = {};

    switch (body.action) {
      case 'mark_verified':
        result = await handleMarkVerified(supabaseClient, user.id, body.bugId!, body.notes);
        break;
      
      case 'wont_fix':
        result = await handleWontFix(supabaseClient, user.id, body.bugId!, body.notes);
        break;
      
      case 'merge_bugs':
        result = await handleMergeBugs(
          supabaseClient, 
          user.id, 
          body.currentBugId!, 
          body.parentBugId!, 
          body.mergeReason!
        );
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in qa-actions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

async function handleMarkVerified(supabaseClient: any, userId: string, bugId: string, notes?: string) {
  // Update bug status to Fixed
  const { error: updateError } = await supabaseClient
    .from('bug_reports')
    .update({ 
      status: 'Fixed',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', bugId);

  if (updateError) throw updateError;

  // Log the change
  const { error: logError } = await supabaseClient.rpc('log_bug_change', {
    p_bug_report_id: bugId,
    p_changed_by: userId,
    p_change_type: 'verified',
    p_new_value: { status: 'Fixed' },
    p_notes: notes || 'Bug verified and marked as fixed'
  });

  if (logError) console.error('Error logging change:', logError);

  // Get bug details for notification
  const { data: bugData } = await supabaseClient
    .from('bug_reports')
    .select('user_id, title')
    .eq('id', bugId)
    .single();

  if (bugData) {
    // Create notification for reporter
    const { error: notifyError } = await supabaseClient.rpc('create_bug_notification', {
      p_bug_report_id: bugId,
      p_user_id: bugData.user_id,
      p_notification_type: 'resolved',
      p_title: 'Bug Verified',
      p_message: `Your bug report "${bugData.title}" has been verified and marked as fixed.`
    });

    if (notifyError) console.error('Error creating notification:', notifyError);
  }

  return { success: true, status: 'Fixed' };
}

async function handleWontFix(supabaseClient: any, userId: string, bugId: string, notes?: string) {
  // Update bug status to Closed
  const { error: updateError } = await supabaseClient
    .from('bug_reports')
    .update({ 
      status: 'Closed',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', bugId);

  if (updateError) throw updateError;

  // Log the change
  const { error: logError } = await supabaseClient.rpc('log_bug_change', {
    p_bug_report_id: bugId,
    p_changed_by: userId,
    p_change_type: 'wont_fix',
    p_new_value: { status: 'Closed' },
    p_notes: notes || 'Bug marked as won\'t fix'
  });

  if (logError) console.error('Error logging change:', logError);

  // Get bug details for notification
  const { data: bugData } = await supabaseClient
    .from('bug_reports')
    .select('user_id, title')
    .eq('id', bugId)
    .single();

  if (bugData) {
    // Create notification for reporter
    const { error: notifyError } = await supabaseClient.rpc('create_bug_notification', {
      p_bug_report_id: bugId,
      p_user_id: bugData.user_id,
      p_notification_type: 'status_change',
      p_title: 'Bug Status Updated',
      p_message: `Your bug report "${bugData.title}" has been marked as won't fix and closed.`
    });

    if (notifyError) console.error('Error creating notification:', notifyError);
  }

  return { success: true, status: 'Closed' };
}

async function handleMergeBugs(
  supabaseClient: any, 
  userId: string, 
  currentBugId: string, 
  parentBugId: string, 
  mergeReason: string
) {
  // Get both bug details
  const { data: currentBug } = await supabaseClient
    .from('bug_reports')
    .select('title, user_id')
    .eq('id', currentBugId)
    .single();

  const { data: parentBug } = await supabaseClient
    .from('bug_reports')
    .select('title')
    .eq('id', parentBugId)
    .single();

  if (!currentBug || !parentBug) {
    throw new Error('One or both bugs not found');
  }

  // Create merge record
  const { error: mergeError } = await supabaseClient
    .from('bug_merges')
    .insert({
      parent_bug_id: parentBugId,
      merged_bug_id: currentBugId,
      merged_by: userId,
      merge_reason: mergeReason
    });

  if (mergeError) throw mergeError;

  // Update current bug status to Duplicate
  const { error: updateError } = await supabaseClient
    .from('bug_reports')
    .update({ 
      status: 'Duplicate',
      updated_at: new Date().toISOString()
    })
    .eq('id', currentBugId);

  if (updateError) throw updateError;

  // Log the merge
  const { error: logError } = await supabaseClient.rpc('log_bug_change', {
    p_bug_report_id: currentBugId,
    p_changed_by: userId,
    p_change_type: 'merged',
    p_new_value: { 
      status: 'Duplicate',
      merged_with: parentBugId 
    },
    p_notes: `Merged with bug #${parentBugId.slice(0, 8)}: ${mergeReason}`
  });

  if (logError) console.error('Error logging merge:', logError);

  // Notify reporter
  const { error: notifyError } = await supabaseClient.rpc('create_bug_notification', {
    p_bug_report_id: currentBugId,
    p_user_id: currentBug.user_id,
    p_notification_type: 'merged',
    p_title: 'Bug Merged',
    p_message: `Your bug report "${currentBug.title}" has been merged with "${parentBug.title}".`
  });

  if (notifyError) console.error('Error creating notification:', notifyError);

  return { 
    success: true, 
    parentBugId,
    status: 'Duplicate'
  };
}

serve(handler);