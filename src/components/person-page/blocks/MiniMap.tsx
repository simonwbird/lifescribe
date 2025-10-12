import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map, MapPin, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Place {
  id: string
  name: string
  place_type: string
  latitude?: number
  longitude?: number
}

interface MiniMapProps {
  personId: string
  familyId: string
}

// Lazy load the actual map component
const MapView = lazy(() => import('./MiniMapView'))

export function MiniMap({ personId, familyId }: MiniMapProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlaces()
  }, [personId])

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('id, name, place_type, latitude, longitude')
        .eq('family_id', familyId)
        .or(`person_id.eq.${personId},created_by.eq.${personId}`)
        .limit(6)

      if (error) throw error

      // Filter to key place types
      const keyPlaces = (data || []).filter(place => 
        ['birth', 'home', 'school', 'burial', 'residence', 'workplace'].includes(place.place_type?.toLowerCase() || '')
      )

      setPlaces(keyPlaces.slice(0, 6))
    } catch (error) {
      console.error('Error fetching places:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceClick = (placeId: string) => {
    toast({
      title: "Place navigation",
      description: "Place page navigation coming soon"
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Map className="h-4 w-4" />
            Places Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (places.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Map className="h-4 w-4" />
          Places Map
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {places.length} {places.length === 1 ? 'place' : 'places'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!showMap ? (
          <div 
            className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={() => setShowMap(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setShowMap(true)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Load map"
          >
            <Map className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to view map</p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          }>
            <MapView places={places} onPlaceClick={handlePlaceClick} />
          </Suspense>
        )}

        {/* Place list */}
        <div className="space-y-2">
          {places.map((place) => (
            <button
              key={place.id}
              onClick={() => handlePlaceClick(place.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePlaceClick(place.id)
                }
              }}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-left group"
              aria-label={`View ${place.name}`}
            >
              <MapPin className="h-3 w-3 text-muted-foreground group-hover:text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{place.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {place.place_type || 'Place'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
