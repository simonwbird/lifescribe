import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Suggestion } from '@/lib/homeTypes';
import { useAnalytics } from '@/hooks/useAnalytics';
import { routes } from '@/lib/routes';

// Mock data with canonical routes
const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    text: 'Share a memory about your first pet',
    actionLabel: 'Write story',
    href: routes.storyNew({ tab: 'voice', promptId: 'first-pet', source: 'suggestion' })
  },
  {
    id: '2', 
    text: 'Upload photos from last family gathering',
    actionLabel: 'Add photos',
    href: routes.storyNew({ tab: 'photo', album: 'last-event', source: 'suggestion' })
  },
  {
    id: '3',
    text: 'Record your grandmother\'s recipe story',
    actionLabel: 'Record audio',
    href: routes.recipesNew('grandmother') + '&source=suggestion'
  }
];

export default function Suggestions() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const { track } = useAnalytics();

  const handleDismiss = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    track('suggestion_dismissed', { suggestionId });
    
    // In real app, would persist dismissal preference
    localStorage.setItem(`suggestion_dismissed_${suggestionId}`, 'true');
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    track('home_suggestion_click', { suggestionId: suggestion.id, href: suggestion.href });
    navigate(suggestion.href);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif">Suggestions</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion) => (
          <div 
            key={suggestion.id}
            className="p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-grow">
                <p className="text-sm text-foreground mb-2">{suggestion.text}</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-7"
                  aria-label={`${suggestion.actionLabel}: ${suggestion.text}`}
                >
                  {suggestion.actionLabel}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(suggestion.id)}
                className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-900"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}