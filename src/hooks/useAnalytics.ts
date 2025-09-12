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
  | 'streak_open'
  | 'profile_open'
  | 'switch_family_success'
  | 'help_open'
  | 'command_palette_open'
  | 'command_palette_action'
  | 'command_palette_result_select'
  | 'keyboard_shortcut_help'
  | 'quick_capture_open'
  | 'quick_capture_voice_start'
  | 'quick_capture_voice_stop'
  | 'quick_capture_save'
  | 'quick_capture_save_draft'
  | 'prompt_quick_capture_clicked';

export const useAnalytics = () => {
  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    // For now, just log to console - will be replaced with actual analytics
    console.log(`Analytics: ${event}`, properties);
    
    // In production, this would send to your analytics service
    // analytics.track(event, properties);
  };

  return { track };
};