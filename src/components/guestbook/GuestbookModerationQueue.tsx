import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  useGuestbookModerationQueue,
  useApproveEntry,
  useRejectEntry,
} from '@/hooks/useGuestbookModeration';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState as useAuthState } from 'react';

interface GuestbookModerationQueueProps {
  familyId: string;
}

export function GuestbookModerationQueue({ familyId }: GuestbookModerationQueueProps) {
  const [user, setUser] = useAuthState<any>(null);
  const { data: queue = [], isLoading } = useGuestbookModerationQueue(familyId);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const approveEntry = useApproveEntry();
  const rejectEntry = useRejectEntry();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (entryId: string) => {
    if (!user) return;
    await approveEntry.mutateAsync({ entryId, moderatorId: user.id });
  };

  const handleRejectClick = (entryId: string) => {
    setSelectedEntry(entryId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!user || !selectedEntry) return;
    
    await rejectEntry.mutateAsync({
      entryId: selectedEntry,
      moderatorId: user.id,
      reason: rejectReason,
    });

    setRejectDialogOpen(false);
    setSelectedEntry(null);
    setRejectReason('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
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
            <Clock className="h-5 w-5" />
            Moderation Queue
            {queue.length > 0 && (
              <Badge variant="secondary">{queue.length} pending</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and approve guestbook submissions before they appear publicly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No entries pending review
            </p>
          ) : (
            <div className="space-y-4">
              {queue.map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {entry.profile?.avatar_url && (
                        <AvatarImage src={entry.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {entry.profile?.full_name
                          ? getInitials(entry.profile.full_name)
                          : entry.visitor_name
                          ? getInitials(entry.visitor_name)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {entry.profile?.full_name || entry.visitor_name}
                        </p>
                        {entry.visitor_email && (
                          <span className="text-xs text-muted-foreground">
                            ({entry.visitor_email})
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {entry.page_type === 'life' ? 'Live Page' : 'Tribute Page'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {entry.person && (
                        <p className="text-xs text-muted-foreground">
                          For: {entry.person.given_name} {entry.person.surname}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pl-13">
                    <p className="text-sm leading-relaxed">{entry.content}</p>
                  </div>

                  <div className="flex gap-2 pl-13">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(entry.id)}
                      disabled={approveEntry.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectClick(entry.id)}
                      disabled={rejectEntry.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reject Submission
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this submission. The submitter will be notified if
              they provided an email address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g., Content violates community guidelines, duplicate submission, spam..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectEntry.isPending}
            >
              {rejectEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
