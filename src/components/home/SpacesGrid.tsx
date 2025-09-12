import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { FileText, Users, Image, ChefHat, Home, TreePine, Shield, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SpaceData {
  id: string;
  title: string;
  description: string;
  count: number;
  lastAdded: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function SpacesGrid() {
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSpacesData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's family
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single();

        if (!member) return;

        // Get counts for various content types
        const [storiesResult, recipesResult, thingsResult, propertiesResult] = await Promise.all([
          supabase.from('stories').select('id', { count: 'exact' }).eq('family_id', member.family_id),
          supabase.from('recipes').select('id', { count: 'exact' }).eq('family_id', member.family_id),
          supabase.from('things').select('id', { count: 'exact' }).eq('family_id', member.family_id),
          supabase.from('properties').select('id', { count: 'exact' }).eq('family_id', member.family_id)
        ]);

        const spacesData: SpaceData[] = [
          {
            id: 'my-stuff',
            title: 'My Stuff',
            description: 'Your private drafts & recordings',
            count: 3,
            lastAdded: '2 days ago',
            href: '/profile',
            icon: FileText,
            color: 'bg-sage/10'
          },
          {
            id: 'family-stories',
            title: 'Family Stories',
            description: 'Shared memories and experiences',
            count: storiesResult.count || 0,
            lastAdded: '4 hours ago',
            href: '/feed',
            icon: Users,
            color: 'bg-sage/10'
          },
          {
            id: 'photos',
            title: 'Photos',
            description: 'Visual memories and moments',
            count: 47,
            lastAdded: '1 day ago',
            href: '/archive',
            icon: Image,
            color: 'bg-sage/10'
          },
          {
            id: 'recipes',
            title: 'Recipes',
            description: 'Family dishes and cooking traditions',
            count: recipesResult.count || 0,
            lastAdded: '1 week ago',
            href: '/archive',
            icon: ChefHat,
            color: 'bg-sage/10'
          },
          {
            id: 'heirlooms',
            title: 'Heirlooms',
            description: 'Precious things with stories',
            count: thingsResult.count || 0,
            lastAdded: '2 weeks ago',
            href: '/archive',
            icon: Shield,
            color: 'bg-sage/10'
          },
          {
            id: 'homes',
            title: 'Homes',
            description: 'Places that shaped your family',
            count: propertiesResult.count || 0,
            lastAdded: '1 month ago',
            href: '/archive',
            icon: Home,
            color: 'bg-sage/10'
          },
          {
            id: 'tree-peek',
            title: 'Family Tree',
            description: 'Your growing family connections',
            count: 24,
            lastAdded: '3 new relatives added',
            href: '/family/tree',
            icon: TreePine,
            color: 'bg-sage/10'
          }
        ];

        setSpaces(spacesData);
      } catch (error) {
        console.error('Error fetching spaces data:', error);
      } finally {
        setLoading(false);
      }
    };

    getSpacesData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-h3 font-serif text-charcoal">Your Spaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-warm-beige/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3 font-serif text-charcoal">Your Spaces</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => {
            const IconComponent = space.icon;
            
            return (
              <Link
                key={space.id}
                to={space.href}
                className="block p-4 rounded-lg border border-warm-beige hover:border-sage/30 hover:bg-sage/5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${space.color} group-hover:bg-sage/20 transition-colors`}>
                    <IconComponent className="w-5 h-5 text-sage" />
                  </div>
                  
                  <Badge variant="secondary" className="bg-warm-gray/10 text-warm-gray">
                    {space.count}
                  </Badge>
                </div>
                
                <h3 className="text-body font-medium text-charcoal mb-1">
                  {space.title}
                </h3>
                <p className="text-fine text-warm-gray mb-2">
                  {space.description}
                </p>
                
                <div className="flex items-center text-fine text-sage">
                  <Clock className="w-3 h-3 mr-1" />
                  {space.lastAdded}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}