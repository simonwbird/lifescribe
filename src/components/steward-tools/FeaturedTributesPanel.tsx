import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, GripVertical, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface FeaturedTributesPanelProps {
  personId: string;
  familyId: string;
}

export function FeaturedTributesPanel({ personId, familyId }: FeaturedTributesPanelProps) {
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [featuredEntries, setFeaturedEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinning, setPinning] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [personId]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select(`
          *,
          profile:profile_id(id, full_name, avatar_url)
        `)
        .eq('person_id', personId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const featured = data?.filter(e => e.is_featured)
        .sort((a, b) => (a.featured_order || 0) - (b.featured_order || 0)) || [];
      
      const regular = data?.filter(e => !e.is_featured) || [];

      setFeaturedEntries(featured);
      setEntries(regular);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load guestbook entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (entryId: string) => {
    if (!user || featuredEntries.length >= 3) {
      toast({
        title: 'Limit reached',
        description: 'You can only pin up to 3 tributes. Unpin one first.',
        variant: 'destructive',
      });
      return;
    }

    setPinning(entryId);
    try {
      const { error } = await supabase
        .from('guestbook_entries')
        .update({
          is_featured: true,
          featured_order: featuredEntries.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;

      await fetchEntries();
      
      toast({
        title: 'Tribute pinned',
        description: 'This tribute is now featured at the top',
      });
    } catch (error) {
      console.error('Error pinning entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to pin tribute',
        variant: 'destructive',
      });
    } finally {
      setPinning(null);
    }
  };

  const handleUnpin = async (entryId: string) => {
    setPinning(entryId);
    try {
      const { error } = await supabase
        .from('guestbook_entries')
        .update({
          is_featured: false,
          featured_order: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;

      // Reorder remaining featured entries
      const remaining = featuredEntries.filter(e => e.id !== entryId);
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from('guestbook_entries')
          .update({ featured_order: i })
          .eq('id', remaining[i].id);
      }

      await fetchEntries();
      
      toast({
        title: 'Tribute unpinned',
        description: 'This tribute is no longer featured',
      });
    } catch (error) {
      console.error('Error unpinning entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to unpin tribute',
        variant: 'destructive',
      });
    } finally {
      setPinning(null);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(featuredEntries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFeaturedEntries(items);

    // Update order in database
    try {
      for (let i = 0; i < items.length; i++) {
        await supabase
          .from('guestbook_entries')
          .update({ 
            featured_order: i,
            updated_at: new Date().toISOString(),
          })
          .eq('id', items[i].id);
      }

      toast({
        title: 'Order updated',
        description: 'Featured tributes have been reordered',
      });
    } catch (error) {
      console.error('Error reordering:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder tributes',
        variant: 'destructive',
      });
      await fetchEntries();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  if (loading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-primary text-primary" />
          Featured Tributes
          <Badge variant="secondary">{featuredEntries.length}/3</Badge>
        </CardTitle>
        <CardDescription>
          Pin up to 3 guestbook entries to feature at the top of the page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Featured Tributes */}
        {featuredEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Pinned Tributes (drag to reorder)</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="featured">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {featuredEntries.map((entry, index) => (
                      <Draggable key={entry.id} draggableId={entry.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-3 rounded-lg border bg-primary/5 border-primary/20 space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Avatar className="h-8 w-8 shrink-0">
                                {entry.profile?.avatar_url && (
                                  <AvatarImage src={entry.profile.avatar_url} />
                                )}
                                <AvatarFallback className="text-xs">
                                  {entry.profile?.full_name
                                    ? getInitials(entry.profile.full_name)
                                    : entry.visitor_name
                                    ? getInitials(entry.visitor_name)
                                    : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">
                                    {entry.profile?.full_name || entry.visitor_name}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    #{index + 1}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {entry.content}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnpin(entry.id)}
                                disabled={pinning === entry.id}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Available Tributes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Available Tributes
            {featuredEntries.length >= 3 && (
              <span className="text-xs text-muted-foreground ml-2">
                (Unpin one to pin another)
              </span>
            )}
          </h3>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {featuredEntries.length > 0
                ? 'All approved tributes are pinned'
                : 'No approved tributes yet'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border bg-muted/50 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      {entry.profile?.avatar_url && (
                        <AvatarImage src={entry.profile.avatar_url} />
                      )}
                      <AvatarFallback className="text-xs">
                        {entry.profile?.full_name
                          ? getInitials(entry.profile.full_name)
                          : entry.visitor_name
                          ? getInitials(entry.visitor_name)
                          : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {entry.profile?.full_name || entry.visitor_name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePin(entry.id)}
                      disabled={pinning === entry.id || featuredEntries.length >= 3}
                    >
                      {pinning === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-1" />
                          Pin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
