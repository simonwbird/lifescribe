import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface LastUpdatedInfoProps {
  personId: string;
  familyId: string;
  className?: string;
}

export function LastUpdatedInfo({ personId, familyId, className }: LastUpdatedInfoProps) {
  const { data: lastUpdate, isLoading } = useQuery({
    queryKey: ['last-update', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_audit_log')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch editor profile separately
      const { data: editor } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', data.editor_id)
        .single();

      return { ...data, editor };
    },
  });

  if (isLoading) {
    return <Skeleton className={cn("h-6 w-48", className)} />;
  }

  if (!lastUpdate || !lastUpdate.editor) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Avatar className="h-5 w-5">
        {lastUpdate.editor.avatar_url && (
          <AvatarImage src={lastUpdate.editor.avatar_url} />
        )}
        <AvatarFallback className="text-xs">
          {lastUpdate.editor.full_name
            ? lastUpdate.editor.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
            : <User className="h-3 w-3" />
          }
        </AvatarFallback>
      </Avatar>
      
      <span>
        Last updated by <strong>{lastUpdate.editor.full_name || 'Unknown'}</strong>
      </span>
      
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(new Date(lastUpdate.created_at), { addSuffix: true })}
      </span>
    </div>
  );
}
