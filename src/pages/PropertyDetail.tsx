import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);

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
                {property.address && (
                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    {property.address}
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