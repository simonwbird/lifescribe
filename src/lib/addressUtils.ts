import type { Property } from './propertyTypes'

export function computeDisplayAddress(property: Property): string {
  const parts = [
    property.address_line1,
    property.address_line2,
    property.city,
    property.state_province,
    property.postal_code,
    property.country,
  ].filter(Boolean)

  return parts.join(', ')
}

export function getStaticMapUrl(
  lat: number,
  lng: number,
  width: number = 600,
  height: number = 400,
  zoom: number = 14
): string {
  // Note: In production, the Mapbox token should be stored as a Supabase Edge Function secret
  // For now, using a placeholder that needs to be replaced
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN'
  
  // Mapbox Static Images API
  // https://docs.mapbox.com/api/maps/static-images/
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+3b82f6(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${mapboxToken}`
}

export function hasValidGeocode(property: Property): boolean {
  return !!(
    property.geocode_lat &&
    property.geocode_lng &&
    !isNaN(property.geocode_lat) &&
    !isNaN(property.geocode_lng)
  )
}
