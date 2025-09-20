import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BugReportData {
  title: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  notes?: string;
  severity: 'Low' | 'Medium' | 'High';
  consentDeviceInfo: boolean;
  consentConsoleInfo: boolean;
}

export interface UIEvent {
  type: string;
  timestamp: number;
  element?: string;
  details?: any;
}

export interface ConsoleLog {
  level: 'error' | 'warn' | 'info' | 'log';
  message: string;
  timestamp: number;
  stack?: string;
}

export interface PossibleDuplicate {
  id: string;
  title: string;
  status: string;
  created_at: string;
  similarity_score: number;
}

export const useBugReporting = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [uiEvents, setUIEvents] = useState<UIEvent[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

  useEffect(() => {
    checkBugReportingEnabled();
    setupEventTracking();
    setupConsoleCapture();
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

      // For super admins and bug testers, always enable bug reporting
      if (role === 'super_admin' || role === 'bug_tester') {
        setIsEnabled(true);
        return;
      }

      // For other users, check the feature flag
      try {
        const { data: flagResult } = await supabase.rpc('evaluate_feature_flag', {
          p_flag_key: 'bug_reporting_v1',
          p_user_id: user.id,
          p_user_role: role
        });
        setIsEnabled((flagResult as any)?.enabled || false);
      } catch (flagError) {
        console.error('Error evaluating feature flag, defaulting to enabled for testing:', flagError);
        // Default to enabled if there's an issue with the flag evaluation
        setIsEnabled(true);
      }
    } catch (error) {
      console.error('Error checking bug reporting feature flag:', error);
      setIsEnabled(false);
    }
  };

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Find and temporarily hide ALL modal/dialog elements more aggressively
      const modalsToHide = document.querySelectorAll([
        '[role="dialog"]',
        '[data-radix-dialog-content]', 
        '[data-radix-dialog-overlay]',
        '.fixed.inset-0',
        '.z-50',
        '.z-40',
        '[data-state="open"]',
        // Target the bug report modal specifically
        'div[class*="fixed"][class*="inset-0"]',
        'div[class*="bg-black"]'
      ].join(', '));
      
      const originalDisplays: string[] = [];
      const originalVisibility: string[] = [];
      const originalOpacity: string[] = [];
      
      // More aggressive hiding
      modalsToHide.forEach((modal, index) => {
        const element = modal as HTMLElement;
        originalDisplays[index] = element.style.display;
        originalVisibility[index] = element.style.visibility;
        originalOpacity[index] = element.style.opacity;
        
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
      });
      
      // Wait longer for DOM to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find the main content area - be more specific about content detection
      const contentSelectors = [
        'main:not([role="dialog"])', 
        '[role="main"]:not([role="dialog"])', 
        'body > div:not([role="dialog"]):not(.fixed)',
        '.container:not([role="dialog"])', 
        '.content:not([role="dialog"])', 
        '.page-content',
        '#content',
        '.main-content',
        'body > *:not([role="dialog"]):not(.fixed):first-child'
      ];
      
      let contentElement = document.body;
      for (const selector of contentSelectors) {
        try {
          const found = document.querySelector(selector);
          if (found && !found.closest('[role="dialog"]')) {
            contentElement = found as HTMLElement;
            console.log('Found content element:', selector);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Get content dimensions
      const contentWidth = Math.min(contentElement.scrollWidth, 1200);
      
      // Capture the content area at high quality
      const canvas = await html2canvas(contentElement, {
        height: contentElement.scrollHeight,
        width: contentWidth,
        useCORS: true,
        allowTaint: true,
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        imageTimeout: 20000,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          // More comprehensive modal detection
          if (
            element.hasAttribute('role') && element.getAttribute('role') === 'dialog' ||
            element.hasAttribute('data-radix-dialog-content') ||
            element.hasAttribute('data-radix-dialog-overlay') ||
            element.closest('[role="dialog"]') !== null ||
            element.closest('[data-radix-dialog-content]') !== null ||
            element.classList.contains('fixed') ||
            element.classList.contains('z-50') ||
            element.classList.contains('z-40') ||
            getComputedStyle(element).position === 'fixed'
          ) {
            return true;
          }
          return false;
        }
      });
      
      // Restore original styles
      modalsToHide.forEach((modal, index) => {
        const element = modal as HTMLElement;
        element.style.display = originalDisplays[index] || '';
        element.style.visibility = originalVisibility[index] || '';
        element.style.opacity = originalOpacity[index] || '';
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  };

  const setupEventTracking = () => {
    const trackEvent = (type: string, event: Event) => {
      const uiEvent: UIEvent = {
        type,
        timestamp: Date.now(),
        element: (event.target as HTMLElement)?.tagName || 'unknown',
        details: {
          id: (event.target as HTMLElement)?.id,
          className: (event.target as HTMLElement)?.className,
          textContent: (event.target as HTMLElement)?.textContent?.slice(0, 50)
        }
      };
      
      setUIEvents(prev => {
        const updated = [...prev, uiEvent];
        return updated.slice(-10); // Keep only last 10 events
      });
    };

    // Track clicks and key presses
    document.addEventListener('click', (e) => trackEvent('click', e));
    document.addEventListener('keydown', (e) => trackEvent('keydown', e));

    return () => {
      document.removeEventListener('click', (e) => trackEvent('click', e));
      document.removeEventListener('keydown', (e) => trackEvent('keydown', e));
    };
  };

  const setupConsoleCapture = () => {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
      info: console.info
    };

    const captureConsoleLog = (level: ConsoleLog['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      const logEntry: ConsoleLog = {
        level,
        message: message.slice(0, 500), // Limit message length
        timestamp: Date.now(),
        stack: level === 'error' && args[0] instanceof Error ? args[0].stack : undefined
      };

      setConsoleLogs(prev => {
        const updated = [...prev, logEntry];
        return updated.slice(-20); // Keep only last 20 logs
      });

      // Call original console method
      originalConsole[level](...args);
    };

    console.error = (...args) => captureConsoleLog('error', args);
    console.warn = (...args) => captureConsoleLog('warn', args);
    console.log = (...args) => captureConsoleLog('log', args);
    console.info = (...args) => captureConsoleLog('info', args);

    return () => {
      Object.assign(console, originalConsole);
    };
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

  const checkForDuplicates = async (title: string, route: string, familyId?: string): Promise<PossibleDuplicate[]> => {
    try {
      const { data: dedupeKey } = await supabase.rpc('compute_bug_dedupe_key', {
        p_route: route,
        p_title: title
      });

      if (!dedupeKey) return [];

      const { data, error } = await supabase.rpc('find_possible_duplicates', {
        p_dedupe_key: dedupeKey,
        p_family_id: familyId || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return [];
    }
  };

  const submitBugReport = async (
    data: BugReportData, 
    screenshots: File[], 
    uploads: File[]
  ): Promise<{ success: boolean; bugId?: string; error?: string; duplicates?: PossibleDuplicate[] }> => {
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
      const currentUIEvents = data.consentConsoleInfo ? uiEvents : [];
      const currentConsoleLogs = data.consentConsoleInfo ? consoleLogs.filter(log => log.level === 'error' || log.level === 'warn') : [];
      
      // Compute dedupe key
      const { data: dedupeKey } = await supabase.rpc('compute_bug_dedupe_key', {
        p_route: window.location.pathname,
        p_title: data.title
      });

      // Create bug report
      const bugReportData: any = {
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
        consent_device_info: data.consentDeviceInfo,
        ui_events: currentUIEvents,
        console_logs: currentConsoleLogs,
        consent_console_info: data.consentConsoleInfo,
        dedupe_key: dedupeKey
      };

      const { data: bugReport, error: bugError } = await supabase
        .from('bug_reports')
        .insert(bugReportData)
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
    submitBugReport,
    checkForDuplicates,
    uiEvents,
    consoleLogs
  };
};