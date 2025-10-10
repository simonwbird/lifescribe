import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AudioNote } from '@/components/audio/AudioNote';
import { useSubmitGuestbookEntry, useGuestbookEntries } from '@/hooks/useGuestbookModeration';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Heart, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState as useAuthState } from 'react';

interface GuestbookTributeProps {
  personId: string;
  familyId: string;
  canModerate: boolean;
  isPublic?: boolean;
}

export function GuestbookTribute({ personId, familyId, canModerate, isPublic = false }: GuestbookTributeProps) {
  const [user, setUser] = useAuthState<any>(null);
  const [content, setContent] = useState('');
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [showAudioNote, setShowAudioNote] = useState(false);
  
  const { data: entries = [], isLoading } = useGuestbookEntries(personId, 'tribute');
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
      page_type: 'tribute',
      content: content.trim(),
      profile_id: user?.id,
      visitor_name: !user ? visitorName : undefined,
      visitor_email: !user ? visitorEmail : undefined,
    });

    setContent('');
    setVisitorName('');
    setVisitorEmail('');
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
          <Heart className="h-5 w-5" />
          Tribute Messages
        </CardTitle>
        <CardDescription>
          Share your memories and pay tribute. All submissions are reviewed before appearing.
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
                  We'll notify you when your tribute is approved
                </p>
              </div>
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
                placeholder="Share your memories and tribute..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitEntry.isPending || !content.trim()}
                >
                  {submitEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Tribute
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAudioNote(true)}
                >
                  Record Voice Tribute
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
              No tributes yet. Be the first to share a memory.
            </p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-4 rounded-lg bg-muted/50 border">
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
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {entry.profile?.full_name || entry.visitor_name}
                    </p>
                    {entry.status === 'pending' && canModerate && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Awaiting Review
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
