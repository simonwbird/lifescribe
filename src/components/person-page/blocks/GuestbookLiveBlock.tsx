import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AudioNote } from '@/components/audio/AudioNote';
import { 
  useSubmitGuestbookEntry, 
  useGuestbookEntries, 
  usePinEntry, 
  useUnpinEntry 
} from '@/hooks/useGuestbookModeration';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare, Clock, Pin, PinOff, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GuestbookLiveBlockProps {
  personId: string;
  familyId: string;
  canModerate: boolean;
  pageVisibility?: 'public' | 'private' | 'unlisted';
}

export default function GuestbookLiveBlock({ 
  personId, 
  familyId, 
  canModerate,
  pageVisibility = 'private'
}: GuestbookLiveBlockProps) {
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [showAudioNote, setShowAudioNote] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoadingAuth(false);
    });
  }, []);

  const { data: entries = [], isLoading } = useGuestbookEntries(personId, 'life');
  const submitEntry = useSubmitGuestbookEntry();
  const pinEntry = usePinEntry();
  const unpinEntry = useUnpinEntry();

  const requiresAuth = pageVisibility === 'private' || pageVisibility === 'unlisted';

  // Split entries into featured and regular
  const featuredEntries = entries
    .filter(e => e.is_featured && e.status === 'approved')
    .sort((a, b) => (a.featured_order || 0) - (b.featured_order || 0));
  
  const regularEntries = entries
    .filter(e => !e.is_featured && (e.status === 'approved' || canModerate))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleSubmit = async () => {
    if (requiresAuth && !user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a message.',
        variant: 'destructive',
      });
      return;
    }

    if (!user && (!visitorName || !visitorEmail)) {
      toast({
        title: 'Information required',
        description: 'Please provide your name and email.',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write your message.',
        variant: 'destructive',
      });
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
    });

    setContent('');
    setVisitorName('');
    setVisitorEmail('');
  };

  const handleAudioSaved = (transcript: string) => {
    setContent(transcript);
    setShowAudioNote(false);
  };

  const handlePin = async (entryId: string) => {
    await pinEntry.mutateAsync({ entryId, personId, pageType: 'life' });
  };

  const handleUnpin = async (entryId: string) => {
    await unpinEntry.mutateAsync({ entryId, personId });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderEntry = (entry: any, isFeatured = false) => (
    <div 
      key={entry.id} 
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        isFeatured ? "bg-primary/5 border-primary/20" : "bg-muted/50"
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
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
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">
            {entry.profile?.full_name || entry.visitor_name}
          </p>
          {isFeatured && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
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
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
      </div>
      {canModerate && entry.status === 'approved' && (
        <div className="shrink-0">
          {isFeatured ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnpin(entry.id)}
              disabled={unpinEntry.isPending}
            >
              <PinOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePin(entry.id)}
              disabled={pinEntry.isPending}
              title="Feature this message (max 3)"
            >
              <Pin className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (isLoadingAuth) {
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

  if (requiresAuth && !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Guestbook
          </CardTitle>
          <CardDescription>
            Sign in to view and leave messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              This is a private page. Please sign in to continue.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="guestbook">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Guestbook
        </CardTitle>
        <CardDescription>
          Leave a note, share encouragement, or drop a quick hello.
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
                  We'll notify you when your message is approved
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
                placeholder="Share a message, encouragement, or quick hello..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2 flex-wrap">
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

        {/* Featured Entries */}
        {featuredEntries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <h3 className="font-semibold text-sm">Featured Messages</h3>
            </div>
            <div className="space-y-3">
              {featuredEntries.map(entry => renderEntry(entry, true))}
            </div>
          </div>
        )}

        {/* Regular Entries */}
        <div className="space-y-3">
          {featuredEntries.length > 0 && regularEntries.length > 0 && (
            <h3 className="font-semibold text-sm">All Messages</h3>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : regularEntries.length === 0 && featuredEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages yet. Be the first to leave a note!
            </p>
          ) : (
            <div className="space-y-3">
              {regularEntries.map(entry => renderEntry(entry, false))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
