// Property types for LifeScribe Properties Collection

export type PropertyType = 
  | 'house' | 'apartment' | 'townhouse' | 'cottage' | 'villa' | 'holiday_home' 
  | 'farm' | 'ranch' | 'student_housing' | 'military_housing' | 'multi_unit' 
  | 'caravan' | 'motorhome' | 'houseboat' | 'boat' | 'bungalow' | 'duplex' 
  | 'terrace' | 'loft' | 'studio' | 'retirement_home' | 'boarding_house' 
  | 'ancestral_home' | 'business_premises' | 'land' | 'other'

export type AddressVisibility = 'exact' | 'street_hidden' | 'city_only'
export type PropertyStatus = 'current' | 'sold' | 'rented' | 'demolished' | 'unknown'
export type OccupancyRole = 'owner' | 'tenant' | 'child' | 'guest' | 'host' | 'relative' | 'roommate'
export type VisitOccasion = 'holiday' | 'celebration' | 'reunion' | 'other'
export type PropertyEventType = 
  | 'moved_in' | 'moved_out' | 'purchase' | 'sale' | 'renovation' | 'extension' 
  | 'garden_change' | 'birth' | 'party' | 'storm' | 'flood' | 'fire' | 'holiday' 
  | 'photo_taken' | 'other'

export type PropertyMediaRole = 
  | 'cover' | 'then' | 'now' | 'floorplan' | 'deed' | 'mortgage' | 'survey' 
  | 'letter' | 'bill' | 'receipt' | 'newspaper_clipping' | 'general'

export interface PropertyAddress {
  line1?: string
  line2?: string
  city?: string
  region?: string
  postcode?: string
  country?: string
}

export interface PropertyGeocode {
  lat: number
  lng: number
}

export interface Property {
  id: string
  display_title: string
  property_types: PropertyType[]
  address_json?: PropertyAddress
  geocode?: PropertyGeocode
  address_visibility: AddressVisibility
  map_visibility: boolean
  built_year?: number
  built_year_circa: boolean
  first_known_date?: string
  first_known_circa: boolean
  last_known_date?: string
  last_known_circa: boolean
  status: PropertyStatus
  tags: string[]
  description?: string
  cover_media_id?: string
  family_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface PropertyOccupancy {
  id: string
  property_id: string
  person_id: string
  role: OccupancyRole
  start_date?: string
  start_date_circa: boolean
  end_date?: string
  end_date_circa: boolean
  primary_home: boolean
  notes?: string
  family_id: string
  created_at: string
  people?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export interface PropertyVisit {
  id: string
  property_id: string
  people_ids: string[]
  start_date?: string
  end_date?: string
  recurring_pattern?: string
  occasion: VisitOccasion
  notes?: string
  family_id: string
  created_by: string
  created_at: string
}

export interface PropertyEvent {
  id: string
  property_id: string
  event_type: PropertyEventType
  event_date?: string
  event_date_circa: boolean
  title: string
  notes?: string
  media_ids: string[]
  story_id?: string
  people_ids: string[]
  family_id: string
  created_by: string
  created_at: string
}

export interface PropertyRoom {
  id: string
  property_id: string
  name: string
  notes?: string
  family_id: string
  created_by: string
  created_at: string
}

export interface PropertyWithDetails extends Property {
  occupancy?: PropertyOccupancy[]
  visits?: PropertyVisit[]
  events?: PropertyEvent[]
  rooms?: PropertyRoom[]
  media_count?: number
  story_count?: number
  object_count?: number
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: 'House',
  apartment: 'Apartment',
  townhouse: 'Townhouse', 
  cottage: 'Cottage/Cabin',
  villa: 'Villa/Chalet',
  holiday_home: 'Holiday Home',
  farm: 'Farm/Smallholding',
  ranch: 'Ranch',
  student_housing: 'Student Housing',
  military_housing: 'Military Housing',
  multi_unit: 'Multi-unit Building',
  caravan: 'Caravan/Mobile Home',
  motorhome: 'Motorhome/RV',
  houseboat: 'Houseboat',
  boat: 'Boat',
  bungalow: 'Bungalow',
  duplex: 'Duplex',
  terrace: 'Terrace/Row House',
  loft: 'Loft',
  studio: 'Studio',
  retirement_home: 'Retirement Home',
  boarding_house: 'Boarding House',
  ancestral_home: 'Ancestral Home',
  business_premises: 'Business/Shop',
  land: 'Land/Plot',
  other: 'Other'
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  current: 'Current',
  sold: 'Sold',
  rented: 'Rented',
  demolished: 'Demolished',
  unknown: 'Unknown'
}

export const OCCUPANCY_ROLE_LABELS: Record<OccupancyRole, string> = {
  owner: 'Owner',
  tenant: 'Tenant',
  child: 'Child',
  guest: 'Guest', 
  host: 'Host',
  relative: 'Relative',
  roommate: 'Roommate'
}

export const EVENT_TYPE_LABELS: Record<PropertyEventType, string> = {
  moved_in: 'Moved In',
  moved_out: 'Moved Out',
  purchase: 'Purchase',
  sale: 'Sale',
  renovation: 'Renovation',
  extension: 'Extension',
  garden_change: 'Garden Change',
  birth: 'Birth',
  party: 'Party',
  storm: 'Storm',
  flood: 'Flood',
  fire: 'Fire',
  holiday: 'Holiday',
  photo_taken: 'Photo Taken',
  other: 'Other'
}