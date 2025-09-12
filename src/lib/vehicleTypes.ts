// Vehicle-specific types for the Objects flow

export type VehicleType = 'car' | 'motorbike' | 'bicycle' | 'boat' | 'caravan' | 'trailer'

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'ev' | 'other'

export type TransmissionType = 'manual' | 'auto' | 'cvt' | 'other'

export type DriveType = 'fwd' | 'rwd' | 'awd' | '4x4' | 'na'

export type VehicleStatus = 'on-road' | 'off-road' | 'sold' | 'loaned'

export type OdometerUnit = 'mi' | 'km' | 'hours'

export interface VehicleIdentifiers {
  plate?: {
    number?: string
    country?: string
  }
  vinOrSerial?: string // VIN / frame / hull / CRiS / serial
}

export interface VehicleSpecs {
  type: VehicleType
  make?: string
  model?: string
  variant?: string
  year?: string
  color?: string
  fuel?: FuelType
  transmission?: TransmissionType
  drive?: DriveType
}

export interface VehicleMetrics {
  odometer?: {
    value?: number
    unit?: OdometerUnit
  }
  engineCc?: number
  powerKw?: number
  batteryKwh?: number // EV
  chargeConnector?: string
  tyres?: string // e.g., 205/55 R16
}

export interface VehicleOwnership {
  ownershipStart?: string
  ownershipEnd?: string
  primaryDriver?: string // person ID
  custodian?: string // person ID
}

export interface VehicleDocuments {
  logbookUrl?: string
  insuranceUrl?: string
  serviceBookUrls?: string[]
  inspectionCertUrl?: string
  taxReceiptUrl?: string
}

export interface VehicleMaintenance {
  lastServiceDate?: string
  lastServiceOdo?: number
  intervalMiles?: number
  intervalMonths?: number
  nextServiceDate?: string
  nextServiceOdo?: number
  tyreSize?: string
  oilType?: string
  batteryType?: string
}

export interface VehicleReminders {
  inspectionDue?: string // MOT/annual inspection
  insuranceRenewal?: string
  taxDue?: string
  warrantyEnd?: string
}

export interface VehicleLocation {
  propertyId?: string
  roomOrSpace?: string
}

export interface VehicleData {
  // Basic specs
  specs: VehicleSpecs
  
  // Identifiers & registration
  identifiers: VehicleIdentifiers
  
  // Ownership
  ownership: VehicleOwnership
  
  // Metrics & measurements
  metrics: VehicleMetrics
  
  // Documents
  documents: VehicleDocuments
  
  // Maintenance
  maintenance: VehicleMaintenance
  
  // Reminders
  reminders: VehicleReminders
  
  // Location
  location: VehicleLocation
  
  // Status & accessories
  status?: VehicleStatus
  accessories?: string[] // roof rack, charger, towbar, etc.
}

// Form data for the wizard
export interface VehicleFormData {
  // Step 1 - Basics
  title: string
  vehicleData: VehicleData
  visibility: 'family' | 'branch' | 'private'
  
  // Step 2 - Identifiers & Ownership
  // (covered in vehicleData)
  
  // Step 3 - Photos & Docs
  photos: VehiclePhoto[]
  documents: VehicleDocument[]
  
  // Step 4 - Maintenance & Location
  // (covered in vehicleData)
  
  // Step 5 - Review & Publish
  notes?: string
}

export interface VehiclePhoto {
  id: string
  file: File
  category: VehiclePhotoCategory
  caption?: string
  isCover: boolean
  order: number
  preview?: string
}

export type VehiclePhotoCategory = 
  | 'front' 
  | 'rear' 
  | 'side-left' 
  | 'side-right' 
  | 'interior' 
  | 'odometer' 
  | 'engine' 
  | 'keys' 
  | 'vin-plate' 
  | 'damage' 
  | 'extras'

export interface VehicleDocument {
  id: string
  file: File
  type: VehicleDocumentType
  name: string
  extractedFields?: Record<string, any>
}

export type VehicleDocumentType = 
  | 'logbook' 
  | 'insurance' 
  | 'service-history' 
  | 'inspection-cert' 
  | 'tax-receipt' 
  | 'warranty'

export interface AutosaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  message: string
}

// Wizard steps configuration
export const VEHICLE_WIZARD_STEPS = [
  { id: 1, title: '1. Basics', description: 'Type, make, model & specs' },
  { id: 2, title: '2. Identity & Ownership', description: 'Registration & owners' },
  { id: 3, title: '3. Photos & Documents', description: 'Capture & upload' },
  { id: 4, title: '4. Maintenance & Location', description: 'Service & storage' },
  { id: 5, title: '5. Review & Publish', description: 'Final review' }
] as const

export type VehicleWizardStep = typeof VEHICLE_WIZARD_STEPS[number]['id']

// Photo capture checklist
export const PHOTO_CHECKLIST: { category: VehiclePhotoCategory; label: string; required: boolean }[] = [
  { category: 'front', label: 'Front view', required: true },
  { category: 'rear', label: 'Rear view', required: true },
  { category: 'side-left', label: 'Left side', required: true },
  { category: 'side-right', label: 'Right side', required: true },
  { category: 'interior', label: 'Interior', required: false },
  { category: 'odometer', label: 'Odometer/Hours', required: false },
  { category: 'engine', label: 'Engine bay', required: false },
  { category: 'keys', label: 'Keys', required: false },
  { category: 'vin-plate', label: 'VIN plate', required: false },
  { category: 'damage', label: 'Any damage', required: false },
  { category: 'extras', label: 'Extras (towbar, roof box)', required: false }
]

// Vehicle type options
export const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'car', label: 'Car', icon: 'Car' },
  { value: 'motorbike', label: 'Motorbike', icon: 'Bike' },
  { value: 'bicycle', label: 'Bicycle', icon: 'Bike' },
  { value: 'boat', label: 'Boat', icon: 'Ship' },
  { value: 'caravan', label: 'Caravan/Motorhome', icon: 'Truck' },
  { value: 'trailer', label: 'Trailer', icon: 'Truck' }
]