import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar, MapPin, Heart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThingForm } from './ThingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Thing {
  id: string;
  title: string;
  object_type: string;
  year_estimated: number;
  maker: string;
  condition: string;
  current_property_id: string;
  room_hint: string;
  tags: string[];
  created_at: string;
  media_count?: number;
  story_count?: number;
  property?: { name: string };
}

export function ThingsList() {
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchThings();
  }, []);

  async function fetchThings() {
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!memberData) return;

      const { data, error } = await supabase
        .from('things')
        .select(`
          *,
          media!inner(id),
          thing_story_links!inner(id),
          properties!current_property_id(name)
        `)
        .eq('family_id', memberData.family_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const thingsWithCounts = data?.map(thing => ({
        ...thing,
        media_count: Array.isArray(thing.media) ? thing.media.length : 0,
        story_count: Array.isArray(thing.thing_story_links) ? thing.thing_story_links.length : 0,
        property: thing.properties
      })) || [];

      setThings(thingsWithCounts);
    } catch (error) {
      console.error('Error fetching things:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredThings = things.filter(thing =>
    thing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thing.object_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thing.maker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thing.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleThingCreated = () => {
    setShowForm(false);
    fetchThings();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading things...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search things..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Thing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Thing</DialogTitle>
            </DialogHeader>
            <ThingForm onSuccess={handleThingCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredThings.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No things yet</h3>
          <p className="text-muted-foreground mb-4">Start cataloging your family heirlooms and treasures</p>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Thing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Thing</DialogTitle>
              </DialogHeader>
              <ThingForm onSuccess={handleThingCreated} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredThings.map((thing) => (
            <Card 
              key={thing.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/things/${thing.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{thing.title}</CardTitle>
                {thing.object_type && (
                  <Badge variant="outline" className="w-fit">
                    {thing.object_type}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {thing.year_estimated && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {thing.year_estimated}
                    </div>
                  )}
                  
                  {thing.maker && (
                    <p className="text-sm text-muted-foreground">Made by: {thing.maker}</p>
                  )}

                  {(thing.property?.name || thing.room_hint) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {thing.property?.name}
                      {thing.room_hint && ` - ${thing.room_hint}`}
                    </div>
                  )}
                </div>

                {thing.condition && (
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {thing.condition}
                    </Badge>
                  </div>
                )}

                {thing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {thing.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {thing.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{thing.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {thing.media_count > 0 && (
                      <span>{thing.media_count} photo{thing.media_count !== 1 ? 's' : ''}</span>
                    )}
                    {thing.story_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {thing.story_count} memor{thing.story_count !== 1 ? 'ies' : 'y'}
                      </div>
                    )}
                  </div>
                  <span>{new Date(thing.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}