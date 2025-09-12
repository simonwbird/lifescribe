import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  ChefHat, 
  Heart, 
  Home, 
  User, 
  Users,
  Plus,
  TreePine
} from 'lucide-react';
import { SpaceCard } from '@/lib/homeTypes';

// Mock data
const mockSpaces: SpaceCard[] = [
  {
    id: 'stories',
    title: 'Family Stories',
    description: 'Shared memories and experiences',
    count: 47,
    updatedAt: '2025-01-10T14:30:00Z',
    href: '/stories'
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'Family photo collections',
    count: 234,
    updatedAt: '2025-01-09T16:45:00Z',
    href: '/photos'
  },
  {
    id: 'recipes',
    title: 'Recipes',
    description: 'Family recipes and cooking traditions',
    count: 12,
    updatedAt: '2025-01-08T11:20:00Z',
    href: '/recipes'
  },
  {
    id: 'heirlooms',
    title: 'Heirlooms',
    description: 'Treasured family objects',
    count: 8,
    updatedAt: '2025-01-07T09:15:00Z',
    href: '/heirlooms'
  },
  {
    id: 'homes',
    title: 'Homes',
    description: 'Places that hold memories',
    count: 5,
    updatedAt: '2025-01-06T14:30:00Z',
    href: '/homes'
  },
  {
    id: 'my-stuff',
    title: 'My Stuff',
    description: 'Private drafts & recordings',
    count: 3,
    updatedAt: '2025-01-10T10:15:00Z',
    href: '/my-stuff'
  }
];

const getSpaceIcon = (spaceId: string) => {
  const iconProps = { className: "h-5 w-5" };
  switch (spaceId) {
    case 'stories': return <FileText {...iconProps} />;
    case 'photos': return <Image {...iconProps} />;
    case 'recipes': return <ChefHat {...iconProps} />;
    case 'heirlooms': return <Heart {...iconProps} />;
    case 'homes': return <Home {...iconProps} />;
    case 'my-stuff': return <User {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Updated ${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `Updated ${diffHours}h ago`;
  } else {
    return 'Updated just now';
  }
};

export default function FamilySpaces() {
  const handleSpaceClick = (space: SpaceCard) => {
    console.log('Navigating to:', space.href);
    // In real app, would use router navigation
  };

  const handleAddClick = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    console.log('Adding to space:', spaceId);
    // In real app, would open appropriate creation modal
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-serif">Your Family Spaces</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSpaces.map((space) => (
          <Card 
            key={space.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => handleSpaceClick(space)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSpaceClick(space);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {getSpaceIcon(space.id)}
                  </div>
                  <div>
                    <h3 className="font-serif font-medium">{space.title}</h3>
                    <p className="text-sm text-muted-foreground">{space.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleAddClick(e, space.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {space.count} {space.count === 1 ? 'item' : 'items'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(space.updatedAt!)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Tree Peek Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TreePine className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-serif font-medium">Tree Peek</h3>
                  <p className="text-sm text-muted-foreground">Family tree overview</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                3 new relatives added
              </Badge>
              <span className="text-xs text-muted-foreground">
                View tree →
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}