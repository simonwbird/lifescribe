import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface FromOthersAboutMeWidgetProps {
  personId: string;
  familyId: string;
}

interface Mention {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: Date;
  type: 'story' | 'comment' | 'guestbook';
}

export function FromOthersAboutMeWidget({ personId, familyId }: FromOthersAboutMeWidgetProps) {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentions();
  }, [personId, familyId]);

  const fetchMentions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch recent comments on stories about this person
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profile_id,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
        .neq('profile_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch guestbook entries
      const { data: guestbookEntries } = await supabase
        .from('guestbook_entries')
        .select(`
          id,
          content,
          created_at,
          profile_id,
          visitor_name,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        `)
        .eq('person_id', personId)
        .eq('status', 'approved')
        .neq('profile_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(3);

      const allMentions: Mention[] = [];

      // Process comments
      (comments || []).forEach((comment: any) => {
        if (comment.profiles) {
          allMentions.push({
            id: comment.id,
            content: comment.content,
            author: comment.profiles.full_name || 'Anonymous',
            authorAvatar: comment.profiles.avatar_url,
            createdAt: new Date(comment.created_at),
            type: 'comment',
          });
        }
      });

      // Process guestbook entries
      (guestbookEntries || []).forEach((entry: any) => {
        allMentions.push({
          id: entry.id,
          content: entry.content,
          author: entry.profiles?.full_name || entry.visitor_name || 'Anonymous',
          authorAvatar: entry.profiles?.avatar_url,
          createdAt: new Date(entry.created_at),
          type: 'guestbook',
        });
      });

      // Sort by most recent and limit
      allMentions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setMentions(allMentions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateContent = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  if (loading || mentions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="h-4 w-4" />
          From Others About Me
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mentions.map((mention) => (
            <div
              key={mention.id}
              className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-xs font-medium">{mention.author}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {mention.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                "{truncateContent(mention.content)}"
              </p>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(mention.createdAt, { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
