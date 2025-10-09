import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PersonChangeLogProps {
  personId: string;
  familyId: string;
}

interface ChangeLogEntry {
  id: string;
  created_at: string;
  action: string;
  actor_id: string;
  details: any;
  before_values: any;
  after_values: any;
  actor_profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const actionLabels: Record<string, string> = {
  PERSON_CREATED: 'Created',
  PERSON_UPDATED: 'Updated',
  PERSON_MERGED: 'Merged',
  PERSON_DELETED: 'Deleted',
};

const actionColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PERSON_CREATED: 'default',
  PERSON_UPDATED: 'secondary',
  PERSON_MERGED: 'secondary',
  PERSON_DELETED: 'destructive',
};

export function PersonChangeLog({ personId, familyId }: PersonChangeLogProps) {
  const { data: changes, isLoading } = useQuery({
    queryKey: ['person-changelog', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          id,
          created_at,
          action,
          actor_id,
          details,
          before_values,
          after_values
        `)
        .eq('entity_type', 'person')
        .eq('entity_id', personId)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch actor profiles
      const actorIds = [...new Set(data.map((d) => d.actor_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', actorIds);

      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((entry) => ({
        ...entry,
        actor_profile: entry.actor_id ? profilesMap.get(entry.actor_id) : null,
      })) as ChangeLogEntry[];
    },
  });

  const renderFieldChanges = (before: any, after: any) => {
    if (!before || !after) return null;

    const changedFields = Object.keys(after).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
    );

    if (changedFields.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 text-sm">
        {changedFields.map((field) => (
          <div key={field} className="flex items-start gap-2">
            <span className="font-medium text-muted-foreground min-w-[100px]">
              {field.replace(/_/g, ' ')}:
            </span>
            <div className="flex-1">
              <span className="line-through text-muted-foreground">
                {JSON.stringify(before[field])}
              </span>
              <span className="mx-2">→</span>
              <span className="text-foreground">{JSON.stringify(after[field])}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Change Log</CardTitle>
              <CardDescription>Recent edits and modifications</CardDescription>
            </div>
          </div>
          {changes && changes.length > 0 && (
            <Badge variant="secondary">{changes.length} entries</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : !changes || changes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No changes recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="border-l-2 border-muted pl-4 pb-4 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionColors[change.action] || 'default'}>
                        {actionLabels[change.action] || change.action}
                      </Badge>
                      {change.actor_profile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{change.actor_profile.full_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(change.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Show merge details */}
                  {change.action === 'PERSON_MERGED' && change.details?.merged_from && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Merged from person ID: {change.details.merged_from}
                    </div>
                  )}

                  {/* Show field changes */}
                  {change.before_values &&
                    change.after_values &&
                    renderFieldChanges(change.before_values, change.after_values)}

                  {/* Show creation details */}
                  {change.action === 'PERSON_CREATED' && change.after_values && (
                    <div className="mt-2 text-sm">
                      <div className="text-muted-foreground">Initial values:</div>
                      <div className="mt-1 space-y-1">
                        {Object.entries(change.after_values).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium min-w-[100px]">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span>{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
