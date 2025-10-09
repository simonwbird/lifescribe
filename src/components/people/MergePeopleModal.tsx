import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MergePeopleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId1: string;
  personId2: string;
  onMergeComplete?: () => void;
}

interface PersonData {
  id: string;
  given_name: string | null;
  surname: string | null;
  full_name: string;
  birth_date: string | null;
  death_date: string | null;
  birth_year: number | null;
  death_year: number | null;
  gender: string | null;
  bio: string | null;
  relationships_from: Array<{
    id: string;
    relationship_type: string;
    to_person_id: string;
    to_person: { full_name: string };
  }>;
  relationships_to: Array<{
    id: string;
    relationship_type: string;
    from_person_id: string;
    from_person: { full_name: string };
  }>;
  stories_count: number;
  media_count: number;
}

interface MergeSelection {
  given_name: '1' | '2';
  surname: '1' | '2';
  birth_date: '1' | '2';
  death_date: '1' | '2';
  gender: '1' | '2';
  bio: '1' | '2';
  keepPerson: '1' | '2';
}

export function MergePeopleModal({
  open,
  onOpenChange,
  personId1,
  personId2,
  onMergeComplete,
}: MergePeopleModalProps) {
  const { track } = useAnalytics();
  const queryClient = useQueryClient();

  const [selection, setSelection] = useState<MergeSelection>({
    given_name: '1',
    surname: '1',
    birth_date: '1',
    death_date: '1',
    gender: '1',
    bio: '1',
    keepPerson: '1',
  });

  const { data: person1, isLoading: loading1 } = useQuery({
    queryKey: ['person-merge', personId1],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          relationships_from:relationships!from_person_id(
            id,
            relationship_type,
            to_person_id,
            to_person:people!to_person_id(full_name)
          ),
          relationships_to:relationships!to_person_id(
            id,
            relationship_type,
            from_person_id,
            from_person:people!from_person_id(full_name)
          )
        `)
        .eq('id', personId1)
        .single();

      if (error) throw error;

      // Count stories and media linked via entity_links
      const { count: storiesCount } = await supabase
        .from('entity_links')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'person')
        .eq('entity_id', personId1)
        .eq('source_type', 'story');

      const { count: mediaCount } = await supabase
        .from('entity_links')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'person')
        .eq('entity_id', personId1)
        .eq('source_type', 'media');

      return {
        ...data,
        stories_count: storiesCount || 0,
        media_count: mediaCount || 0,
      } as PersonData;
    },
    enabled: open && !!personId1,
  });

  const { data: person2, isLoading: loading2 } = useQuery({
    queryKey: ['person-merge', personId2],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          relationships_from:relationships!from_person_id(
            id,
            relationship_type,
            to_person_id,
            to_person:people!to_person_id(full_name)
          ),
          relationships_to:relationships!to_person_id(
            id,
            relationship_type,
            from_person_id,
            from_person:people!from_person_id(full_name)
          )
        `)
        .eq('id', personId2)
        .single();

      if (error) throw error;

      const { count: storiesCount } = await supabase
        .from('entity_links')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'person')
        .eq('entity_id', personId2)
        .eq('source_type', 'story');

      const { count: mediaCount } = await supabase
        .from('entity_links')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'person')
        .eq('entity_id', personId2)
        .eq('source_type', 'media');

      return {
        ...data,
        stories_count: storiesCount || 0,
        media_count: mediaCount || 0,
      } as PersonData;
    },
    enabled: open && !!personId2,
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!person1 || !person2) return;

      const keepId = selection.keepPerson === '1' ? personId1 : personId2;
      const mergeId = selection.keepPerson === '1' ? personId2 : personId1;
      const keepPerson = selection.keepPerson === '1' ? person1 : person2;
      const mergePerson = selection.keepPerson === '1' ? person2 : person1;

      // Build merged data
      const mergedData = {
        given_name: selection.given_name === '1' ? person1.given_name : person2.given_name,
        surname: selection.surname === '1' ? person1.surname : person2.surname,
        birth_date: selection.birth_date === '1' ? person1.birth_date : person2.birth_date,
        death_date: selection.death_date === '1' ? person1.death_date : person2.death_date,
        gender: selection.gender === '1' ? person1.gender : person2.gender,
        bio: selection.bio === '1' ? person1.bio : person2.bio,
        full_name: `${
          selection.given_name === '1' ? person1.given_name : person2.given_name
        } ${selection.surname === '1' ? person1.surname : person2.surname}`.trim(),
      };

      // Update the kept person
      const { error: updateError } = await supabase
        .from('people')
        .update(mergedData)
        .eq('id', keepId);

      if (updateError) throw updateError;

      // Update all entity_links references to point to kept person
      await supabase
        .from('entity_links')
        .update({ entity_id: keepId })
        .eq('entity_type', 'person')
        .eq('entity_id', mergeId);

      // Remove duplicate links that may have been created
      const { data: duplicateLinks } = await supabase
        .from('entity_links')
        .select('id, source_id, source_type')
        .eq('entity_type', 'person')
        .eq('entity_id', keepId);

      if (duplicateLinks) {
        const seen = new Set<string>();
        const duplicateIds: string[] = [];

        for (const link of duplicateLinks) {
          const key = `${link.source_type}-${link.source_id}`;
          if (seen.has(key)) {
            duplicateIds.push(link.id);
          } else {
            seen.add(key);
          }
        }

        if (duplicateIds.length > 0) {
          await supabase
            .from('entity_links')
            .delete()
            .in('id', duplicateIds);
        }
      }

      // Relationships - update both from and to
      await supabase
        .from('relationships')
        .update({ from_person_id: keepId })
        .eq('from_person_id', mergeId);

      await supabase
        .from('relationships')
        .update({ to_person_id: keepId })
        .eq('to_person_id', mergeId);

      // Delete the merged person
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .eq('id', mergeId);

      if (deleteError) throw deleteError;

      return { keepId, mergeId };
    },
    onSuccess: () => {
      toast.success('People merged successfully');
      track('people_merged', {
        person1_id: personId1,
        person2_id: personId2,
        kept_person: selection.keepPerson,
      });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['person'] });
      onMergeComplete?.();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error merging people:', error);
      toast.error('Failed to merge people');
    },
  });

  const handleMerge = () => {
    mergeMutation.mutate();
  };

  const renderComparison = (
    field: keyof MergeSelection,
    label: string,
    value1: any,
    value2: any
  ) => {
    const isDifferent = value1 !== value2;

    return (
      <div className="space-y-2">
        <Label className="font-semibold">{label}</Label>
        <RadioGroup
          value={selection[field]}
          onValueChange={(value) =>
            setSelection({ ...selection, [field]: value as '1' | '2' })
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                selection[field] === '1'
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <RadioGroupItem value="1" id={`${field}-1`} />
              <Label
                htmlFor={`${field}-1`}
                className={`flex-1 cursor-pointer ${!value1 && 'text-muted-foreground'}`}
              >
                {value1 || '(empty)'}
                {isDifferent && selection[field] === '1' && (
                  <Check className="inline-block ml-2 h-4 w-4 text-primary" />
                )}
              </Label>
            </div>

            <div
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                selection[field] === '2'
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <RadioGroupItem value="2" id={`${field}-2`} />
              <Label
                htmlFor={`${field}-2`}
                className={`flex-1 cursor-pointer ${!value2 && 'text-muted-foreground'}`}
              >
                {value2 || '(empty)'}
                {isDifferent && selection[field] === '2' && (
                  <Check className="inline-block ml-2 h-4 w-4 text-primary" />
                )}
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>
    );
  };

  const isLoading = loading1 || loading2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge People Records</DialogTitle>
          <DialogDescription>
            Compare and select which information to keep when merging these two records.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : person1 && person2 ? (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The merged person will be deleted and all
                references will be updated to point to the kept person.
              </AlertDescription>
            </Alert>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <h3 className="font-semibold mb-2">{person1.full_name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{person1.stories_count} stories</p>
                  <p>{person1.media_count} media items</p>
                  <p>{person1.relationships_from.length + person1.relationships_to.length} relationships</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{person2.full_name}</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{person2.stories_count} stories</p>
                  <p>{person2.media_count} media items</p>
                  <p>{person2.relationships_from.length + person2.relationships_to.length} relationships</p>
                </div>
              </div>
            </div>

            {/* Which person to keep */}
            <div className="space-y-2">
              <Label className="font-semibold">Primary Record (ID to keep)</Label>
              <RadioGroup
                value={selection.keepPerson}
                onValueChange={(value) =>
                  setSelection({ ...selection, keepPerson: value as '1' | '2' })
                }
              >
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                      selection.keepPerson === '1'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value="1" id="keep-1" />
                    <Label htmlFor="keep-1" className="flex-1 cursor-pointer">
                      Keep {person1.full_name}
                      <Badge variant="secondary" className="ml-2">Primary</Badge>
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 ${
                      selection.keepPerson === '2'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value="2" id="keep-2" />
                    <Label htmlFor="keep-2" className="flex-1 cursor-pointer">
                      Keep {person2.full_name}
                      <Badge variant="secondary" className="ml-2">Primary</Badge>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Field comparisons */}
            {renderComparison('given_name', 'Given Name', person1.given_name, person2.given_name)}
            {renderComparison('surname', 'Surname', person1.surname, person2.surname)}
            {renderComparison('birth_date', 'Birth Date', person1.birth_date, person2.birth_date)}
            {renderComparison('death_date', 'Death Date', person1.death_date, person2.death_date)}
            {renderComparison('gender', 'Gender', person1.gender, person2.gender)}
            {renderComparison('bio', 'Biography', person1.bio, person2.bio)}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isLoading || mergeMutation.isPending}
          >
            {mergeMutation.isPending ? (
              'Merging...'
            ) : (
              <>
                Merge Records
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
