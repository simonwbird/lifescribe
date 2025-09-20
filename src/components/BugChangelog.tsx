import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { History, ExternalLink, User, CheckCircle } from 'lucide-react';

interface ChangelogEntry {
  id: string;
  bug_report_id: string;
  change_type: string;
  old_value?: any;
  new_value?: any;
  notes?: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  bug_reports?: {
    title: string;
    severity: string;
  };
}

interface BugChangelogProps {
  bugId?: string; // If provided, show changelog for specific bug
  limit?: number;
}

export function BugChangelog({ bugId, limit = 20 }: BugChangelogProps) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchChangelog();
  }, [bugId, limit]);

  const fetchChangelog = async () => {
    try {
      let query = supabase
        .from('bug_changelog')
        .select(`
          *,
          bug_reports!inner(title, severity)
        `)
        .order('created_at', { ascending: false });

      if (bugId) {
        query = query.eq('bug_report_id', bugId);
      } else {
        // For general changelog, only show resolution-related changes
        query = query.in('change_type', ['status_change', 'verified', 'wont_fix', 'merged']);
      }

      query = query.limit(showAll ? 100 : limit);

      const { data, error } = await query;
      if (error) throw error;

      // Get profile information for each entry
      const entriesWithProfiles = await Promise.all(
        (data || []).map(async (entry) => {
          if (entry.changed_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', entry.changed_by)
              .single();
            
            return {
              ...entry,
              profiles: profile || { full_name: 'Unknown User' }
            };
          }
          return {
            ...entry,
            profiles: { full_name: 'System' }
          };
        })
      );

      setChangelog(entriesWithProfiles as ChangelogEntry[]);
    } catch (error) {
      console.error('Error fetching changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'status_change':
        return <History className="w-4 h-4 text-blue-600" />;
      case 'wont_fix':
        return <History className="w-4 h-4 text-red-600" />;
      case 'merged':
        return <History className="w-4 h-4 text-purple-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeDescription = (entry: ChangelogEntry) => {
    switch (entry.change_type) {
      case 'verified':
        return 'Bug verified and closed';
      case 'status_change':
        const oldStatus = entry.old_value?.status;
        const newStatus = entry.new_value?.status;
        if (newStatus === 'Fixed' || newStatus === 'Closed') {
          return `Bug resolved: ${oldStatus} → ${newStatus}`;
        }
        return `Status changed: ${oldStatus} → ${newStatus}`;
      case 'wont_fix':
        return 'Bug marked as won\'t fix';
      case 'merged':
        return 'Bug merged with another report';
      default:
        return entry.notes || 'Change recorded';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {bugId ? 'Bug History' : 'Recent Resolutions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          {bugId ? 'Bug History' : 'Recent Resolutions'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {changelog.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No changelog entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {changelog.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getChangeIcon(entry.change_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!bugId && entry.bug_reports && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {entry.bug_reports.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          #{entry.bug_report_id.slice(0, 8)}
                        </Badge>
                        <Badge variant={
                          entry.bug_reports.severity === 'High' ? 'destructive' :
                          entry.bug_reports.severity === 'Medium' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {entry.bug_reports.severity}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {getChangeDescription(entry)}
                  </div>
                  
                  {entry.notes && entry.notes !== getChangeDescription(entry) && (
                    <div className="text-sm bg-muted p-2 rounded text-muted-foreground">
                      {entry.notes}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.profiles?.full_name || 'System'}
                    </div>
                    <span>{format(new Date(entry.created_at), "MMM dd, yyyy 'at' h:mm a")}</span>
                    {!bugId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/admin/bugs/${entry.bug_report_id}`, '_blank')}
                        className="h-auto p-0 text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Bug
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {!bugId && changelog.length >= limit && !showAll && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => {
                  setShowAll(true);
                  fetchChangelog();
                }}>
                  Show More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}