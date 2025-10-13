import { Eye, Edit, Trash2, Unlock, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface VaultAccessLogProps {
  familyId: string;
}

export default function VaultAccessLog({ familyId }: VaultAccessLogProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['vault-access-log', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_access_log')
        .select('*, profiles:accessed_by(full_name, avatar_url), vault_sections(title)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const accessIcons = {
    view: Eye,
    edit: Edit,
    delete: Trash2,
    unlock: Unlock,
    delegate: UserPlus,
  };

  const accessColors = {
    view: 'bg-blue-500/10 text-blue-700',
    edit: 'bg-amber-500/10 text-amber-700',
    delete: 'bg-red-500/10 text-red-700',
    unlock: 'bg-green-500/10 text-green-700',
    delegate: 'bg-purple-500/10 text-purple-700',
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No access logs yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log: any) => {
        const Icon = accessIcons[log.access_type as keyof typeof accessIcons];
        return (
          <Card key={log.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {log.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.vault_sections?.title || 'Unknown Section'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.created_at), 'PPp')}
                    </div>
                    {log.ip_address && (
                      <div className="text-xs text-muted-foreground">
                        IP: {log.ip_address}
                      </div>
                    )}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={accessColors[log.access_type as keyof typeof accessColors]}
                >
                  {log.access_type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
