import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, ExternalLink } from 'lucide-react';

interface BugReport {
  id: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface BugMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBugId: string;
  onMergeComplete: (parentBugId: string) => void;
}

export function BugMergeModal({ isOpen, onClose, currentBugId, onMergeComplete }: BugMergeModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BugReport[]>([]);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [mergeReason, setMergeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchBugs();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchBugs = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select(`
          id,
          title,
          status,
          severity,
          created_at,
          user_id
        `)
        .neq('id', currentBugId)
        .ilike('title', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Get profile information for each bug
      const bugsWithProfiles = await Promise.all(
        (data || []).map(async (bug) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', bug.user_id)
            .single();
          
          return {
            id: bug.id,
            title: bug.title,
            status: bug.status,
            severity: bug.severity,
            created_at: bug.created_at,
            profiles: profile || { full_name: 'Unknown User' }
          };
        })
      );

      setSearchResults(bugsWithProfiles);
    } catch (error) {
      console.error('Error searching bugs:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedBug || !mergeReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a bug to merge with and provide a reason.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('qa-actions', {
        body: {
          action: 'merge_bugs',
          currentBugId,
          parentBugId: selectedBug.id,
          mergeReason
        }
      });

      if (error) throw error;
      onMergeComplete(selectedBug.id);
    } catch (error) {
      console.error('Error merging bugs:', error);
      toast({
        title: "Merge Failed",
        description: "Unable to merge bugs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merge Bug Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Search for parent bug to merge with</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type at least 3 characters to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {searching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Label className="text-sm font-medium">Search Results:</Label>
              {searchResults.map((bug) => (
                <div
                  key={bug.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBug?.id === bug.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedBug(bug)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{bug.title}</span>
                        <Badge variant="outline" className="text-xs">
                          #{bug.id.slice(0, 8)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant={
                          bug.status === 'Fixed' ? 'default' :
                          bug.status === 'In Progress' ? 'secondary' :
                          'outline'
                        }>
                          {bug.status}
                        </Badge>
                        <Badge variant={
                          bug.severity === 'High' ? 'destructive' :
                          bug.severity === 'Medium' ? 'secondary' :
                          'outline'
                        }>
                          {bug.severity}
                        </Badge>
                        <span>by {bug.profiles?.full_name || 'Unknown'}</span>
                        <span>{format(new Date(bug.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/admin/bugs/${bug.id}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedBug && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Label className="text-sm font-medium">Selected parent bug:</Label>
              <div className="mt-1 text-sm">{selectedBug.title}</div>
              <div className="text-xs text-muted-foreground">#{selectedBug.id.slice(0, 8)}</div>
            </div>
          )}

          <div>
            <Label>Merge Reason</Label>
            <Textarea
              placeholder="Explain why these bugs should be merged..."
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleMerge} 
            disabled={!selectedBug || !mergeReason.trim() || loading}
          >
            {loading ? 'Merging...' : 'Merge Bugs'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}