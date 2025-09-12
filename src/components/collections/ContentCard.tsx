import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageViewer } from '@/components/ui/image-viewer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  ChefHat, 
  Package, 
  Home, 
  Heart,
  MoreHorizontal, 
  Eye, 
  Edit, 
  Share2,
  Calendar,
  MapPin,
  Users
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Content } from '@/lib/collectionsTypes'

interface ContentCardProps {
  content: Content
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showSelection?: boolean
}

export default function ContentCard({ 
  content, 
  isSelected = false, 
  onSelect, 
  showSelection = false 
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(getDetailUrl())
  }

  const getTypeIcon = () => {
    switch (content.type) {
      case 'story':
        return <FileText className="h-4 w-4" />
      case 'recipe':
        return <ChefHat className="h-4 w-4" />
      case 'pet':
        return <Heart className="h-4 w-4" />
      case 'object':
        return <Package className="h-4 w-4" />
      case 'property':
        return <Home className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (content.type) {
      case 'story':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'recipe':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'pet':
        return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'object':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'property':
        return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getEditUrl = () => {
    switch (content.type) {
      case 'story':
        return `/stories/${content.id}/edit`
      case 'recipe':
        return `/recipes/${content.id}/edit`
      case 'pet':
        return `/pets/${content.id}/edit`
      case 'object':
        return `/things/${content.id}/edit`
      case 'property':
        return `/properties/${content.id}/edit`
      default:
        return null
    }
  }

  const getDetailUrl = () => {
    switch (content.type) {
      case 'story':
        return `/stories/${content.id}`
      case 'recipe':
        return `/recipes/${content.id}`
      case 'pet':
        return `/pets/${content.id}`
      case 'object':
        return `/things/${content.id}`
      case 'property':
        return `/properties/${content.id}`
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(content.id, checked === true)}
            className={`bg-background border-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          />
        </div>
      )}

      {/* Cover image placeholder */}
      <div 
        className="h-32 bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center cursor-pointer group/image"
        onClick={() => content.coverUrl && setShowImageViewer(true)}
      >
        {content.coverUrl ? (
          <img 
            src={content.coverUrl} 
            alt={`${content.title} ${content.type} cover image`}
            className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = '/placeholder.svg'
            }}
          />
        ) : (
          <div className="text-muted-foreground">
            {getTypeIcon()}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate" title={content.title}>
              {content.title}
            </h3>
            <Badge variant="outline" className={`mt-1 ${getTypeColor()}`}>
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                {content.type}
              </span>
            </Badge>
          </div>

          {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem asChild>
                  <Link to={getDetailUrl()} onClick={(e) => e.stopPropagation()}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                {getEditUrl() ? (
                  <DropdownMenuItem asChild>
                    <Link to={getEditUrl()!} onClick={(e) => e.stopPropagation()}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit (Coming Soon)
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {content.occurredAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(content.occurredAt)}</span>
            </div>
          )}
          
          {content.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{content.location}</span>
            </div>
          )}
          
          {content.peopleIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>{content.peopleIds.length} people</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {content.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{content.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>by {content.authorName}</span>
            <span>{formatDate(content.addedAt)}</span>
          </div>
        </div>
      </CardContent>

      {/* Image Viewer Modal */}
      {content.coverUrl && (
        <ImageViewer
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={content.coverUrl}
          imageAlt={`${content.title} cover image`}
          title={content.title}
        />
      )}
    </Card>
  )
}