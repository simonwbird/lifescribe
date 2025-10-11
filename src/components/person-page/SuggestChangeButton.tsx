import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useSubmitSuggestion } from '@/hooks/useChangeSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface SuggestChangeButtonProps {
  personId: string;
  familyId: string;
  blockId?: string;
  currentValue?: any;
}

export function SuggestChangeButton({ personId, familyId, blockId, currentValue }: SuggestChangeButtonProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const submitSuggestion = useSubmitSuggestion();

  const handleSubmit = async () => {
    if (!suggestedValue.trim()) {
      return;
    }

    await submitSuggestion.mutateAsync({
      person_id: personId,
      family_id: familyId,
      suggested_by: user?.id,
      suggester_name: !user ? visitorName : undefined,
      suggester_email: !user ? visitorEmail : undefined,
      block_id: blockId,
      change_type: blockId ? 'block_content' : 'person_info',
      current_value: currentValue,
      suggested_value: { content: suggestedValue },
      reason,
    });

    setOpen(false);
    setSuggestedValue('');
    setReason('');
    setVisitorName('');
    setVisitorEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="h-4 w-4 mr-2" />
          Suggest Change
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Suggest a Change</DialogTitle>
          <DialogDescription>
            Share your suggestion for improving this content. Stewards will review and approve it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!user && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="suggestion">Suggested Content</Label>
            <Textarea
              id="suggestion"
              placeholder="Enter your suggested changes..."
              value={suggestedValue}
              onChange={(e) => setSuggestedValue(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this change would be helpful..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitSuggestion.isPending || !suggestedValue.trim()}
          >
            {submitSuggestion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
