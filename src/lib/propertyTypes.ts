export type PropertyType = 'house' | 'flat' | 'land' | 'other'
export type PropertyStatus = 'current' | 'past' | 'rental' | 'for_sale' | 'archived'
export type PropertyTenure = 'freehold' | 'leasehold' | 'other'
export type DocumentType = 'deed' | 'mortgage' | 'survey' | 'epc' | 'warranty' | 'manual' | 'planning' | 'other'

export interface Property {
  id: string
  family_id: string
  created_by: string
  
  // Identity
  title: string
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  
  // Geolocation
  geocode_lat?: number
  geocode_lng?: number
  
  // Property details
  type?: PropertyType
  status: PropertyStatus
  purchase_date?: string
  sale_date?: string
  tenure?: PropertyTenure
  bedrooms?: number
  bathrooms?: number
  area_sq_m?: number
  year_built?: number
  epc_rating?: string
  council_hoa?: string
  parking?: string
  
  // Insurance & maintenance
  insurance_provider?: string
  insurance_renewal_at?: string
  notes?: string
  
  // Media
  cover_media_id?: string
  cover_url?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface PropertyReminder {
  id: string
  property_id: string
  family_id: string
  type: string
  title: string
  due_at: string
  completed_at?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PropertyDocument {
  id: string
  property_id: string
  family_id: string
  title: string
  file_id?: string
  file_path?: string
  doc_type?: DocumentType
  issued_at?: string
  expires_at?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface PropertyWithStats extends Property {
  story_count?: number
  last_memory_date?: string
  has_upcoming_reminders?: boolean
  has_documents?: boolean
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'flat', label: 'Flat/Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
]

export const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'current', label: 'Current' },
  { value: 'past', label: 'Past Home' },
  { value: 'rental', label: 'Rental' },
  { value: 'for_sale', label: 'For Sale' },
  { value: 'archived', label: 'Archived' },
]

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'deed', label: 'Deed' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'survey', label: 'Survey' },
  { value: 'epc', label: 'EPC' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'manual', label: 'Manual' },
  { value: 'planning', label: 'Planning Permission' },
  { value: 'other', label: 'Other' },
]
