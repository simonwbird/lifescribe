import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, User, Calendar, Home, Package, Utensils, Heart, X } from 'lucide-react';
import {
  useEntitySuggestions,
  useCreateEntityLink,
  useEntityLinks,
  useDeleteEntityLink,
  EntitySuggestion,
} from '@/hooks/useEntitySuggestions';
import { useAnalyticsContext } from '@/components/analytics/AnalyticsProvider';

interface SuggestedLinksPanelProps {
  content: string;
  sourceId: string;
  sourceType: string;
  familyId: string;
}

const entityIcons = {
  person: User,
  event: Calendar,
  property: Home,
  thing: Package,
  recipe: Utensils,
  pet: Heart,
};

const entityLabels = {
  person: 'Person',
  event: 'Event',
  property: 'Property',
  thing: 'Thing',
  recipe: 'Recipe',
  pet: 'Pet',
};

export function SuggestedLinksPanel({
  content,
  sourceId,
  sourceType,
  familyId,
}: SuggestedLinksPanelProps) {
  const { track } = useAnalyticsContext();
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const { data: suggestions = [], isLoading } = useEntitySuggestions(
    content,
    familyId,
    content.length > 10
  );

  const { data: existingLinks = [] } = useEntityLinks(sourceId, sourceType);
  const createLink = useCreateEntityLink();
  const deleteLink = useDeleteEntityLink();

  const linkedEntityIds = new Set(existingLinks.map((link) => link.entity_id));

  const handleCreateLink = async (suggestion: EntitySuggestion) => {
    await createLink.mutateAsync({
      sourceId,
      sourceType,
      entityId: suggestion.entity_id,
      entityType: suggestion.entity_type,
      familyId,
    });

      track({
        event_name: 'entity_link_created',
        properties: {
          source_type: sourceType,
          entity_type: suggestion.entity_type,
          match_score: suggestion.match_score,
        },
      });
    };

    const handleDeleteLink = async (linkId: string, entityType: string) => {
      await deleteLink.mutateAsync(linkId);

      track({
        event_name: 'entity_link_removed',
        properties: {
          source_type: sourceType,
          entity_type: entityType,
        },
      });
    };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5" />
            Suggested Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Analyzing content...</p>
        </CardContent>
      </Card>
    );
  }

  const filteredSuggestions = suggestions.filter(
    (s) => !linkedEntityIds.has(s.entity_id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="w-5 h-5" />
          Suggested Links
          {filteredSuggestions.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {filteredSuggestions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {existingLinks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Current Links</h4>
            <div className="space-y-2">
              {existingLinks.map((link) => {
                const Icon = entityIcons[link.entity_type as keyof typeof entityIcons];
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {entityLabels[link.entity_type as keyof typeof entityLabels]}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id, link.entity_type)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredSuggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No suggestions available. Add more details to see relevant links.
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => {
                const Icon =
                  entityIcons[suggestion.entity_type as keyof typeof entityIcons];
                const isExpanded = expandedSuggestion === suggestion.entity_id;

                return (
                  <div
                    key={suggestion.entity_id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">
                            {suggestion.entity_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {entityLabels[suggestion.entity_type as keyof typeof entityLabels]}
                          </Badge>
                        </div>

                        {suggestion.match_reason && (
                          <button
                            onClick={() =>
                              setExpandedSuggestion(
                                isExpanded ? null : suggestion.entity_id
                              )
                            }
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? 'Hide' : 'Show'} match reason
                          </button>
                        )}

                        {isExpanded && suggestion.match_reason && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              {suggestion.match_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleCreateLink(suggestion)}
                        disabled={createLink.isPending}
                      >
                        Link
                      </Button>
                    </div>

                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${suggestion.match_score * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(suggestion.match_score * 100)}% match
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
