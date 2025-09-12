import { useCallback } from 'react'

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
  | 'notifications_view_all_clicked';

export const useAnalytics = () => {
  const track = useCallback((event: AnalyticsEvent, properties?: Record<string, any>) => {
    // For now, just log to console - will be replaced with actual analytics
    console.log(`Analytics: ${event}`, properties);
    
    // In production, this would send to your analytics service
    // analytics.track(event, properties);
  }, []);

  return { track };
};