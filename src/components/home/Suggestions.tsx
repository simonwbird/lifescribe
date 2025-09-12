import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Suggestion } from '@/lib/homeTypes';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock data
const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    text: 'Share a memory about your first pet',
    actionLabel: 'Write story',
    href: '/create/story?prompt=first-pet'
  },
  {
    id: '2', 
    text: 'Upload photos from last family gathering',
    actionLabel: 'Add photos',
    href: '/create/photos'
  },
  {
    id: '3',
    text: 'Record your grandmother\'s recipe story',
    actionLabel: 'Record audio',
    href: '/create/audio'
  }
];

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const { track } = useAnalytics();

  const handleDismiss = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    track('suggestion_dismissed', { suggestionId });
    
    // In real app, would persist dismissal preference
    localStorage.setItem(`suggestion_dismissed_${suggestionId}`, 'true');
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    console.log('Following suggestion:', suggestion.href);
    // In real app, would navigate to suggested action
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