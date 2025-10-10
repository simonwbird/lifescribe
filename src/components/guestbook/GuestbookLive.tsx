import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AudioNote } from '@/components/audio/AudioNote';
import { useSubmitGuestbookEntry, useGuestbookEntries } from '@/hooks/useGuestbookModeration';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState as useAuthState } from 'react';

interface GuestbookLiveProps {
  personId: string;
  familyId: string;
  canModerate: boolean;
  isPublic?: boolean;
}

export function GuestbookLive({ personId, familyId, canModerate, isPublic = false }: GuestbookLiveProps) {
  const [user, setUser] = useAuthState<any>(null);
  const [content, setContent] = useState('');
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [showAudioNote, setShowAudioNote] = useState(false);
  
  const { data: entries = [], isLoading } = useGuestbookEntries(personId, 'life');
  const submitEntry = useSubmitGuestbookEntry();

  const handleSubmit = async () => {
    if (!user && (!visitorName || !visitorEmail)) {
      return;
    }

    if (!content.trim()) {
      return;
    }

    await submitEntry.mutateAsync({
      person_id: personId,
      family_id: familyId,
      page_type: 'life',
      content: content.trim(),
      profile_id: user?.id,
      visitor_name: !user ? visitorName : undefined,
      visitor_email: !user ? visitorEmail : undefined,
      is_anonymous: isAnonymous,
    });

    setContent('');
    setVisitorName('');
    setVisitorEmail('');
    setIsAnonymous(false);
  };

  const handleAudioSaved = (transcript: string, audioUrl: string) => {
    setContent(transcript);
    setShowAudioNote(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Guestbook
        </CardTitle>
        <CardDescription>
          Leave a message or voice note to share your thoughts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Submission Form */}
        <div className="space-y-4">
          {!user && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="visitor-name">Your Name</Label>
                <Input
                  id="visitor-name"
                  placeholder="Enter your name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitor-email">Your Email</Label>
                <Input
                  id="visitor-email"
                  type="email"
                  placeholder="Enter your email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll only use this to notify you about your submission
                </p>
              </div>
            </div>
          )}

          {user && (
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous" className="cursor-pointer">
                Post anonymously
              </Label>
            </div>
          )}

          {showAudioNote ? (
            <AudioNote
              familyId={familyId}
              onTranscriptSaved={handleAudioSaved}
            />
          ) : (
            <>
              <Textarea
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitEntry.isPending || !content.trim()}
                >
                  {submitEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAudioNote(true)}
                >
                  Record Voice Note
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages yet. Be the first to leave one!
            </p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  {entry.profile?.avatar_url && (
                    <AvatarImage src={entry.profile.avatar_url} />
                  )}
                  <AvatarFallback>
                    {entry.is_anonymous
                      ? '?'
                      : entry.profile?.full_name
                      ? getInitials(entry.profile.full_name)
                      : entry.visitor_name
                      ? getInitials(entry.visitor_name)
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {entry.is_anonymous
                        ? 'Anonymous'
                        : entry.profile?.full_name || entry.visitor_name}
                    </p>
                    {entry.status === 'pending' && canModerate && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm">{entry.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
