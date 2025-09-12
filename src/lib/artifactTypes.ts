// Unified artifact system for all family objects

export type Visibility = 'family' | 'branch' | 'private'
export type Condition = 'excellent' | 'good' | 'fair' | 'poor'

export type Field =
  | { kind: 'text'; id: string; label: string; required?: boolean; help?: string }
  | { kind: 'textarea'; id: string; label: string; required?: boolean }
  | { kind: 'number'; id: string; label: string; unit?: string; required?: boolean }
  | { kind: 'select'; id: string; label: string; options: string[]; allowCustom?: boolean; required?: boolean }
  | { kind: 'chips'; id: string; label: string; options?: string[]; required?: boolean }
  | { kind: 'date'; id: string; label: string; approximate?: boolean; required?: boolean }
  | { kind: 'ocr'; id: string; label: string; source: 'scan' | 'photo'; targetFields: string[] }
  | { kind: 'dimensions'; id: string; label: string; units: ('mm' | 'cm' | 'in')[]; required?: boolean }
  | { kind: 'money'; id: string; label: string; currency?: string; private?: boolean; required?: boolean }
  | { kind: 'relation'; id: string; label: string; to: 'people' | 'property' | 'objects'; roleOptions?: string[]; required?: boolean }

export type CategorySpec = {
  id: string
  label: string
  icon: string // Lucide icon name
  description: string
  group: string
  steps: Array<{ 
    id: string
    title: string
    description?: string
    fields: Field[] 
  }>
}

export type ArtifactBase = {
  id: string
  category: string
  title: string
  description?: string
  occurredYear?: string
  origin?: string
  condition?: Condition
  peopleIds: string[]
  propertyId?: string
  room?: string
  tags: string[]
  media: { url: string; alt?: string; kind: 'photo' | 'scan' | 'model3d' }[]
  coverUrl?: string
  provenance?: { holder: string; from?: string; to?: string; note?: string }[]
  visibility: Visibility
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  familyId: string
  createdBy: string
  categorySpecific: Record<string, unknown>
}

// Vehicle remains specialized but fits into the system
export type VehicleArtifact = ArtifactBase & {
  category: 'vehicle'
  vehicle: {
    type: 'car' | 'motorbike' | 'bicycle' | 'boat' | 'caravan' | 'trailer'
    make?: string
    model?: string
    variant?: string
    year?: string
    color?: string
    fuel?: 'petrol' | 'diesel' | 'hybrid' | 'ev' | 'other'
    transmission?: 'manual' | 'auto' | 'cvt' | 'other'
    drive?: 'fwd' | 'rwd' | 'awd' | '4x4' | 'na'
    plate?: { number?: string; country?: string }
    vinOrSerial?: string
    odometer?: { value?: number; unit?: 'mi' | 'km' | 'hours' }
    engineCc?: number
    powerKw?: number
    batteryKwh?: number
    chargeConnector?: string
    tyres?: string
    docs?: {
      logbookUrl?: string
      insuranceUrl?: string
      serviceBookUrls?: string[]
      inspectionCertUrl?: string
      taxReceiptUrl?: string
    }
    maintenance?: {
      lastServiceDate?: string
      lastServiceOdo?: number
      intervalMiles?: number
      intervalMonths?: number
      nextServiceDate?: string
      nextServiceOdo?: number
    }
    reminders?: {
      inspectionDue?: string
      insuranceRenewal?: string
      taxDue?: string
      warrantyEnd?: string
    }
    status?: 'on-road' | 'off-road' | 'sold' | 'loaned'
    accessories?: string[]
  }
}

export type Artifact = ArtifactBase | VehicleArtifact

export const OBJECT_CATEGORY_GROUPS = {
  'Documents & Records': 'FileText',
  'Personal & Clothing': 'Shirt', 
  'Art & Craft': 'Palette',
  'Books & Media': 'Book',
  'Home & Kitchen': 'Home',
  'Toys & Recreation': 'Gamepad2',
  'Technology': 'Smartphone',
  'Collections': 'Coins',
  'Transportation': 'Car',
  'Special Categories': 'Star'
} as const

export const OBJECT_CATEGORY_SPECS: CategorySpec[] = [
  // Documents & Records
  {
    id: 'identity-docs',
    label: 'Identity & Documents',
    icon: 'FileText',
    description: 'Birth certificates, passports, licenses, official papers',
    group: 'Documents & Records',
    steps: [
      {
        id: 'basics',
        title: 'Document Details',
        fields: [
          { kind: 'select', id: 'docType', label: 'Document Type', options: ['Birth Certificate', 'Passport', 'Driver License', 'Marriage Certificate', 'Diploma', 'Other'], required: true },
          { kind: 'text', id: 'issuingAuthority', label: 'Issuing Authority' },
          { kind: 'text', id: 'documentNumber', label: 'Document/ID Number' },
          { kind: 'date', id: 'issueDate', label: 'Issue Date', approximate: true },
          { kind: 'date', id: 'expiryDate', label: 'Expiry Date' },
          { kind: 'text', id: 'placeIssued', label: 'Place Issued' }
        ]
      }
    ]
  },
  {
    id: 'letters-diaries',
    label: 'Letters & Diaries',
    icon: 'Mail',
    description: 'Personal correspondence, journals, diaries',
    group: 'Documents & Records',
    steps: [
      {
        id: 'basics',
        title: 'Letter/Diary Details',
        fields: [
          { kind: 'select', id: 'type', label: 'Type', options: ['Letter', 'Diary', 'Journal', 'Postcard', 'Telegram', 'Other'] },
          { kind: 'text', id: 'author', label: 'Author/Writer' },
          { kind: 'text', id: 'recipient', label: 'Recipient' },
          { kind: 'date', id: 'writtenDate', label: 'Date Written', approximate: true },
          { kind: 'text', id: 'location', label: 'Written From' },
          { kind: 'ocr', id: 'transcription', label: 'Extract Text', source: 'scan', targetFields: ['content'] }
        ]
      }
    ]
  },

  // Personal & Clothing
  {
    id: 'jewelry',
    label: 'Jewelry',
    icon: 'Gem',
    description: 'Rings, necklaces, watches, precious items',
    group: 'Personal & Clothing',
    steps: [
      {
        id: 'basics',
        title: 'Jewelry Details',
        fields: [
          { kind: 'select', id: 'type', label: 'Type', options: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Watch', 'Brooch', 'Cufflinks', 'Other'] },
          { kind: 'chips', id: 'materials', label: 'Materials', options: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Ruby', 'Sapphire', 'Emerald'] },
          { kind: 'text', id: 'hallmarks', label: 'Hallmarks/Stamps' },
          { kind: 'text', id: 'size', label: 'Size' },
          { kind: 'money', id: 'appraisalValue', label: 'Appraised Value', private: true },
          { kind: 'textarea', id: 'careInstructions', label: 'Care Instructions' }
        ]
      }
    ]
  },
  {
    id: 'clothing-textiles',
    label: 'Clothing & Textiles',
    icon: 'Shirt',
    description: 'Clothing, fabrics, quilts, uniforms',
    group: 'Personal & Clothing',
    steps: [
      {
        id: 'basics',
        title: 'Clothing Details',
        fields: [
          { kind: 'select', id: 'type', label: 'Type', options: ['Dress', 'Suit', 'Uniform', 'Quilt', 'Fabric', 'Hat', 'Shoes', 'Accessories', 'Other'] },
          { kind: 'text', id: 'size', label: 'Size' },
          { kind: 'chips', id: 'materials', label: 'Materials/Fiber', options: ['Cotton', 'Wool', 'Silk', 'Linen', 'Polyester', 'Leather'] },
          { kind: 'text', id: 'maker', label: 'Maker/Brand' },
          { kind: 'text', id: 'pattern', label: 'Pattern/Style' },
          { kind: 'textarea', id: 'careInstructions', label: 'Care Instructions' }
        ]
      }
    ]
  },

  // Art & Craft
  {
    id: 'art-craft',
    label: 'Art & Craft',
    icon: 'Palette',
    description: 'Paintings, sculptures, handmade items, decorative objects',
    group: 'Art & Craft',
    steps: [
      {
        id: 'basics',
        title: 'Artwork Details',
        fields: [
          { kind: 'text', id: 'artist', label: 'Artist/Maker' },
          { kind: 'select', id: 'medium', label: 'Medium', options: ['Oil Paint', 'Watercolor', 'Acrylic', 'Pencil', 'Ink', 'Sculpture', 'Pottery', 'Textile', 'Mixed Media', 'Other'] },
          { kind: 'dimensions', id: 'dimensions', label: 'Dimensions', units: ['cm', 'in'] },
          { kind: 'text', id: 'signature', label: 'Signature/Mark' },
          { kind: 'text', id: 'frame', label: 'Frame Description' },
          { kind: 'text', id: 'edition', label: 'Edition Number' }
        ]
      }
    ]
  },

  // Books & Media
  {
    id: 'books',
    label: 'Books & Printed',
    icon: 'Book',
    description: 'Books, magazines, newspapers, printed materials',
    group: 'Books & Media',
    steps: [
      {
        id: 'basics',
        title: 'Book Details',
        fields: [
          { kind: 'text', id: 'author', label: 'Author' },
          { kind: 'text', id: 'publisher', label: 'Publisher' },
          { kind: 'number', id: 'year', label: 'Publication Year' },
          { kind: 'text', id: 'isbn', label: 'ISBN' },
          { kind: 'text', id: 'edition', label: 'Edition' },
          { kind: 'textarea', id: 'inscriptions', label: 'Inscriptions/Notes' },
          { kind: 'ocr', id: 'extractText', label: 'Extract Text', source: 'scan', targetFields: ['inscriptions'] }
        ]
      }
    ]
  },
  {
    id: 'photos-media',
    label: 'Photos & Media',
    icon: 'Camera',
    description: 'Photographs, film, audio recordings, digital media',
    group: 'Books & Media',
    steps: [
      {
        id: 'basics',
        title: 'Media Details',
        fields: [
          { kind: 'select', id: 'format', label: 'Format', options: ['Print Photo', 'Negative', 'Slide', '8mm Film', 'VHS', 'Cassette', 'Vinyl Record', 'CD', 'Digital', 'Other'] },
          { kind: 'textarea', id: 'subjects', label: 'Subjects/People' },
          { kind: 'date', id: 'dateTaken', label: 'Date Taken/Recorded', approximate: true },
          { kind: 'text', id: 'location', label: 'Location' },
          { kind: 'select', id: 'digitizationStatus', label: 'Digitization Status', options: ['Not Digitized', 'Digitized', 'Digital Original'] }
        ]
      }
    ]
  },

  // Home & Kitchen
  {
    id: 'kitchen-dining',
    label: 'Kitchen & Dining',
    icon: 'ChefHat',
    description: 'China, silverware, cooking utensils, appliances',
    group: 'Home & Kitchen',
    steps: [
      {
        id: 'basics',
        title: 'Kitchen Item Details',
        fields: [
          { kind: 'select', id: 'type', label: 'Type', options: ['China/Dishes', 'Silverware', 'Glassware', 'Cookware', 'Utensils', 'Appliance', 'Serving Pieces', 'Other'] },
          { kind: 'text', id: 'maker', label: 'Maker/Brand' },
          { kind: 'text', id: 'pattern', label: 'Pattern/Model' },
          { kind: 'chips', id: 'materials', label: 'Materials', options: ['Porcelain', 'China', 'Silver', 'Stainless Steel', 'Glass', 'Cast Iron', 'Copper'] },
          { kind: 'number', id: 'pieces', label: 'Number of Pieces' }
        ]
      }
    ]
  },

  // Transportation (Vehicle)
  {
    id: 'vehicle',
    label: 'Vehicles',
    icon: 'Car',
    description: 'Cars, motorcycles, bicycles, boats, trailers',
    group: 'Transportation',
    steps: [
      {
        id: 'basics',
        title: 'Vehicle Basics',
        fields: [
          { kind: 'select', id: 'type', label: 'Vehicle Type', options: ['Car', 'Motorbike', 'Bicycle', 'Boat', 'Caravan', 'Trailer'], required: true },
          { kind: 'text', id: 'make', label: 'Make' },
          { kind: 'text', id: 'model', label: 'Model' },
          { kind: 'text', id: 'year', label: 'Year' },
          { kind: 'text', id: 'color', label: 'Color' }
        ]
      }
    ]
  },

  // Special Categories
  {
    id: 'military-service',
    label: 'Military & Service',
    icon: 'Shield',
    description: 'Uniforms, medals, service records, military items',
    group: 'Special Categories',
    steps: [
      {
        id: 'basics',
        title: 'Military Item Details',
        fields: [
          { kind: 'select', id: 'branch', label: 'Service Branch', options: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Other'] },
          { kind: 'text', id: 'rank', label: 'Rank' },
          { kind: 'text', id: 'unit', label: 'Unit/Division' },
          { kind: 'text', id: 'theater', label: 'Theater/Campaign' },
          { kind: 'select', id: 'type', label: 'Item Type', options: ['Medal', 'Citation', 'Uniform', 'Equipment', 'Documents', 'Photos', 'Other'] },
          { kind: 'date', id: 'serviceStart', label: 'Service Start', approximate: true },
          { kind: 'date', id: 'serviceEnd', label: 'Service End', approximate: true }
        ]
      }
    ]
  },
  {
    id: 'custom-mystery',
    label: 'Custom/Mystery',
    icon: 'HelpCircle',
    description: 'Unknown items or custom categories',
    group: 'Special Categories',
    steps: [
      {
        id: 'basics',
        title: 'Mystery Item',
        fields: [
          { kind: 'textarea', id: 'whatIsThis', label: 'What might this be?' },
          { kind: 'textarea', id: 'whereFound', label: 'Where was it found?' },
          { kind: 'chips', id: 'materials', label: 'Materials (if known)' },
          { kind: 'dimensions', id: 'dimensions', label: 'Approximate Size', units: ['cm', 'in'] }
        ]
      }
    ]
  }
]

export function getCategorySpec(categoryId: string): CategorySpec | undefined {
  return OBJECT_CATEGORY_SPECS.find(spec => spec.id === categoryId)
}

export function getCategoriesByGroup(): Record<string, CategorySpec[]> {
  return OBJECT_CATEGORY_SPECS.reduce((acc, spec) => {
    if (!acc[spec.group]) {
      acc[spec.group] = []
    }
    acc[spec.group].push(spec)
    return acc
  }, {} as Record<string, CategorySpec[]>)
}