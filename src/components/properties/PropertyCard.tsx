import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Home, 
  Users,
  FileText,
  Package,
  Camera,
  MoreHorizontal, 
  Eye, 
  Edit, 
  Share2,
  MapPin
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PropertyWithDetails } from '@/lib/propertyTypes'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from '@/lib/propertyTypes'
import { PropertyService } from '@/lib/propertyService'

interface PropertyCardProps {
  property: PropertyWithDetails
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showSelection?: boolean
}

export default function PropertyCard({ 
  property, 
  isSelected = false, 
  onSelect, 
  showSelection = false 
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getPropertyTypeIcon = () => {
    const primaryType = property.property_types[0]
    switch (primaryType) {
      case 'house':
      case 'cottage':
      case 'villa':
      case 'bungalow':
        return <Home className="h-4 w-4" />
      case 'apartment':
      case 'studio':
      case 'loft':
        return <Home className="h-4 w-4" />
      case 'boat':
      case 'houseboat':
        return <Home className="h-4 w-4" />
      default:
        return <Home className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    const status = property.status
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'sold':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'rented':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'demolished':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).getFullYear()
    } catch {
      return dateStr
    }
  }

  const displayAddress = PropertyService.formatAddress(property)
  const primaryType = property.property_types[0]
  const typeLabel = primaryType ? PROPERTY_TYPE_LABELS[primaryType] : 'Property'
  const statusLabel = PROPERTY_STATUS_LABELS[property.status]

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(property.id, checked === true)}
            className={`bg-background border-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          />
        </div>
      )}

      {/* Cover image placeholder */}
      <div className="h-32 bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center relative">
        {property.cover_media_id ? (
          <img 
            src={`/api/media/${property.cover_media_id}`}
            alt={`${property.display_title} cover`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground">
            {getPropertyTypeIcon()}
          </div>
        )}
        
        {/* Property type icon overlay */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {getPropertyTypeIcon()}
            <span className="ml-1">{typeLabel}</span>
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate" title={property.display_title}>
              {property.display_title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getTypeColor()}>
                {statusLabel}
              </Badge>
              {property.built_year && (
                <span className="text-xs text-muted-foreground">
                  Built {property.built_year_circa ? '~' : ''}{property.built_year}
                </span>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/properties/${property.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Address */}
        {displayAddress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{displayAddress}</span>
          </div>
        )}

        {/* People who lived here */}
        {property.occupancy && property.occupancy.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <div className="flex -space-x-1">
              {property.occupancy.slice(0, 3).map((occ) => (
                <Avatar key={occ.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={occ.people?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {occ.people?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {property.occupancy.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{property.occupancy.length - 3}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {property.occupancy.length} {property.occupancy.length === 1 ? 'person' : 'people'}
            </span>
          </div>
        )}

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {property.story_count ? (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{property.story_count}</span>
            </div>
          ) : null}
          {property.object_count ? (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{property.object_count}</span>
            </div>
          ) : null}
          {property.media_count ? (
            <div className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              <span>{property.media_count}</span>
            </div>
          ) : null}
        </div>

        {/* Tags */}
        {property.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {property.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{property.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {property.first_known_date ? `From ${formatDate(property.first_known_date)}` : 'Added recently'}
            </span>
            <span>{formatDate(property.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}