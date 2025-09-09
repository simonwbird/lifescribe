import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthGate from '@/components/AuthGate';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, MapPin, ArrowLeft, DollarSign } from 'lucide-react';

interface Thing {
  id: string;
  title: string;
  object_type: string;
  year_estimated: number;
  maker: string;
  description: string;
  provenance: string;
  condition: string;
  value_estimate: string;
  room_hint: string;
  tags: string[];
  created_at: string;
  properties?: { name: string };
}

export default function ThingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thing, setThing] = useState<Thing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchThing(id);
    }
  }, [id]);

  async function fetchThing(thingId: string) {
    try {
      const { data, error } = await supabase
        .from('things')
        .select(`
          *,
          properties(name)
        `)
        .eq('id', thingId)
        .single();

      if (error) throw error;
      setThing(data);
    } catch (error) {
      console.error('Error fetching thing:', error);
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
            <div className="flex justify-center p-8">Loading item...</div>
          </main>
        </div>
      </AuthGate>
    );
  }

  if (!thing) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Item not found</h3>
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
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{thing.title}</h1>
                {thing.object_type && (
                  <Badge variant="outline" className="mb-2">
                    {thing.object_type.charAt(0).toUpperCase() + thing.object_type.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {thing.year_estimated && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Year</p>
                    <p className="text-sm text-muted-foreground">{thing.year_estimated}</p>
                  </div>
                </div>
              )}
              
              {thing.maker && (
                <div>
                  <p className="text-sm font-medium">Made By</p>
                  <p className="text-sm text-muted-foreground">{thing.maker}</p>
                </div>
              )}

              {(thing.properties?.name || thing.room_hint) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {thing.properties?.name}
                      {thing.room_hint && ` - ${thing.room_hint}`}
                    </p>
                  </div>
                </div>
              )}

              {thing.value_estimate && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Est. Value</p>
                    <p className="text-sm text-muted-foreground">{thing.value_estimate}</p>
                  </div>
                </div>
              )}
            </div>

            {(thing.condition || thing.tags.length > 0) && (
              <div className="flex items-center gap-4 mb-6">
                {thing.condition && (
                  <Badge variant="secondary">
                    Condition: {thing.condition}
                  </Badge>
                )}
                {thing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {thing.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {thing.description && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{thing.description}</p>
              </CardContent>
            </Card>
          )}

          {thing.provenance && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Provenance & History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{thing.provenance}</p>
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            Added on {new Date(thing.created_at).toLocaleDateString()}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}