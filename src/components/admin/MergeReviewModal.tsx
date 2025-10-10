import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface MergeReviewModalProps {
  candidate: any;
  familyId: string;
  onClose: () => void;
  onMergeComplete: () => void;
}

export function MergeReviewModal({
  candidate,
  familyId,
  onClose,
  onMergeComplete,
}: MergeReviewModalProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeChoices, setMergeChoices] = useState({
    given_name: 'a',
    surname: 'a',
    birth_date: 'a',
    birth_place: 'a',
    death_date: 'a',
    death_place: 'a',
    gender: 'a',
    notes: 'a',
  });
  const { toast } = useToast();
  const { track } = useAnalytics();

  const { person_a, person_b } = candidate;

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      // Build merged data based on selections
      const mergedData = {
        given_name: mergeChoices.given_name === 'a' ? person_a.given_name : person_b.given_name,
        surname: mergeChoices.surname === 'a' ? person_a.surname : person_b.surname,
        birth_date: mergeChoices.birth_date === 'a' ? person_a.birth_date : person_b.birth_date,
        birth_place: mergeChoices.birth_place === 'a' ? person_a.birth_place : person_b.birth_place,
        death_date: mergeChoices.death_date === 'a' ? person_a.death_date : person_b.death_date,
        death_place: mergeChoices.death_place === 'a' ? person_a.death_place : person_b.death_place,
        gender: mergeChoices.gender === 'a' ? person_a.gender : person_b.gender,
        notes: mergeChoices.notes === 'a' ? person_a.notes : person_b.notes,
      };

      const { data, error } = await supabase.functions.invoke('merge-people', {
        body: {
          sourcePersonId: person_b.id,
          targetPersonId: person_a.id,
          familyId,
          mergeData: {
            targetData: mergedData,
          },
          candidateId: candidate.id,
          confidenceScore: candidate.confidence_score,
          matchReasons: candidate.match_reasons,
        },
      });

      if (error) throw error;

      // Analytics tracked via audit log

      toast({
        title: "Merge successful",
        description: "The records have been merged. You can undo this within 7 days.",
      });

      onMergeComplete();
    } catch (error: any) {
      console.error('Error merging:', error);
      toast({
        title: "Merge failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const renderFieldPicker = (field: keyof typeof mergeChoices, label: string) => {
    const valueA = person_a[field];
    const valueB = person_b[field];

    // Skip if both values are null/empty
    if (!valueA && !valueB) return null;

    return (
      <div className="space-y-2">
        <Label className="font-semibold">{label}</Label>
        <RadioGroup
          value={mergeChoices[field]}
          onValueChange={(value) =>
            setMergeChoices((prev) => ({ ...prev, [field]: value }))
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="a" id={`${field}-a`} />
            <Label htmlFor={`${field}-a`} className="font-normal cursor-pointer">
              {valueA || <span className="text-muted-foreground italic">Empty</span>}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="b" id={`${field}-b`} />
            <Label htmlFor={`${field}-b`} className="font-normal cursor-pointer">
              {valueB || <span className="text-muted-foreground italic">Empty</span>}
            </Label>
          </div>
        </RadioGroup>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-test="merge-review-modal">
        <DialogHeader>
          <DialogTitle>Review & Merge People</DialogTitle>
          <DialogDescription>
            Select which values to keep for each field. Person B will be merged into Person A.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              This action will merge the records permanently
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You can undo this merge within 7 days. After that, the merge becomes permanent.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 text-lg">Person A (Target)</h3>
              <div className="text-sm text-muted-foreground">
                Will become the primary record
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Person B (Source)</h3>
              <div className="text-sm text-muted-foreground">
                Will be merged into Person A
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {renderFieldPicker('given_name', 'Given Name')}
            {renderFieldPicker('surname', 'Surname')}
            {renderFieldPicker('birth_date', 'Birth Date')}
            {renderFieldPicker('birth_place', 'Birth Place')}
            {renderFieldPicker('death_date', 'Death Date')}
            {renderFieldPicker('death_place', 'Death Place')}
            {renderFieldPicker('gender', 'Gender')}
            {renderFieldPicker('notes', 'Notes')}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isMerging}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={isMerging} data-test="confirm-merge-button">
            {isMerging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Merging...
              </>
            ) : (
              'Merge People'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}