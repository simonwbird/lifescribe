import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Place {
  id: string
  name: string
  place_type: string
  latitude?: number
  longitude?: number
}

interface MiniMapViewProps {
  places: Place[]
  onPlaceClick: (placeId: string) => void
}

export default function MiniMapView({ places, onPlaceClick }: MiniMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Use Mapbox public token
    const mapboxToken = 'pk.eyJ1Ijoic2ltb253YmlyZCIsImEiOiJjbWduYzczdHkwMG54MmtzY2UydnN3OHZ5In0.vj5fHWpjb7eU8d-a7vKENg'
    
    mapboxgl.accessToken = mapboxToken

    // Filter places with valid coordinates
    const validPlaces = places.filter(p => p.latitude && p.longitude)
    
    if (validPlaces.length === 0) {
      // Show placeholder if no valid coordinates
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No coordinates available for these places</div>'
      }
      return
    }

    // Calculate center and bounds
    const bounds = new mapboxgl.LngLatBounds()
    validPlaces.forEach(place => {
      if (place.longitude && place.latitude) {
        bounds.extend([place.longitude, place.latitude])
      }
    })

    const center = bounds.getCenter()

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [center.lng, center.lat],
      zoom: 10,
      interactive: true,
      attributionControl: false
    })

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
        showCompass: false
      }),
      'top-right'
    )

    // Fit bounds with padding
    map.current.fitBounds(bounds, {
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
      maxZoom: 13
    })

    // Add markers
    validPlaces.forEach((place) => {
      if (!place.latitude || !place.longitude) return

      const el = document.createElement('div')
      el.className = 'cursor-pointer hover:scale-110 transition-transform'
      el.innerHTML = `
        <div class="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `
      
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
      el.setAttribute('aria-label', `${place.name} - ${place.place_type}`)
      
      el.addEventListener('click', () => onPlaceClick(place.id))
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlaceClick(place.id)
        }
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setHTML(`
              <div class="text-xs">
                <p class="font-medium">${place.name}</p>
                <p class="text-muted-foreground capitalize">${place.place_type || 'Place'}</p>
              </div>
            `)
        )
        .addTo(map.current!)

      markers.current.push(marker)
    })

    // Cleanup
    return () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []
      map.current?.remove()
      map.current = null
    }
  }, [places, onPlaceClick])

  return (
    <div 
      ref={mapContainer} 
      className="aspect-video rounded-md overflow-hidden border"
      role="region"
      aria-label="Interactive map showing key places"
    />
  )
}
