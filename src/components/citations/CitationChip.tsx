import { Badge } from '@/components/ui/badge';
import { StorySource } from '@/lib/citations/citationTypes';
import { FileText, Link2, StickyNote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CitationChipProps {
  source: StorySource;
  onRemove?: (sourceId: string) => void;
  showRemove?: boolean;
}

export function CitationChip({ source, onRemove, showRemove = false }: CitationChipProps) {
  const icon = {
    file: FileText,
    link: Link2,
    note: StickyNote,
  }[source.source_type];

  const Icon = icon;

  return (
    <Badge variant="secondary" className="gap-1.5 pr-1">
      <Icon className="h-3 w-3" />
      <span className="text-xs">
        {source.display_text || source.source_type}
      </span>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(source.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Badge>
  );
}
