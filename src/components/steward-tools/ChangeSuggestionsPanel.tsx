import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X, User, Clock, Loader2 } from 'lucide-react';
import { useChangeSuggestions, useApproveSuggestion, useRejectSuggestion } from '@/hooks/useChangeSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState as useAuthState } from 'react';

interface ChangeSuggestionsPanelProps {
  personId: string;
  familyId: string;
}

export function ChangeSuggestionsPanel({ personId, familyId }: ChangeSuggestionsPanelProps) {
  const [user, setUser] = useAuthState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data: suggestions = [], isLoading } = useChangeSuggestions(personId);
  const approveSuggestion = useApproveSuggestion();
  const rejectSuggestion = useRejectSuggestion();

  const handleApprove = async (suggestionId: string) => {
    if (!user?.id) return;
    await approveSuggestion.mutateAsync({ suggestionId, reviewerId: user.id });
  };

  const handleRejectClick = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!user?.id || !selectedSuggestion) return;
    
    await rejectSuggestion.mutateAsync({
      suggestionId: selectedSuggestion.id,
      reviewerId: user.id,
      reason: rejectReason,
    });

    setShowRejectDialog(false);
    setSelectedSuggestion(null);
    setRejectReason('');
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'block_content': return 'Content Edit';
      case 'block_add': return 'Add Block';
      case 'block_remove': return 'Remove Block';
      case 'person_info': return 'Person Info';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change Suggestions</CardTitle>
          <CardDescription>
            Review suggested changes from viewers and contributors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No pending suggestions. You're all caught up!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Change Suggestions
            <Badge variant="secondary">{suggestions.length} pending</Badge>
          </CardTitle>
          <CardDescription>
            Review suggested changes from viewers and contributors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback>
                      {suggestion.suggester_name 
                        ? suggestion.suggester_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                        : <User className="h-5 w-5" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {suggestion.suggester_name || 'Anonymous'}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getChangeTypeLabel(suggestion.change_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {suggestion.reason && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.reason}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {suggestion.current_value && (
                        <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
                          <p className="text-xs font-medium mb-1 text-destructive">Current:</p>
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(suggestion.current_value, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      <div className="p-2 bg-primary/10 rounded border border-primary/20">
                        <p className="text-xs font-medium mb-1 text-primary">Suggested:</p>
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(suggestion.suggested_value, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(suggestion.id)}
                    disabled={approveSuggestion.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectClick(suggestion)}
                    disabled={rejectSuggestion.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Change Suggestion</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this suggestion (optional)
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectSuggestion.isPending}
            >
              {rejectSuggestion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
