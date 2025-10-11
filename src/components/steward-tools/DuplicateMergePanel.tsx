import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitMerge, Users, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DuplicateMergePanelProps {
  personId: string;
  familyId: string;
}

export function DuplicateMergePanel({ personId, familyId }: DuplicateMergePanelProps) {
  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['duplicate-candidates', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('duplicate_candidates')
        .select(`
          *,
          person_a:person_a_id(id, given_name, surname, birth_date),
          person_b:person_b_id(id, given_name, surname, birth_date)
        `)
        .eq('family_id', familyId)
        .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!duplicates || duplicates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Detection</CardTitle>
          <CardDescription>
            Merge duplicate person records to keep your tree clean
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No duplicate candidates found. Your tree looks great!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Duplicate Detection
          <Badge variant="secondary">{duplicates.length} potential</Badge>
        </CardTitle>
        <CardDescription>
          Review and merge duplicate person records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicates.map((dup: any) => (
          <div key={dup.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitMerge className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {dup.person_a?.given_name} {dup.person_a?.surname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dup.person_a?.birth_date || 'Unknown birth date'}
                  </p>
                </div>
              </div>
              
              <Badge variant="outline">
                {Math.round(parseFloat(dup.confidence_score) * 100)}% match
              </Badge>
            </div>

            <div className="flex items-center gap-3 pl-8">
              <AlertCircle className="h-4 w-4 text-warning" />
              <div className="text-sm text-muted-foreground">
                Possibly same as: {dup.person_b?.given_name} {dup.person_b?.surname}
              </div>
            </div>

            {dup.match_reasons && dup.match_reasons.length > 0 && (
              <div className="pl-8 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Matched on:</p>
                <ul className="list-disc list-inside">
                  {dup.match_reasons.map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="default">
                Merge Records
              </Button>
              <Button size="sm" variant="outline">
                Not a Duplicate
              </Button>
              <Button size="sm" variant="ghost">
                Review Later
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
