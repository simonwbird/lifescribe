import { MoreHorizontal, Eye, Share2, MessageSquare, Users, MapPin, Calendar, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import type { SearchResult } from '@/lib/searchService'

interface SearchResultItemProps {
  result: SearchResult
  onResultClick?: () => void
}

export default function SearchResultItem({ result, onResultClick }: SearchResultItemProps) {
  const handleClick = () => {
    onResultClick?.()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar/Thumbnail */}
          {result.image && (
            <div className="shrink-0">
              {result.type === 'person' ? (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={result.image} alt={result.title} />
                  <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <img
                  src={result.image}
                  alt={result.title}
                  className="h-12 w-12 object-cover rounded"
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={result.url}
                  onClick={handleClick}
                  className="block group-hover:text-primary transition-colors"
                >
                  <h3 className="font-semibold truncate">{result.title}</h3>
                  {result.subtitle && (
                    <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                  )}
                  {result.snippet && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {result.snippet}
                    </p>
                  )}
                </Link>

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {result.metadata.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(result.metadata.date)}
                    </div>
                  )}
                  
                  {result.metadata.people && result.metadata.people.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {result.metadata.people.slice(0, 2).join(', ')}
                      {result.metadata.people.length > 2 && ` +${result.metadata.people.length - 2}`}
                    </div>
                  )}
                  
                  {result.metadata.places && result.metadata.places.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {result.metadata.places[0]}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {result.metadata.tags && result.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.metadata.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs h-5">
                        {tag}
                      </Badge>
                    ))}
                    {result.metadata.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        +{result.metadata.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={result.url} onClick={handleClick}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add note
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Link people
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}