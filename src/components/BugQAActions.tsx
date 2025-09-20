import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { CheckCircle, X, Merge, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BugMergeModal } from './BugMergeModal';

interface BugQAActionsProps {
  bugId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

export function BugQAActions({ bugId, currentStatus, onStatusChange }: BugQAActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const handleMarkAsVerified = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('qa-actions', {
        body: {
          action: 'mark_verified',
          bugId,
          notes: 'Bug marked as verified by QA'
        }
      });

      if (error) throw error;

      onStatusChange('Fixed');
      toast({
        title: "Bug Verified",
        description: "Bug has been marked as verified and closed."
      });
    } catch (error) {
      console.error('Error marking as verified:', error);
      toast({
        title: "Action Failed",
        description: "Unable to mark bug as verified.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWontFix = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('qa-actions', {
        body: {
          action: 'wont_fix',
          bugId,
          notes: 'Bug marked as won\'t fix by QA'
        }
      });

      if (error) throw error;

      onStatusChange('Closed');
      toast({
        title: "Marked Won't Fix",
        description: "Bug has been marked as won't fix and closed."
      });
    } catch (error) {
      console.error('Error marking as won\'t fix:', error);
      toast({
        title: "Action Failed",
        description: "Unable to mark bug as won't fix.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMergeComplete = (parentBugId: string) => {
    setShowMergeModal(false);
    toast({
      title: "Bug Merged",
      description: `Bug has been merged with bug #${parentBugId.slice(0, 8)}.`
    });
    // Optionally redirect to parent bug
    window.location.href = `/admin/bugs/${parentBugId}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={loading}>
            <MoreVertical className="w-4 h-4 mr-2" />
            QA Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus === 'QA Ready' && (
            <>
              <DropdownMenuItem onClick={handleMarkAsVerified} disabled={loading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Verified
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={() => setShowMergeModal(true)} disabled={loading}>
            <Merge className="w-4 h-4 mr-2" />
            Merge with Another Bug
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleWontFix} 
            disabled={loading}
            className="text-red-600 dark:text-red-400"
          >
            <X className="w-4 h-4 mr-2" />
            Won't Fix
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showMergeModal && (
        <BugMergeModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          currentBugId={bugId}
          onMergeComplete={handleMergeComplete}
        />
      )}
    </>
  );
}