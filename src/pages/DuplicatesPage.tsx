import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DuplicateCompareDialog } from '@/components/merge/DuplicateCompareDialog';
import { previewPersonMerge } from '@/lib/merge/mergeOperations';
import { AlertTriangle, ArrowLeft, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function DuplicatesPage() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [mergePreview, setMergePreview] = useState<any>(null);

  const { data: userResult } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
  
  const { data: membership } = useQuery({
    queryKey: ['membership', userResult?.id],
    queryFn: async () => {
      if (!userResult) return null;
      const { data } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', userResult.id)
        .single();
      return data;
    },
    enabled: !!userResult,
  });

  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['duplicates', membership?.family_id],
    queryFn: async () => {
      if (!membership?.family_id) return [];
      
      const { data, error } = await supabase
        .from('duplicate_candidates')
        .select(`
          *,
          person_a:people!duplicate_candidates_person_a_id_fkey(id, given_name, surname, birth_date),
          person_b:people!duplicate_candidates_person_b_id_fkey(id, given_name, surname, birth_date)
        `)
        .eq('family_id', membership.family_id)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!membership?.family_id,
  });

  useEffect(() => {
    if (selectedCandidate) {
      loadPreview();
    }
  }, [selectedCandidate]);

  const loadPreview = async () => {
    if (!selectedCandidate) return;
    
    const preview = await previewPersonMerge(
      selectedCandidate.person_a_id,
      selectedCandidate.person_b_id
    );
    setMergePreview(preview);
  };

  const handleClose = () => {
    setSelectedCandidate(null);
    setMergePreview(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Duplicate People ({duplicates?.length || 0})
            </CardTitle>
            <CardDescription>
              Review and merge potential duplicate entries
            </CardDescription>
          </CardHeader>
        </Card>

        {duplicates && duplicates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No duplicates found!</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {duplicates?.map((duplicate) => (
            <Card key={duplicate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex-1">
                      <div className="font-medium">
                        {duplicate.person_a.given_name} {duplicate.person_a.surname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {duplicate.person_a.birth_date && (
                          <span>Born: {new Date(duplicate.person_a.birth_date).getFullYear()}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-muted-foreground">↔</div>

                    <div className="flex-1">
                      <div className="font-medium">
                        {duplicate.person_b.given_name} {duplicate.person_b.surname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {duplicate.person_b.birth_date && (
                          <span>Born: {new Date(duplicate.person_b.birth_date).getFullYear()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {Math.round((duplicate.confidence_score || 0) * 100)}% match
                    </Badge>
                    <Button
                      onClick={() => setSelectedCandidate(duplicate)}
                      size="sm"
                    >
                      Review
                    </Button>
                  </div>
                </div>

                {duplicate.match_reasons && duplicate.match_reasons.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex flex-wrap gap-2">
                      {duplicate.match_reasons.map((reason: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCandidate && mergePreview && (
          <DuplicateCompareDialog
            open={!!selectedCandidate}
            onClose={handleClose}
            candidate={selectedCandidate}
            preview={mergePreview}
            entityType="person"
            onMergeComplete={() => {
              handleClose();
              // Refresh duplicates list
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
