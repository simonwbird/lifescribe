import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PossibleDuplicate } from '@/hooks/useBugReporting';
import { MessageSquare, Plus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DuplicateHandlerProps {
  isOpen: boolean;
  duplicates: PossibleDuplicate[];
  onAddComment: (bugId: string) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export const DuplicateHandler = ({ 
  isOpen, 
  duplicates, 
  onAddComment, 
  onCreateNew, 
  onCancel 
}: DuplicateHandlerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Possible Duplicate Found
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            We found {duplicates.length} similar bug report{duplicates.length > 1 ? 's' : ''}. 
            You can add your report as a comment to an existing bug or create a new one.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {duplicates.map((duplicate) => (
              <Card key={duplicate.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {duplicate.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={duplicate.similarity_score === 1 ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {Math.round(duplicate.similarity_score * 100)}% match
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {duplicate.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(duplicate.created_at), "MMM dd, yyyy")}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddComment(duplicate.id)}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={onCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Bug Report
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Creating a new report when duplicates exist may result in slower resolution times.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};