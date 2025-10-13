import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useStorySources } from '@/hooks/useStorySources';
import { AddSourceDialog } from './AddSourceDialog';
import { CitationChip } from './CitationChip';
import { Badge } from '@/components/ui/badge';

interface StorySourcesSectionProps {
  storyId: string;
  familyId: string;
  showInline?: boolean;
}

export function StorySourcesSection({ 
  storyId, 
  familyId,
  showInline = false 
}: StorySourcesSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { sources, isCited, addSource, deleteSource } = useStorySources(storyId);

  return (
    <div className={showInline ? "inline-flex items-center gap-2" : "space-y-3"}>
      <div className="flex items-center gap-2 flex-wrap">
        {isCited && (
          <Badge variant="outline" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Cited
          </Badge>
        )}
        
        {sources.map((source) => (
          <CitationChip
            key={source.id}
            source={source}
            onRemove={deleteSource}
            showRemove
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Source
        </Button>
      </div>

      <AddSourceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={addSource}
        storyId={storyId}
        familyId={familyId}
      />
    </div>
  );
}
