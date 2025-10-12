import { useEffect, useState } from 'react'
import MapView from './MiniMapView'
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

interface PersonLocation {
  birth_place?: string
  death_place?: string
}

interface MiniMapProps {
  personId: string
  familyId: string
}

// MapView imported directly

export function MiniMap({ personId, familyId }: MiniMapProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPlaces()
  }, [personId])

  const geocodeLocation = async (locationString: string): Promise<{ latitude: number, longitude: number } | null> => {
    if (!locationString) return null
    
    try {
      const mapboxToken = 'pk.eyJ1Ijoic2ltb253YmlyZCIsImEiOiJjbWduYzczdHkwMG54MmtzY2UydnN3OHZ5In0.vj5fHWpjb7eU8d-a7vKENg'
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationString)}.json?access_token=${mapboxToken}&limit=1`
      )
      
      if (!response.ok) return null
      
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center
        return { latitude, longitude }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    
    return null
  }

  const fetchPlaces = async () => {
    try {
      // Fetch person data for birth/death locations
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('birth_place, death_place, is_living')
        .eq('id', personId)
        .maybeSingle()

      if (personError) throw personError

      const allPlaces: Place[] = []

      // Add birth location if available
      if (personData?.birth_place) {
        const coords = await geocodeLocation(personData.birth_place)
        if (coords) {
          allPlaces.push({
            id: `birth-${personId}`,
            name: personData.birth_place,
            place_type: 'Birth',
            latitude: coords.latitude,
            longitude: coords.longitude
          })
        }
      }

      // Add death location if available
      if (personData?.death_place && !personData.is_living) {
        const coords = await geocodeLocation(personData.death_place)
        if (coords) {
          allPlaces.push({
            id: `death-${personId}`,
            name: personData.death_place,
            place_type: 'Death',
            latitude: coords.latitude,
            longitude: coords.longitude
          })
        }
      }

      setPlaces(allPlaces)
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
          <MapView places={places} onPlaceClick={handlePlaceClick} />
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
