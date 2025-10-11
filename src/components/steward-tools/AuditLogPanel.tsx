import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, FileEdit, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogPanelProps {
  personId: string;
  familyId: string;
}

export function AuditLogPanel({ personId, familyId }: AuditLogPanelProps) {
  const { data: auditLog, isLoading } = useQuery({
    queryKey: ['audit-log', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_audit_log')
        .select(`
          *,
          editor:editor_id(id, full_name, avatar_url)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!auditLog || auditLog.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit History</CardTitle>
          <CardDescription>
            Track all changes made to this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No edit history yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit History</CardTitle>
        <CardDescription>
          Track all changes made to this page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {auditLog.map((entry: any) => (
          <div key={entry.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <Avatar className="h-10 w-10 shrink-0">
              {entry.editor?.avatar_url && (
                <AvatarImage src={entry.editor.avatar_url} />
              )}
              <AvatarFallback>
                {entry.editor?.full_name
                  ? entry.editor.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                  : <User className="h-5 w-5" />
                }
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-medium text-sm">
                  {entry.editor?.full_name || 'Unknown User'}
                </p>
                <Badge variant="outline" className="text-xs">
                  {getActionLabel(entry.action_type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </span>
              </div>

              {entry.change_reason && (
                <p className="text-sm text-muted-foreground mb-2">
                  {entry.change_reason}
                </p>
              )}

              {entry.ai_suggested && (
                <Badge variant="secondary" className="text-xs">
                  <FileEdit className="h-3 w-3 mr-1" />
                  AI Suggested
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
