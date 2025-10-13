import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourceType, CreateSourceInput } from '@/lib/citations/citationTypes';
import { FileText, Link2, StickyNote } from 'lucide-react';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: CreateSourceInput) => void;
  storyId: string;
  familyId: string;
  paragraphIndex?: number | null;
}

export function AddSourceDialog({
  open,
  onOpenChange,
  onAdd,
  storyId,
  familyId,
  paragraphIndex,
}: AddSourceDialogProps) {
  const [sourceType, setSourceType] = useState<SourceType>('link');
  const [content, setContent] = useState('');
  const [displayText, setDisplayText] = useState('');

  const handleAdd = () => {
    if (!content.trim()) return;

    onAdd({
      story_id: storyId,
      family_id: familyId,
      source_type: sourceType,
      source_content: content.trim(),
      paragraph_index: paragraphIndex,
      display_text: displayText.trim() || null,
    });

    setContent('');
    setDisplayText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Citation Source</DialogTitle>
        </DialogHeader>

        <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <Link2 className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="file">
              <FileText className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
            <TabsTrigger value="note">
              <StickyNote className="h-4 w-4 mr-2" />
              Note
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com/article"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="link-display">Display Text (optional)</Label>
              <Input
                id="link-display"
                placeholder="e.g., New York Times, 2020"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div>
              <Label htmlFor="file-path">File Path or URL</Label>
              <Input
                id="file-path"
                placeholder="Path to document or media file"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="file-display">Display Text (optional)</Label>
              <Input
                id="file-display"
                placeholder="e.g., Photo album, page 23"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="note" className="space-y-4">
            <div>
              <Label htmlFor="note-content">Note</Label>
              <Textarea
                id="note-content"
                placeholder="Personal recollection, interview notes, etc."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!content.trim()}>
            Add Source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
