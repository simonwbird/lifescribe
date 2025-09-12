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
import { Home, MapPin, Calendar, ArrowLeft, Package } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  address: string;
  acquired_year: number;
  sold_year: number;
  description: string;
  created_at: string;
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

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (id) {
      fetchProperty(id);
      fetchThingsAtProperty(id);
    }
  }, [id]);

  async function fetchProperty(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      setProperty(data);
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
              {property.acquired_year && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {property.acquired_year}
                    {property.sold_year && ` - ${property.sold_year}`}
                  </span>
                </div>
              )}
              
              {property.sold_year && (
                <Badge variant="secondary">
                  Sold
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