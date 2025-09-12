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
  | 'search_performed'
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
  | 'collections_open'
  | 'family_open'
  | 'prompts_open'
  | 'streak_open'
  | 'profile_open'
  | 'switch_family_success'
  | 'help_open'
  | 'command_palette_open'
  | 'keyboard_shortcut_help';

export const useAnalytics = () => {
  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    // For now, just log to console - will be replaced with actual analytics
    console.log(`Analytics: ${event}`, properties);
    
    // In production, this would send to your analytics service
    // analytics.track(event, properties);
  };

  return { track };
};