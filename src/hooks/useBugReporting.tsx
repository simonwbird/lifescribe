import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BugReportData {
  title: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  notes?: string;
  severity: 'Low' | 'Medium' | 'High';
  consentDeviceInfo: boolean;
}

export const useBugReporting = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkBugReportingEnabled();
  }, []);

  const checkBugReportingEnabled = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();

      const role = (profile?.settings as any)?.role;
      setUserRole(role);

      // Evaluate feature flag for bug reporting
      const { data: flagResult } = await supabase.rpc('evaluate_feature_flag', {
        p_flag_key: 'bug_reporting_v1',
        p_user_id: user.id,
        p_user_role: role
      });

      setIsEnabled((flagResult as any)?.enabled || false);
    } catch (error) {
      console.error('Error checking bug reporting feature flag:', error);
      setIsEnabled(false);
    }
  };

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        useCORS: true,
        allowTaint: true,
        scale: 0.5 // Reduce size for faster processing
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  };

  const getDeviceInfo = () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });

  const submitBugReport = async (
    data: BugReportData, 
    screenshots: File[], 
    uploads: File[]
  ): Promise<{ success: boolean; bugId?: string; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's family_id
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single();

      const deviceInfo = data.consentDeviceInfo ? getDeviceInfo() : {};
      
      // Create bug report
      const { data: bugReport, error: bugError } = await supabase
        .from('bug_reports')
        .insert({
          title: data.title,
          expected_behavior: data.expectedBehavior,
          actual_behavior: data.actualBehavior,
          notes: data.notes,
          severity: data.severity,
          url: window.location.href,
          route: window.location.pathname,
          user_id: user.id,
          family_id: member?.family_id,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          user_agent: navigator.userAgent,
          device_info: deviceInfo,
          consent_device_info: data.consentDeviceInfo
        })
        .select()
        .single();

      if (bugError) throw bugError;

      // Upload attachments
      const allFiles = [...screenshots, ...uploads];
      for (const file of allFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${bugReport.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        // Create attachment record
        await supabase
          .from('bug_report_attachments')
          .insert({
            bug_report_id: bugReport.id,
            file_path: fileName,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            attachment_type: screenshots.includes(file) ? 'screenshot' : 'upload'
          });
      }

      return { success: true, bugId: bugReport.id };
    } catch (error) {
      console.error('Error submitting bug report:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  return {
    isEnabled,
    userRole,
    captureScreenshot,
    submitBugReport
  };
};