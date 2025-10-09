import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, Calendar, Package, Check } from 'lucide-react';

interface AttachToEntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'story' | 'recipe' | 'media';
  contentId: string;
  familyId: string;
}

interface Person {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

export function AttachToEntityModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  familyId,
}: AttachToEntityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [attachedPeople, setAttachedPeople] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('people');

  useEffect(() => {
    if (open && activeTab === 'people') {
      fetchPeople();
      fetchAttachedPeople();
    }
  }, [open, familyId, activeTab]);

  const fetchPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, full_name, avatar_url, bio')
        .eq('family_id', familyId)
        .order('full_name');

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast.error('Failed to load people');
    }
  };

  const fetchAttachedPeople = async () => {
    try {
      let query;
      
      if (contentType === 'story') {
        // Check story tags for person references
        const { data: storyData } = await supabase
          .from('stories')
          .select('tags')
          .eq('id', contentId)
          .single();
        
        if (storyData?.tags) {
          // Extract person IDs from tags if they exist
          const personIds = storyData.tags.filter((tag: string) => 
            tag.startsWith('person:')
          ).map((tag: string) => tag.replace('person:', ''));
          setAttachedPeople(new Set(personIds));
        }
      } else if (contentType === 'media') {
        // Check face_tags for person references
        const { data: faceTags } = await supabase
          .from('face_tags')
          .select('person_id')
          .eq('media_id', contentId);
        
        if (faceTags) {
          setAttachedPeople(new Set(faceTags.map(ft => ft.person_id)));
        }
      } else if (contentType === 'recipe') {
        // For recipes, we might not have a direct link yet
        // This could be extended to use a recipes_people junction table
        setAttachedPeople(new Set());
      }
    } catch (error) {
      console.error('Error fetching attached people:', error);
    }
  };

  const handleAttachPerson = async (personId: string) => {
    setLoading(true);
    try {
      if (contentType === 'story') {
        // Get current story
        const { data: story } = await supabase
          .from('stories')
          .select('tags')
          .eq('id', contentId)
          .single();

        const currentTags = story?.tags || [];
        const personTag = `person:${personId}`;
        
        if (!currentTags.includes(personTag)) {
          const { error } = await supabase
            .from('stories')
            .update({ tags: [...currentTags, personTag] })
            .eq('id', contentId);

          if (error) throw error;
          setAttachedPeople(prev => new Set([...prev, personId]));
          toast.success('Added person to story');
        }
      } else if (contentType === 'media') {
        // Create face tag (without coordinates - admin can adjust later)
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('face_tags')
          .insert({
            media_id: contentId,
            person_id: personId,
            family_id: familyId,
            created_by: user?.id,
            x_percent: 50,
            y_percent: 50,
            width_percent: 20,
            height_percent: 20,
          });

        if (error) throw error;
        setAttachedPeople(prev => new Set([...prev, personId]));
        toast.success('Tagged person in media');
      } else if (contentType === 'recipe') {
        // For now, create a favorite entry as a relationship
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('favorites')
          .insert({
            person_id: personId,
            family_id: familyId,
            type: 'recipe',
            value: contentId,
            value_hash: contentId,
            created_by: user?.id,
          });

        if (error) throw error;
        setAttachedPeople(prev => new Set([...prev, personId]));
        toast.success('Linked person to recipe');
      }

      await fetchAttachedPeople();
    } catch (error) {
      console.error('Error attaching person:', error);
      toast.error('Failed to attach person');
    } finally {
      setLoading(false);
    }
  };

  const handleDetachPerson = async (personId: string) => {
    setLoading(true);
    try {
      if (contentType === 'story') {
        const { data: story } = await supabase
          .from('stories')
          .select('tags')
          .eq('id', contentId)
          .single();

        const currentTags = story?.tags || [];
        const personTag = `person:${personId}`;
        const newTags = currentTags.filter((tag: string) => tag !== personTag);

        const { error } = await supabase
          .from('stories')
          .update({ tags: newTags })
          .eq('id', contentId);

        if (error) throw error;
        setAttachedPeople(prev => {
          const newSet = new Set(prev);
          newSet.delete(personId);
          return newSet;
        });
        toast.success('Removed person from story');
      } else if (contentType === 'media') {
        const { error } = await supabase
          .from('face_tags')
          .delete()
          .eq('media_id', contentId)
          .eq('person_id', personId);

        if (error) throw error;
        setAttachedPeople(prev => {
          const newSet = new Set(prev);
          newSet.delete(personId);
          return newSet;
        });
        toast.success('Removed person tag from media');
      } else if (contentType === 'recipe') {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('person_id', personId)
          .eq('value', contentId)
          .eq('type', 'recipe');

        if (error) throw error;
        setAttachedPeople(prev => {
          const newSet = new Set(prev);
          newSet.delete(personId);
          return newSet;
        });
        toast.success('Unlinked person from recipe');
      }

      await fetchAttachedPeople();
    } catch (error) {
      console.error('Error detaching person:', error);
      toast.error('Failed to detach person');
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter(person =>
    person.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'story': return 'Story';
      case 'recipe': return 'Recipe';
      case 'media': return 'Media';
      default: return 'Content';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add to Entity</DialogTitle>
          <DialogDescription>
            Link this {getContentTypeLabel().toLowerCase()} to people, events, or things in your family.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people">
              <User className="h-4 w-4 mr-2" />
              People
            </TabsTrigger>
            <TabsTrigger value="events" disabled>
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="things" disabled>
              <Package className="h-4 w-4 mr-2" />
              Things
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredPeople.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No people found' : 'No people added yet'}
                  </div>
                ) : (
                  filteredPeople.map((person) => {
                    const isAttached = attachedPeople.has(person.id);
                    return (
                      <div
                        key={person.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={person.avatar_url} />
                            <AvatarFallback>
                              {person.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{person.full_name}</p>
                            {person.bio && (
                              <p className="text-sm text-muted-foreground truncate">
                                {person.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAttached ? 'secondary' : 'default'}
                          onClick={() =>
                            isAttached
                              ? handleDetachPerson(person.id)
                              : handleAttachPerson(person.id)
                          }
                          disabled={loading}
                        >
                          {isAttached ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Linked
                            </>
                          ) : (
                            'Add'
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events">
            <div className="text-center py-12 text-muted-foreground">
              Event linking coming soon
            </div>
          </TabsContent>

          <TabsContent value="things">
            <div className="text-center py-12 text-muted-foreground">
              Thing linking coming soon
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
