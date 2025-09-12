import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MediaService } from '@/lib/mediaService';
import AuthGate from '@/components/AuthGate';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, MapPin, Calendar, ArrowLeft, Package, Users, FileText, Camera } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string;
  acquired_year: number;
  sold_year: number;
  description: string;
  created_at: string;
  first_known_date?: string;
  last_known_date?: string;
  built_year?: number;
  built_year_circa?: boolean;
  status?: string;
}

interface Thing {
  id: string;
  title: string;
  object_type: string;
  room_hint: string;
}

interface MediaItem {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  created_at: string;
  signedUrl: string | null;
}

interface PropertyOccupancy {
  id: string;
  role: string;
  start_date?: string;
  end_date?: string;
  primary_home: boolean;
  notes?: string;
  people: {
    id: string;
    full_name: string;
  };
}

interface PropertyEvent {
  id: string;
  event_type: string;
  event_date?: string;
  title: string;
  notes?: string;
}

interface PropertyVisit {
  id: string;
  start_date?: string;
  end_date?: string;
  occasion: string;
  notes?: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  occurred_on?: string;
  created_at: string;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [occupancy, setOccupancy] = useState<PropertyOccupancy[]>([]);
  const [events, setEvents] = useState<PropertyEvent[]>([]);
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    if (id) {
      fetchProperty(id);
      fetchThingsAtProperty(id);
      fetchMediaForProperty(id);
      fetchOccupancy(id);
      fetchEvents(id);
      fetchVisits(id);
      fetchStories(id);
    }
  }, [id]);

  async function fetchProperty(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_occupancy(
            id, role, start_date, end_date, primary_home, notes,
            people(id, full_name)
          )
        `)
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      setProperty(data);
      setOccupancy(data.property_occupancy || []);
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  }

  async function fetchThingsAtProperty(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('things')
        .select('id, title, object_type, room_hint')
        .eq('current_property_id', propertyId);

      if (error) throw error;
      setThings(data || []);
    } catch (error) {
      console.error('Error fetching things at property:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMediaForProperty(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('id,file_path,file_name,mime_type,created_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const withUrls = await Promise.all((data || []).map(async (m: any) => ({
        ...m,
        signedUrl: await MediaService.getMediaUrl(m.file_path)
      })));
      setMedia(withUrls);
    } catch (error) {
      console.error('Error fetching property media:', error);
    }
  }

  function formatAddress(addr: any): string | null {
    if (!addr) return null;
    const parts = [addr.line1, addr.line2, addr.city, addr.region, addr.country].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }

  useEffect(() => {
    if (id) {
      fetchMediaForProperty(id);
    }
  }, [id]);

  async function fetchOccupancy(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('property_occupancy')
        .select(`
          id, role, start_date, end_date, primary_home, notes,
          people (id, full_name)
        `)
        .eq('property_id', propertyId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      setOccupancy(data || []);
    } catch (error) {
      console.error('Error fetching occupancy:', error);
    }
  }

  async function fetchEvents(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('property_events')
        .select('id, event_type, event_date, title, notes')
        .eq('property_id', propertyId)
        .order('event_date', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }

  async function fetchVisits(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('property_visits')
        .select('id, start_date, end_date, occasion, notes')
        .eq('property_id', propertyId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  }

  async function fetchStories(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, occurred_on, created_at')
        .eq('happened_at_property_id', propertyId)
        .order('occurred_on', { ascending: false });
      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="flex justify-center p-8">Loading property...</div>
          </main>
        </div>
      </AuthGate>
    );
  }

  if (!property) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Property not found</h3>
              <Button onClick={() => navigate('/archive')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Archive
              </Button>
            </div>
          </main>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/archive')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Archive
            </Button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{property.name}</h1>
                {(property.address || formatAddress((property as any).address_json)) && (
                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    {property.address || formatAddress((property as any).address_json)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-6">
              {(property.acquired_year || property.first_known_date) && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {property.first_known_date 
                      ? `Moved in: ${new Date(property.first_known_date).toLocaleDateString()}`
                      : `Acquired: ${property.acquired_year}`
                    }
                    {property.sold_year && ` - ${property.sold_year}`}
                  </span>
                </div>
              )}
              
              {property.built_year && (
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>Built {property.built_year}{property.built_year_circa ? ' (circa)' : ''}</span>
                </div>
              )}
              
              {property.sold_year && (
                <Badge variant="secondary">
                  Sold
                </Badge>
              )}
              
              {property.status && (
                <Badge variant={property.status === 'current' ? 'default' : 'secondary'}>
                  {property.status}
                </Badge>
              )}
            </div>
          </div>

          {property.description && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About This Property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </CardContent>
            </Card>
          )}

          {media.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Photos & Documents ({media.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map((m) => (
                    <div key={m.id} className="relative rounded-lg overflow-hidden border bg-muted">
                      {m.mime_type.startsWith('image/') && m.signedUrl ? (
                        <img
                          src={m.signedUrl}
                          alt={m.file_name}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as any).src = '/placeholder.svg' }}
                        />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground px-3">
                          {m.file_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Who Lived Here
              </CardTitle>
            </CardHeader>
            <CardContent>
              {occupancy.length > 0 ? (
                <div className="space-y-4">
                  {occupancy.map((occ) => (
                    <div key={occ.id} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{occ.people.full_name}</h4>
                          <Badge variant="outline" className="mt-1 capitalize">
                            {occ.role}
                          </Badge>
                        </div>
                        {occ.primary_home && (
                          <Badge variant="secondary">Primary Home</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {occ.start_date && (
                          <span>From {new Date(occ.start_date).toLocaleDateString()}</span>
                        )}
                        {occ.end_date && (
                          <span> to {new Date(occ.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      {occ.notes && (
                        <p className="text-sm mt-2">{occ.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No occupancy records yet.</p>
                  <p className="text-sm mt-2">Add family members and their move-in dates to track who lived here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {events.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Property Events ({events.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge variant="outline" className="capitalize">
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      {event.event_date && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      )}
                      {event.notes && (
                        <p className="text-sm">{event.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {visits.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Visits & Occasions ({visits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visits.map((visit) => (
                    <div key={visit.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-1">
                        <Badge variant="outline" className="capitalize">
                          {visit.occasion.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {visit.start_date && (
                          <span>From {new Date(visit.start_date).toLocaleDateString()}</span>
                        )}
                        {visit.end_date && (
                          <span> to {new Date(visit.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      {visit.notes && (
                        <p className="text-sm">{visit.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {stories.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Stories & Memories ({stories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="p-4 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                         onClick={() => navigate(`/stories/${story.id}`)}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{story.title}</h4>
                        {story.occurred_on && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(story.occurred_on).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {story.content.substring(0, 200)}...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {things.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Things at This Property ({things.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {things.map((thing) => (
                    <div
                      key={thing.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/things/${thing.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{thing.title}</h4>
                          {thing.room_hint && (
                            <p className="text-sm text-muted-foreground">{thing.room_hint}</p>
                          )}
                        </div>
                        {thing.object_type && (
                          <Badge variant="outline" className="text-xs">
                            {thing.object_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            Added on {new Date(property.created_at).toLocaleDateString()}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}