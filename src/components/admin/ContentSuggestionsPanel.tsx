import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Calendar,
  FileText,
  Users,
  Tag,
  Brain,
  Clock
} from 'lucide-react';
import { useAcceptSuggestion } from '@/hooks/useContentAdmin';
import type { ContentSuggestion } from '@/lib/contentAdminTypes';

interface ContentSuggestionsPanelProps {
  suggestions: ContentSuggestion[];
}

const suggestionTypeIcons = {
  title: FileText,
  date: Calendar,
  people: Users,
  tags: Tag
};

const suggestionTypeLabels = {
  title: 'Title',
  date: 'Date',
  people: 'People',
  tags: 'Tags'
};

export function ContentSuggestionsPanel({ suggestions }: ContentSuggestionsPanelProps) {
  const [acceptingAll, setAcceptingAll] = useState(false);
  const acceptMutation = useAcceptSuggestion();

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');
  const rejectedSuggestions = suggestions.filter(s => s.status === 'rejected');

  const handleAcceptSuggestion = async (suggestion: ContentSuggestion) => {
    await acceptMutation.mutateAsync({
      suggestionId: suggestion.id,
      contentType: suggestion.content_type,
      contentId: suggestion.content_id,
      familyId: suggestion.family_id
    });
  };

  const handleAcceptAll = async () => {
    setAcceptingAll(true);
    try {
      for (const suggestion of pendingSuggestions) {
        await acceptMutation.mutateAsync({
          suggestionId: suggestion.id,
          contentType: suggestion.content_type,
          contentId: suggestion.content_id,
          familyId: suggestion.family_id
        });
      }
    } finally {
      setAcceptingAll(false);
    }
  };

  const formatSuggestionValue = (suggestion: ContentSuggestion) => {
    switch (suggestion.suggestion_type) {
      case 'title':
        return suggestion.suggested_value.title;
      case 'date':
        return new Date(suggestion.suggested_value.date).toLocaleDateString();
      case 'people':
        return suggestion.suggested_value.people?.join(', ') || '';
      case 'tags':
        return suggestion.suggested_value.tags?.join(', ') || '';
      default:
        return JSON.stringify(suggestion.suggested_value);
    }
  };

  const formatSourceData = (sourceData: Record<string, any>) => {
    if (sourceData.exif_date) {
      return `We inferred ${new Date(sourceData.exif_date).getFullYear()} from EXIF data`;
    }
    if (sourceData.transcript_analysis) {
      return 'Based on transcript analysis';
    }
    if (sourceData.filename_analysis) {
      return 'Derived from filename pattern';
    }
    return 'AI generated suggestion';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{pendingSuggestions.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{acceptedSuggestions.length}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{rejectedSuggestions.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {pendingSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bulk Actions</CardTitle>
              <Button
                onClick={handleAcceptAll}
                disabled={acceptingAll || acceptMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept All ({pendingSuggestions.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review AI suggestions and apply them in bulk to fix messy metadata quickly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Pending AI Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No pending suggestions</h3>
              <p className="text-muted-foreground">
                AI suggestions will appear here when content needs metadata improvements.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSuggestions.map((suggestion) => {
                const Icon = suggestionTypeIcons[suggestion.suggestion_type];
                const suggestionValue = formatSuggestionValue(suggestion);
                const sourceDescription = formatSourceData(suggestion.source_data);
                
                return (
                  <div 
                    key={suggestion.id} 
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <Badge variant="outline">
                            {suggestionTypeLabels[suggestion.suggestion_type]}
                          </Badge>
                          <Badge variant="secondary">
                            {suggestion.content_type}
                          </Badge>
                          {suggestion.confidence_score && (
                            <Badge 
                              variant="outline"
                              className={suggestion.confidence_score > 0.8 ? 'text-green-600' : 'text-yellow-600'}
                            >
                              {Math.round(suggestion.confidence_score * 100)}% confident
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium">Suggested: "{suggestionValue}"</p>
                          <p className="text-sm text-muted-foreground">{sourceDescription}</p>
                        </div>
                        
                        {suggestion.confidence_score && (
                          <div className="w-full max-w-xs">
                            <Progress 
                              value={suggestion.confidence_score * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(suggestion.created_at).toLocaleDateString()}
                          {suggestion.created_by_ai && (
                            <>
                              <span>•</span>
                              <span>by {suggestion.created_by_ai}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          disabled={acceptMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}