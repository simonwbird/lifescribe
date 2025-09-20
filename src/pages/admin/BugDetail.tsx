import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, User, Globe, Monitor, Download, Save, Activity, Terminal, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { BugQAActions } from '@/components/BugQAActions';
import { BugChangelog } from '@/components/BugChangelog';

interface BugReport {
  id: string;
  title: string;
  expected_behavior?: string;
  actual_behavior?: string;
  notes?: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'New' | 'In Progress' | 'Fixed' | 'Closed' | 'Duplicate' | 'QA Ready';
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
  consent_device_info: boolean;
  ui_events?: any;
  console_logs?: any;
  consent_console_info: boolean;
  dedupe_key?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  families?: {
    name: string;
  };
}

interface Attachment {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  attachment_type: 'screenshot' | 'upload';
  created_at: string;
}

export default function BugDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bugReport, setBugReport] = useState<BugReport | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Editable fields
  const [status, setStatus] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (id) {
      checkUserRole();
      fetchBugReport();
      fetchAttachments();
    }
  }, [id]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();

      const role = (profile?.settings as any)?.role;
      setUserRole(role);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchBugReport = async () => {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select(`
          *,
          profiles(full_name, email),
          families(name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      setBugReport(data as any);
      setStatus(data.status);
      setSeverity(data.severity);
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error fetching bug report:', error);
      toast({
        title: "Error loading bug report",
        description: "Unable to load bug report details.",
        variant: "destructive"
      });
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('bug_report_attachments')
        .select('*')
        .eq('bug_report_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttachments((data || []) as Attachment[]);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bugReport) return;
    
    setSaving(true);
    try {
      const updates: any = {
        status,
        severity,
        notes,
        updated_at: new Date().toISOString()
      };

      // Set resolved_at when status changes to Fixed or Closed
      if ((status === 'Fixed' || status === 'Closed') && bugReport.status !== status) {
        updates.resolved_at = new Date().toISOString();
      } else if (status !== 'Fixed' && status !== 'Closed') {
        updates.resolved_at = null;
      }

      const { error } = await supabase
        .from('bug_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBugReport(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Bug report updated",
        description: "Changes have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating bug report:', error);
      toast({
        title: "Update failed",
        description: "Unable to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(attachment.file_path, 3600);

      if (error) throw error;

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Download failed",
        description: "Unable to download attachment.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!bugReport) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Bug report not found</h2>
          <Button onClick={() => navigate('/admin/bugs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bug Inbox
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/bugs')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 items-start">
          {userRole === 'super_admin' && (
            <>
               <BugQAActions 
                bugId={bugReport.id}
                currentStatus={bugReport.status}
                onStatusChange={(newStatus) => {
                  const statusValue = newStatus as BugReport['status'];
                  setStatus(statusValue);
                  setBugReport(prev => prev ? { ...prev, status: statusValue } : null);
                }}
              />
            </>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Bug Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bug Title/Description */}
              <div>
                <h2 className="text-base font-medium text-foreground leading-relaxed mb-2 p-3 bg-muted rounded-md">
                  {bugReport.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">Bug Report #{bugReport.id.slice(0, 8)}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="QA Ready">QA Ready</SelectItem>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Duplicate">Duplicate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Expected Behavior</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {bugReport.expected_behavior || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Actual Behavior</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {bugReport.actual_behavior || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add additional notes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bug Changelog */}
          <BugChangelog bugId={bugReport.id} />

          {/* Context Information */}
          {(bugReport.consent_console_info && (bugReport.ui_events?.length > 0 || bugReport.console_logs?.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Context Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bugReport.ui_events?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      UI Events (Last {bugReport.ui_events.length})
                    </Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {bugReport.ui_events.map((event: any, index: number) => (
                        <div key={index} className="text-xs bg-muted p-2 rounded border-l-2 border-blue-500">
                          <div className="font-medium">{event.type} on {event.element}</div>
                          <div className="text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()} • 
                            {event.details?.textContent && ` "${event.details.textContent}"`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bugReport.console_logs?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Console Logs ({bugReport.console_logs.length})
                    </Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {bugReport.console_logs.map((log: any, index: number) => (
                        <div key={index} className={`text-xs p-2 rounded border-l-2 ${
                          log.level === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                          log.level === 'warn' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                          'bg-muted border-gray-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1 font-mono">{log.message}</div>
                          {log.stack && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-muted-foreground">Stack trace</summary>
                              <pre className="text-xs whitespace-pre-wrap mt-1 text-muted-foreground">{log.stack}</pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments ({attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-lg p-4">
                      {attachment.attachment_type === 'screenshot' ? (
                        <div className="space-y-2">
                          <img 
                            src={`https://imgtnixyralpdrmedwzi.supabase.co/storage/v1/object/public/media/${attachment.file_path}`}
                            alt={attachment.file_name}
                            className="w-full rounded-lg border"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {(attachment.file_size / 1024).toFixed(1)} KB • {format(new Date(attachment.created_at), "MMM dd, yyyy")}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              📎 {attachment.file_name}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(attachment.file_size / 1024).toFixed(1)} KB • {format(new Date(attachment.created_at), "MMM dd, yyyy")}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Reporter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">{bugReport.profiles?.full_name || 'Unknown User'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {bugReport.profiles?.email}
                </div>
                {bugReport.families?.name && (
                  <div className="text-sm">
                    Family: <span className="font-medium">{bugReport.families.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <div className="text-muted-foreground">
                    {format(new Date(bugReport.created_at), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <div className="text-muted-foreground">
                    {format(new Date(bugReport.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                  </div>
                </div>
                {bugReport.resolved_at && (
                  <div>
                    <span className="font-medium">Resolved:</span>
                    <div className="text-muted-foreground">
                      {format(new Date(bugReport.resolved_at), "MMM dd, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">URL:</span>
                  <div className="text-muted-foreground break-all">
                    {bugReport.url}
                  </div>
                </div>
                {bugReport.route && (
                  <div>
                    <span className="font-medium">Route:</span>
                    <div className="text-muted-foreground">
                      <code>{bugReport.route}</code>
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-medium">App Version:</span>
                  <div className="text-muted-foreground">
                    {bugReport.app_version || '1.0.0'}
                  </div>
                </div>
                {bugReport.viewport_width && bugReport.viewport_height && (
                  <div>
                    <span className="font-medium">Viewport:</span>
                    <div className="text-muted-foreground">
                      {bugReport.viewport_width} × {bugReport.viewport_height}
                    </div>
                  </div>
                )}
                {bugReport.timezone && (
                  <div>
                    <span className="font-medium">Timezone:</span>
                    <div className="text-muted-foreground">
                      {bugReport.timezone}
                    </div>
                  </div>
                )}
                {bugReport.locale && (
                  <div>
                    <span className="font-medium">Locale:</span>
                    <div className="text-muted-foreground">
                      {bugReport.locale}
                    </div>
                  </div>
                )}
                {bugReport.consent_device_info && bugReport.device_info && Object.keys(bugReport.device_info).length > 0 && (
                  <div>
                    <span className="font-medium">Device Info:</span>
                    <div className="mt-1 p-2 bg-muted rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(bugReport.device_info, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {bugReport.dedupe_key && (
                  <div>
                    <span className="font-medium">Dedupe Key:</span>
                    <div className="text-muted-foreground font-mono text-xs">
                      {bugReport.dedupe_key}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
         </div>
      </div>
    </div>
  );
}