import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileCode, TestTube, GitPullRequest } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BugReport {
  id: string;
  title: string;
  expected_behavior?: string;
  actual_behavior?: string;
  notes?: string;
  severity: 'Low' | 'Medium' | 'High';
  status: string;
  url: string;
  route?: string;
  user_id: string;
  family_id?: string;
  app_version?: string;
  timezone?: string;
  locale?: string;
  viewport_width?: number;
  viewport_height?: number;
  user_agent?: string;
  device_info?: any;
  ui_events?: any;
  console_logs?: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface FixWithLoveableModalProps {
  isOpen: boolean;
  onClose: () => void;
  bugReport: BugReport;
}

export const FixWithLoveableModal = ({ isOpen, onClose, bugReport }: FixWithLoveableModalProps) => {
  const [taskBrief, setTaskBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customBrief, setCustomBrief] = useState('');

  useEffect(() => {
    if (isOpen && bugReport) {
      generateTaskBrief();
    }
  }, [isOpen, bugReport]);

  const generateTaskBrief = () => {
    setIsGenerating(true);
    
    // Extract element info from notes if available
    const elementInfo = extractElementInfo(bugReport.notes);
    
    // Generate file hints based on route and element
    const fileHints = generateFileHints(bugReport.route, elementInfo);
    
    // Extract console errors
    const consoleErrors = extractConsoleErrors(bugReport.console_logs);
    
    const brief = `# Bug Fix Task Brief

## Summary
**Title:** ${bugReport.title}
**Severity:** ${bugReport.severity}
**Status:** ${bugReport.status}
**Reporter:** ${bugReport.profiles?.full_name || 'Unknown'} (${bugReport.profiles?.email || 'No email'})

## Steps to Reproduce
1. Navigate to: \`${bugReport.url}\`
2. Route: \`${bugReport.route || 'Unknown'}\`
${elementInfo ? `3. Target element: \`${elementInfo.selector}\` - "${elementInfo.text}"
4. Element position: (${elementInfo.position})` : ''}
${bugReport.notes ? `5. Additional context: ${bugReport.notes}` : ''}

## Expected vs Actual Behavior

**Expected Behavior:**
${bugReport.expected_behavior || 'Not specified'}

**Actual Behavior:**
${bugReport.actual_behavior || 'Not specified'}

## Environment Details
- **Browser:** ${extractBrowser(bugReport.user_agent)}
- **OS:** ${extractOS(bugReport.user_agent)}
- **Locale:** ${bugReport.locale || 'Unknown'}
- **Timezone:** ${bugReport.timezone || 'Unknown'}
- **App Version:** ${bugReport.app_version || '1.0.0'}
- **Viewport:** ${bugReport.viewport_width}x${bugReport.viewport_height}

## Evidence

### Console Errors
${consoleErrors.length > 0 ? consoleErrors.map(error => `- **${error.level.toUpperCase()}:** ${error.message}`).join('\n') : 'No console errors captured'}

### UI Events Context
${bugReport.ui_events?.length > 0 ? `Recent user interactions:\n${bugReport.ui_events.slice(-5).map((event: any) => `- ${event.type} on ${event.element} at ${new Date(event.timestamp).toLocaleTimeString()}`).join('\n')}` : 'No UI events captured'}

## File Hints
Likely files to investigate/modify:
${fileHints.map(file => `- \`${file.path}\` - ${file.reason}`).join('\n')}

## Acceptance Criteria
- [ ] The bug described in "Expected vs Actual Behavior" is resolved
- [ ] No regression in existing functionality
- [ ] Code follows project's existing patterns and conventions
- [ ] Changes are properly typed (if TypeScript project)
${elementInfo ? `- [ ] The issue with element \`${elementInfo.selector}\` is specifically addressed` : ''}
- [ ] Solution works across different screen sizes (responsive design)
- [ ] No new console errors or warnings introduced

## Suggested Unit Test Outline
\`\`\`typescript
describe('${bugReport.title}', () => {
  it('should ${bugReport.expected_behavior?.toLowerCase() || 'work as expected'}', () => {
    // Test setup
    // Simulate the conditions that led to the bug
    // Assert the expected behavior occurs
    // Verify no side effects
  });
  
  it('should handle edge cases', () => {
    // Test boundary conditions
    // Test error states
    // Verify graceful degradation
  });
});
\`\`\`

## Additional Context
- **Created:** ${new Date(bugReport.created_at).toLocaleString()}
- **User Agent:** ${bugReport.user_agent}
${bugReport.device_info && Object.keys(bugReport.device_info).length > 0 ? `- **Device Info:** ${JSON.stringify(bugReport.device_info, null, 2)}` : ''}`;

    setTaskBrief(brief);
    setCustomBrief(brief);
    setIsGenerating(false);
  };

  const extractElementInfo = (notes?: string) => {
    if (!notes) return null;
    
    const selectorMatch = notes.match(/Selector:\s*(.+)/);
    const textMatch = notes.match(/Text:\s*(.+)/);
    const positionMatch = notes.match(/Position:\s*(.+)/);
    
    if (selectorMatch) {
      return {
        selector: selectorMatch[1],
        text: textMatch?.[1] || '',
        position: positionMatch?.[1] || ''
      };
    }
    
    return null;
  };

  const extractConsoleErrors = (consoleLogs: any[]) => {
    if (!consoleLogs || !Array.isArray(consoleLogs)) return [];
    
    return consoleLogs
      .filter(log => log.level === 'error' || log.level === 'warn')
      .slice(-3); // Last 3 errors/warnings
  };

  const generateFileHints = (route?: string, elementInfo?: any) => {
    const hints = [];
    
    if (route) {
      // Suggest page component based on route
      const routeParts = route.split('/').filter(Boolean);
      if (routeParts.length > 0) {
        hints.push({
          path: `src/pages/${routeParts.join('/')}.tsx`,
          reason: 'Main page component for the reported route'
        });
        hints.push({
          path: `src/pages/${routeParts[0]}/index.tsx`,
          reason: 'Alternative page structure'
        });
      }
    }
    
    if (elementInfo?.selector) {
      // Suggest component files based on selector patterns
      const selector = elementInfo.selector;
      
      if (selector.includes('button') || selector.includes('btn')) {
        hints.push({
          path: 'src/components/ui/button.tsx',
          reason: 'Button component styling or behavior'
        });
      }
      
      if (selector.includes('form') || selector.includes('input')) {
        hints.push({
          path: 'src/components/ui/form.tsx',
          reason: 'Form-related components'
        });
      }
      
      if (selector.includes('modal') || selector.includes('dialog')) {
        hints.push({
          path: 'src/components/ui/dialog.tsx',
          reason: 'Modal/Dialog components'
        });
      }
    }
    
    // Always suggest common files
    hints.push(
      {
        path: 'src/App.tsx',
        reason: 'Main application component'
      },
      {
        path: 'src/index.css',
        reason: 'Global styles and design system'
      },
      {
        path: 'tailwind.config.ts',
        reason: 'Tailwind configuration'
      }
    );
    
    return hints.slice(0, 6); // Limit to 6 hints
  };

  const extractBrowser = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown';
  };

  const extractOS = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  };

  const handleSubmitToLoveable = async () => {
    setIsSubmitting(true);
    
    try {
      // Create AI task record
      const { data: aiTask, error: taskError } = await supabase
        .from('ai_tasks')
        .insert({
          bug_report_id: bugReport.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          task_brief: {
            content: customBrief,
            generated_at: new Date().toISOString(),
            bug_data: {
              title: bugReport.title,
              severity: bugReport.severity,
              route: bugReport.route,
              url: bugReport.url
            }
          },
          status: 'in_progress'
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Copy the task brief to clipboard so it can be pasted in chat
      await navigator.clipboard.writeText(`Here's the comprehensive bug fix task brief I've prepared:

${customBrief}

I'm ready to start working on this bug fix. Should I proceed with implementing the solution?`);

      toast({
        title: "Task brief copied to clipboard",
        description: "The task brief has been copied. You can now paste it in your chat to continue the conversation here.",
        duration: 8000
      });

      // Update bug status to indicate it's being worked on
      await supabase
        .from('bug_reports')
        .update({ status: 'In Progress' })
        .eq('id', bugReport.id);

      onClose();
    } catch (error) {
      console.error('Error processing task:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process the task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Fix with Loveable
          </DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">Generating comprehensive task brief...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Code Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Auto-generated file hints and code patterns
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Test Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Suggested test cases and acceptance criteria
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4" />
                    Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  GitHub PR or inline patch with solution
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-brief">Task Brief for Loveable</Label>
              <Textarea
                id="task-brief"
                value={customBrief}
                onChange={(e) => setCustomBrief(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Generated task brief will appear here..."
              />
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {customBrief.length} characters
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Markdown formatted
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={generateTaskBrief}
                  disabled={isSubmitting}
                >
                  Regenerate Brief
                </Button>
                <Button 
                  onClick={handleSubmitToLoveable}
                  disabled={isSubmitting || !customBrief.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting to Loveable...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Submit to Loveable
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};