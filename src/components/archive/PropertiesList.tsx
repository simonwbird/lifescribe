import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Calendar, Package, Heart, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PropertyForm } from './PropertyForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Property {
  id: string;
  name: string;
  address: string;
  acquired_year: number;
  sold_year: number;
  description: string;
  created_at: string;
  media_count?: number;
  story_count?: number;
  things_count?: number;
}

export function PropertiesList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!memberData) return;

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          media!inner(id),
          property_story_links!inner(id),
          things!inner(id)
        `)
        .eq('family_id', memberData.family_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const propertiesWithCounts = data?.map(property => ({
        ...property,
        media_count: Array.isArray(property.media) ? property.media.length : 0,
        story_count: Array.isArray(property.property_story_links) ? property.property_story_links.length : 0,
        things_count: Array.isArray(property.things) ? property.things.length : 0
      })) || [];

      setProperties(propertiesWithCounts);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePropertyCreated = () => {
    setShowForm(false);
    fetchProperties();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <PropertyForm onSuccess={handlePropertyCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">Start documenting your family's homes and properties</p>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
              </DialogHeader>
              <PropertyForm onSuccess={handlePropertyCreated} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card 
              key={property.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{property.name}</CardTitle>
                {property.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {property.address}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {property.acquired_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {property.acquired_year}
                      {property.sold_year && ` - ${property.sold_year}`}
                    </div>
                  )}
                </div>

                {property.sold_year && (
                  <Badge variant="secondary" className="w-fit">
                    Sold
                  </Badge>
                )}

                {property.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {property.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {property.things_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {property.things_count} thing{property.things_count !== 1 ? 's' : ''}
                      </div>
                    )}
                    {property.media_count > 0 && (
                      <span>{property.media_count} photo{property.media_count !== 1 ? 's' : ''}</span>
                    )}
                    {property.story_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {property.story_count} memor{property.story_count !== 1 ? 'ies' : 'y'}
                      </div>
                    )}
                  </div>
                  <span>{new Date(property.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}