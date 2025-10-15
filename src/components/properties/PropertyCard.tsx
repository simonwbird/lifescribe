import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, FileText, Bell, Eye, PenLine, Home } from 'lucide-react'
import type { PropertyWithStats } from '@/lib/propertyTypes'
import { PROPERTY_STATUSES } from '@/lib/propertyTypes'
import { computeDisplayAddress, getStaticMapUrl, hasValidGeocode } from '@/lib/addressUtils'

interface PropertyCardProps {
  property: PropertyWithStats
}

export function PropertyCard({ property }: PropertyCardProps) {
  const statusLabel = PROPERTY_STATUSES.find(s => s.value === property.status)?.label || property.status
  const displayAddress = computeDisplayAddress(property)
  
  // Determine cover image or fallback to map
  const coverImage = property.cover_url || 
    (hasValidGeocode(property) 
      ? getStaticMapUrl(property.geocode_lat!, property.geocode_lng!, 600, 400, 15)
      : null)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image or Map */}
      <div className="aspect-video bg-muted relative">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted-foreground/5">
            <Home className="w-12 h-12" />
          </div>
        )}
        
        {/* Status Badge */}
        <Badge 
          className="absolute top-2 right-2"
          variant={property.status === 'current' ? 'default' : 'secondary'}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-serif text-h5 text-foreground mb-1">
            {property.display_title || property.name || property.title}
          </h3>
          {displayAddress && (
            <p className="text-body-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {displayAddress}
            </p>
          )}
        </div>

        {/* Quick Facts */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {property.year_built && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Built {property.year_built}
            </span>
          )}
          {property.bedrooms && (
            <span>{property.bedrooms} bed</span>
          )}
          {property.bathrooms && (
            <span>{property.bathrooms} bath</span>
          )}
          {property.last_memory_date && (
            <span className="text-primary">
              Last memory: {new Date(property.last_memory_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          {property.has_documents && (
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Docs
            </Badge>
          )}
          {property.has_upcoming_reminders && (
            <Badge variant="outline" className="text-xs text-warning">
              <Bell className="w-3 h-3 mr-1" />
              Upkeep Due
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/properties/${property.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/compose?type=story&propertyId=${property.id}`}>
              <PenLine className="w-4 h-4 mr-1" />
              Add Story
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}
