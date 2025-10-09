export type AnalyticsEvent = 
  | 'home_activity_open'
  | 'home_filter_changed'
  | 'home_mark_all_read'
  | 'continue_resume_click'
  | 'quickstart_selected_s'
  | 'quickstart_selected_u'
  | 'quickstart_selected_q'
  | 'quickstart_selected_r'
  | 'quickstart_selected_i'
  | 'starter_pack_begin'
  | 'starter_pack_complete'
  | 'starter_pack_prompt_clicked'
  | 'prompt_hub_tab_changed'
  | 'prompt_hub_prompt_clicked'
  | 'simple_mode_toggled'
  | 'suggestion_dismissed'
  | 'upcoming_quick_action'
  | 'dragdrop_upload_started'
  | 'create_item_selected'
  | 'family_menu_selected'
  | 'search_keyboard_shortcut_used'
  | 'search_slash_shortcut_used'
  | 'search_focus'
  | 'search_submit'
  | 'search_suggestion_click'
  | 'search_performed'
  | 'search_filter_add'
  | 'search_filter_remove'
  | 'search_create_from_empty'
  | 'mobile_nav_clicked'
  | 'mobile_create_clicked'
  | 'notification_clicked'
  | 'notifications_mark_all_read'
  | 'notifications_view_all_clicked'
  | 'nav_click_home'
  | 'nav_click_people'
  | 'nav_click_tree'
  | 'nav_click_create'
  | 'create_select_story'
  | 'create_select_photo'
  | 'create_select_voice'
  | 'create_select_recipe'
  | 'create_select_object'
  | 'create_select_property'
  | 'create_select_pet'
  | 'create_select_prompt'
  | 'search_open'
  | 'search_result_click'
  | 'search_see_all'
  | 'smart_answer_shown'
  | 'smart_answer_open'
  | 'collections_open'
  | 'family_open'
  | 'prompts_open'
  | 'prompt.swap'
  | 'simple_mode.record_without_prompt'
  | 'recorder.offline_queue'
  | 'recorder.permission_denied'
  | 'streak_open'
  | 'profile_open'
  | 'switch_family_success'
  | 'family_switch'
  | 'help_open'
  | 'command_palette_open'
  | 'command_palette_action'
  | 'command_palette_result_select'
  | 'keyboard_shortcut_help'
  | 'quick_capture_open'
  | 'quick_capture_voice_start'
  | 'quick_capture_voice_stop'
  | 'quick_capture_video_start'
  | 'quick_capture_video_stop'
  | 'quick_capture_save'
  | 'quick_capture_save_draft'
  | 'prompt_quick_capture_clicked'
  | 'voice_capture_start'
  | 'voice_capture_stop'
  | 'more_menu_click'
  // Home v2 events
  | 'home_v2_load'
  | 'home_quick_capture_open'
  | 'home_suggestion_click'
  | 'home_resume_click'
  | 'home_streak_capture'
  | 'home_simple_mode_toggle'
  // Voice capture events
  | 'voice_capture_complete'
  | 'voice_capture_error'
  | 'voice_transcription_start'
  | 'voice_transcription_complete'
  | 'voice_story_published'
  | 'voice_story_saved_draft'
  | 'voice_suggestions_accepted'
  | 'voice_modal_open'
  | 'voice_modal_close'
  | 'voice_hero_start'
  // New home events
  | 'draft_resumed'
  | 'draft_deleted'
  | 'activity_clicked'
  | 'activity_reaction'
  | 'invite_banner_dismissed'
  | 'invite_link_copied'
  | 'invite_email_clicked'
  | 'birthday_quick_action'
  | 'view_all_birthdays_clicked'
  | 'weekly_digest_toggled'
  | 'weekly_digest_schedule_changed'
  | 'weekly_digest_settings_opened'
  // MVP Tracking Events
  | 'invite_sent'
  | 'invite_accepted'
  | 'capture_start'
  | 'capture_stop'
  | 'transcribe_success'
  | 'transcribe_error'
  | 'publish_success'
  | 'publish_error'
  | 'comment_created'
  | 'reaction_added'
  | 'digest_scheduled'
  | 'digest_sent'
  | 'digest_opened'
  | 'digest_forced_send' 
  | 'digest_paused'
  | 'digest_resumed'
  // Elder Simple Mode events
  | 'simple_mode.header_view'
  | 'prompt.impression' 
  | 'prompt.shuffle'
  | 'prompt.tts_play'
  | 'prompt.record_start'
  | 'prompt.input_type_selected'
  | 'blank_canvas.input_type_selected'
  | 'story.created_from_prompt'
  | 'recorder.permission_denied'
  | 'recorder.offline_queue'
  // Feed and social events
  | 'realtime_update_received'
  | 'story_expanded_inline'
  | 'realtime_toggled'
  | 'story_liked'
  | 'story_commented' 
  | 'story_shared'
  | 'feed_filter_applied'
  | 'inline_story_opened'
  | 'inline_story_closed'
  | 'live_mode_toggled'
  | 'weekly_digest_settings_saved'
  | 'weekly_digest_preview_opened'
  | 'weekly_digest_test_sent'
  | 'weekly_digest_recipients_updated'
  | 'event_details_opened'
  | 'event_added_to_calendar'
  | 'event_contribute_clicked'
  | 'event_invite_clicked'
  | 'event_shared_native'
  | 'event_shared_clipboard'
  | 'event_contribution_submitted'
  | 'event_contribution_link_copied'
  | 'event_invites_sent'
  | 'upcoming_write_note_clicked'
  | 'upcoming_add_photo_clicked'
  // Admin impersonation events
  | 'ADMIN_IMPERSONATE_STARTED'
  | 'ADMIN_IMPERSONATE_ENDED'
  | 'ADMIN_IMPERSONATE_TIMEOUT'
  | 'ADMIN_IMPERSONATE_BLOCKED_WRITE'
  // Admin family overview events
  | 'ADMIN_FAMILY_FILTER_APPLIED'
  | 'ADMIN_ROW_ACTION_CLICKED'
  | 'ADMIN_FAMILY_VIEW_LOADED'
  | 'ADMIN_FAMILY_EXPORT_STARTED'
  // Admin activation events
  | 'ADMIN_ACTIVATION_DASHBOARD_LOADED'
  | 'ADMIN_FUNNEL_STAGE_CLICKED'
  | 'ADMIN_NUDGE_SENT'
  | 'ADMIN_COHORT_FILTER_APPLIED'
  | 'ADMIN_ACTIVATION_EXPORT_STARTED'
  // Nudge orchestrator events
  | 'NUDGE_CREATED'
  | 'NUDGE_SENT'
  | 'NUDGE_CONVERTED'
  | 'NUDGE_STATUS_CHANGED'
  | 'NUDGE_CREATE_STARTED'
  // Moderation events
  | 'FLAG_RESOLVED'
  | 'MOD_ACTION_APPLIED'
  // Media pipeline events
  | 'MEDIA_JOB_RETRIED'
  | 'MEDIA_VENDOR_SWITCHED'
  // Content admin events
  | 'CONTENT_BULK_EDIT_APPLIED'
  // Feature flags events
  | 'flag_created'
  | 'flag_targeting_updated'
  | 'flag_enabled'
  | 'flag_disabled'
  // Date localization events
  | 'DATE_RENDER_GATEWAY_USED'
  | 'DATE_FORMAT_ERROR'
  | 'TIMEZONE_ERROR_SENTINEL'
  | 'REGION_PREFS_CONFIRMED'
  | 'REGION_PREFS_UPDATED'
  // Invitation management events
  | 'invite_revoked'
  | 'invite_resent' 
  | 'member_role_update'
  | 'share_link_generated'
  | 'share_link_copied'
  // Feed banner events
  | 'feed_banner_dismissed'
  | 'feed_banner_clicked';

import { supabase } from '@/integrations/supabase/client'
import { useMode } from './useMode'
import { useLabs } from './useLabs'
import { useCallback, useRef } from 'react'

// Batch analytics events to reduce API calls
const analyticsQueue: Array<{
  event: AnalyticsEvent
  properties: Record<string, any>
  timestamp: number
}> = []

let flushTimeout: NodeJS.Timeout | null = null
const BATCH_SIZE = 10
const BATCH_TIMEOUT = 2000 // 2 seconds

const flushAnalytics = async () => {
  if (analyticsQueue.length === 0) return

  const batch = analyticsQueue.splice(0)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's family context (cached for this session)
    let familyId = null
    const { data: membership } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)
      .limit(1)
      .single()
    
    if (membership) {
      familyId = membership.family_id
    }

    // Insert all events in batch
    const eventsToInsert = batch.map(item => ({
      event_name: item.event,
      user_id: user.id,
      family_id: familyId,
      properties: {
        ...item.properties,
        userId: user.id,
        familyId: familyId,
        mode: 'studio', // Default fallback
        labsEnabled: false, // Default fallback
        timestamp: new Date(item.timestamp).toISOString()
      }
    }))

    await supabase.from('analytics_events').insert(eventsToInsert)
  } catch (error) {
    console.error('Failed to flush analytics batch:', error)
    // Re-add failed events back to queue for retry
    analyticsQueue.unshift(...batch)
  }
}

export const useAnalytics = () => {
  const { mode } = useMode()
  const { labsEnabled } = useLabs()
  const familyIdCache = useRef<string | null>(null)
  const lastFamilyFetch = useRef<number>(0)

  const track = useCallback(async (event: AnalyticsEvent, properties?: Record<string, any>) => {
    // Log to console for debugging
    console.log(`Analytics: ${event}`, properties);
    
    try {
      // Add event to batch queue with current context
      analyticsQueue.push({
        event,
        properties: {
          ...properties,
          mode,
          labsEnabled
        },
        timestamp: Date.now()
      })

      // Clear existing timeout
      if (flushTimeout) {
        clearTimeout(flushTimeout)
      }

      // Flush immediately if batch is full, otherwise set timeout
      if (analyticsQueue.length >= BATCH_SIZE) {
        await flushAnalytics()
      } else {
        flushTimeout = setTimeout(flushAnalytics, BATCH_TIMEOUT)
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }, [mode, labsEnabled])
  return { track };
};