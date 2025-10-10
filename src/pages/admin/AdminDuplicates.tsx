import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, GitMerge } from "lucide-react";
import { MergeReviewModal } from "@/components/admin/MergeReviewModal";
import { MergeHistory } from "@/components/admin/MergeHistory";

interface DuplicateCandidate {
  id: string;
  confidence_score: number;
  match_reasons: string[];
  heuristic_details: any;
  person_a: any;
  person_b: any;
}

export default function AdminDuplicates() {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidate | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserFamily();
  }, []);

  const loadUserFamily = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .eq('role', 'admin')
        .single();

      if (membership) {
        setFamilyId(membership.family_id);
        loadCandidates(membership.family_id);
      }
    } catch (error) {
      console.error('Error loading family:', error);
    }
  };

  const loadCandidates = async (fId: string, forceRefresh = false) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-duplicates', {
        body: { familyId: fId, forceRefresh },
      });

      if (error) throw error;
      setCandidates(data.candidates || []);
    } catch (error: any) {
      console.error('Error loading candidates:', error);
      toast({
        title: "Failed to load duplicates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectDuplicates = async () => {
    if (!familyId) return;
    
    setIsDetecting(true);
    try {
      await loadCandidates(familyId, true);
      toast({
        title: "Detection complete",
        description: `Found ${candidates.length} potential duplicates`,
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleMergeComplete = () => {
    setSelectedCandidate(null);
    if (familyId) {
      loadCandidates(familyId);
    }
  };

  const handleDismiss = async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from('duplicate_candidates')
        .update({ status: 'dismissed' })
        .eq('id', candidateId);

      if (error) throw error;

      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast({
        title: "Candidate dismissed",
        description: "This pair won't be shown again",
      });
    } catch (error: any) {
      toast({
        title: "Failed to dismiss",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-red-500">High ({Math.round(score * 100)}%)</Badge>;
    if (score >= 0.6) return <Badge className="bg-orange-500">Medium ({Math.round(score * 100)}%)</Badge>;
    return <Badge className="bg-yellow-500">Low ({Math.round(score * 100)}%)</Badge>;
  };

  if (isLoading && candidates.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-test="admin-duplicates">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Duplicate People</h2>
          <p className="text-muted-foreground">
            Review and merge potential duplicate records
          </p>
        </div>
        <Button
          onClick={handleDetectDuplicates}
          disabled={isDetecting || !familyId}
          data-test="detect-duplicates-button"
        >
          {isDetecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Detect Duplicates
            </>
          )}
        </Button>
      </div>

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitMerge className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No duplicates found</h3>
            <p className="text-muted-foreground mb-4">
              {isDetecting ? 'Scanning for duplicates...' : 'Click "Detect Duplicates" to scan your family tree'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <Card key={candidate.id} data-test={`duplicate-candidate-${candidate.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        Potential Match: {getScoreBadge(candidate.confidence_score)}
                      </CardTitle>
                      <CardDescription>
                        {candidate.match_reasons.join(' • ')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismiss(candidate.id)}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedCandidate(candidate)}
                        data-test="review-merge-button"
                      >
                        Review & Merge
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Person A</h4>
                      <div className="text-sm">
                        <p className="font-semibold">
                          {candidate.person_a.given_name} {candidate.person_a.surname}
                        </p>
                        {candidate.person_a.birth_date && (
                          <p className="text-muted-foreground">
                            Born: {new Date(candidate.person_a.birth_date).getFullYear()}
                          </p>
                        )}
                        {candidate.person_a.birth_place && (
                          <p className="text-muted-foreground">
                            {candidate.person_a.birth_place}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Person B</h4>
                      <div className="text-sm">
                        <p className="font-semibold">
                          {candidate.person_b.given_name} {candidate.person_b.surname}
                        </p>
                        {candidate.person_b.birth_date && (
                          <p className="text-muted-foreground">
                            Born: {new Date(candidate.person_b.birth_date).getFullYear()}
                          </p>
                        )}
                        {candidate.person_b.birth_place && (
                          <p className="text-muted-foreground">
                            {candidate.person_b.birth_place}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {familyId && <MergeHistory familyId={familyId} />}
        </>
      )}

      {selectedCandidate && familyId && (
        <MergeReviewModal
          candidate={selectedCandidate}
          familyId={familyId}
          onClose={() => setSelectedCandidate(null)}
          onMergeComplete={handleMergeComplete}
        />
      )}
    </div>
  );
}