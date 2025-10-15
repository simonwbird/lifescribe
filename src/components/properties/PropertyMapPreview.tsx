import { MapPin } from 'lucide-react'
import { getStaticMapUrl, hasValidGeocode } from '@/lib/addressUtils'
import type { Property } from '@/lib/propertyTypes'

interface PropertyMapPreviewProps {
  property: Property
  className?: string
}

export function PropertyMapPreview({ property, className = '' }: PropertyMapPreviewProps) {
  if (!hasValidGeocode(property)) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground p-8">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No location set</p>
        </div>
      </div>
    )
  }

  const mapUrl = getStaticMapUrl(
    property.geocode_lat!,
    property.geocode_lng!,
    800,
    600,
    15
  )

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <img
        src={mapUrl}
        alt={`Map of ${property.title}`}
        className="w-full h-full object-cover"
      />
    </div>
  )
}
