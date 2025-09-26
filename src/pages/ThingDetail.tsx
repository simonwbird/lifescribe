import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MediaService } from '@/lib/mediaService';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ImageViewer } from '@/components/ui/image-viewer';
import { Package, Calendar, MapPin, ArrowLeft, DollarSign, Edit2, Image as ImageIcon, Play } from 'lucide-react';

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
  family_id: string;
  properties?: { name: string };
}

interface MediaItem {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  signed_url?: string;
}

export default function ThingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thing, setThing] = useState<Thing | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  useEffect(() => {
    if (id) {
      fetchThing(id);
    }
  }, [id]);

  const fetchMedia = async (thingId: string) => {
    try {
      const { data: mediaData, error } = await supabase
        .from('media')
        .select('*')
        .eq('thing_id', thingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (mediaData && mediaData.length > 0) {
        const mediaWithUrls = await Promise.all(
          mediaData.map(async (item) => {
            const signedUrl = await MediaService.getSignedMediaUrl(item.file_path);
            return {
              ...item,
              signed_url: signedUrl
            };
          })
        );
        setMedia(mediaWithUrls);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  async function fetchThing(thingId: string) {
    try {
      const { data, error } = await supabase
        .from('things')
        .select(`
          *,
          properties!current_property_id(name)
        `)
        .eq('id', thingId)
        .single();

      if (error) throw error;
      setThing(data);
      await fetchMedia(thingId);
    } catch (error) {
      console.error('Error fetching thing:', error);
    } finally {
      setLoading(false);
    }
  }

  const openImageViewer = (imageUrl: string, imageAlt: string) => {
    setCurrentImageUrl(imageUrl);
    setCurrentImageAlt(imageAlt);
    setImageViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center p-8">Loading item...</div>
        </main>
      </div>
    );
  }

  if (!thing) {
    return (
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
    );
  }

  return (
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
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
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
              
              <Button variant="outline" onClick={() => navigate(`/collections?tab=object&edit=${thing.id}`)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Item
              </Button>
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

          {media.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos & Media ({media.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                      {item.signed_url && (
                        <>
                          {item.mime_type.startsWith('image/') ? (
                            <img
                              src={item.signed_url}
                              alt={item.file_name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                              onClick={() => openImageViewer(item.signed_url!, item.file_name)}
                            />
                          ) : item.mime_type.startsWith('video/') ? (
                            <div className="flex h-full w-full items-center justify-center cursor-pointer">
                              <Play className="h-8 w-8 text-muted-foreground" />
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

        <ImageViewer
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={currentImageUrl}
          imageAlt={currentImageAlt}
         />
       </div>
     );
   }