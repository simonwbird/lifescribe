import { User, MapPin, FileText, Image, ChefHat, Heart, Home, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SearchSuggestion } from '@/lib/searchService'

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[]
  activeIndex: number
  onSuggestionClick: (suggestion: SearchSuggestion) => void
  onSeeAll: () => void
}

const getIcon = (iconName: string) => {
  const icons = {
    user: User,
    'map-pin': MapPin,
    'file-text': FileText,
    image: Image,
    'chef-hat': ChefHat,
    heart: Heart,
    home: Home,
    plus: Plus
  }
  return icons[iconName as keyof typeof icons] || FileText
}

const getTypeLabel = (type: string) => {
  const labels = {
    person: 'People',
    place: 'Places', 
    story: 'Stories',
    media: 'Media',
    collection: 'Collections',
    action: 'Actions'
  }
  return labels[type as keyof typeof labels] || type
}

export default function SearchSuggestions({
  suggestions,
  activeIndex,
  onSuggestionClick,
  onSeeAll
}: SearchSuggestionsProps) {
  // Group suggestions by type
  const grouped = suggestions.reduce((acc, suggestion, index) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = []
    }
    acc[suggestion.type].push({ ...suggestion, originalIndex: index })
    return acc
  }, {} as Record<string, (SearchSuggestion & { originalIndex: number })[]>)

  return (
    <div 
      id="search-suggestions"
      className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
      role="listbox"
    >
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="border-b border-border last:border-b-0">
          {/* Group header */}
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
            {getTypeLabel(type)}
          </div>
          
          {/* Group items */}
          <div className="py-1">
            {items.map((suggestion) => {
              const Icon = getIcon(suggestion.icon)
              const isActive = activeIndex === suggestion.originalIndex
              
              return (
                <button
                  key={suggestion.id}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-accent transition-colors",
                    isActive && "bg-accent"
                  )}
                  onClick={() => onSuggestionClick(suggestion)}
                  role="option"
                  aria-selected={isActive}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{suggestion.title}</div>
                    {suggestion.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">{suggestion.subtitle}</div>
                    )}
                  </div>
                </button>
              )
            })}
            
            {/* See all for each group */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-3 py-2 h-auto text-xs text-muted-foreground"
              onClick={onSeeAll}
            >
              See all {getTypeLabel(type).toLowerCase()}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
      
      {/* Global see all results */}
      <div className="p-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
          onClick={onSeeAll}
        >
          <ArrowRight className="h-3 w-3" />
          See all results
        </Button>
      </div>
    </div>
  )
}