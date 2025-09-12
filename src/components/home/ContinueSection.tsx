import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, FileText, Image, Mic, Clock } from 'lucide-react';
import type { DraftItem } from '@/lib/homeTypes';

export default function ContinueSection() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  useEffect(() => {
    // Mock drafts - in real app would fetch from localStorage/database
    const mockDrafts: DraftItem[] = [
      {
        id: '1',
        kind: 'story',
        title: 'Summer at Grandma\'s house',
        progress: 'Add photos',
        updatedAt: '2 hours ago'
      },
      {
        id: '2',
        kind: 'photos',
        title: 'Family reunion 2024',
        progress: 'Tag people',
        updatedAt: '1 day ago'
      },
      {
        id: '3',
        kind: 'audio',
        progress: 'Add a title',
        updatedAt: '3 days ago'
      }
    ];

    setDrafts(mockDrafts);
  }, []);

  const getDraftIcon = (kind: DraftItem['kind']) => {
    switch (kind) {
      case 'story': return <FileText className="w-4 h-4" />;
      case 'photos': return <Image className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'scan': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getDraftTitle = (draft: DraftItem) => {
    return draft.title || `Untitled ${draft.kind}`;
  };

  if (drafts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3 font-serif text-charcoal">Continue Where You Left Off</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div 
              key={draft.id}
              className="flex items-center justify-between p-4 rounded-lg border border-warm-beige hover:bg-warm-beige/20 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-sage/10">
                  {getDraftIcon(draft.kind)}
                </div>
                
                <div>
                  <h4 className="text-body font-medium text-charcoal">
                    {getDraftTitle(draft)}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-sage border-sage/30">
                      {draft.progress}
                    </Badge>
                    <span className="text-fine text-warm-gray flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {draft.updatedAt}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button 
                size="sm" 
                className="bg-sage hover:bg-sage/90 text-cream"
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}