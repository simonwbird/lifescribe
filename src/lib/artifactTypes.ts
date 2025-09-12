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
        title: 'Basic Information',
        description: 'Tell us about this document',
        fields: [
          { kind: 'text', id: 'title', label: 'Document Name', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'docType', label: 'Document Type', options: ['Birth Certificate', 'Passport', 'Driver License', 'Marriage Certificate', 'Diploma', 'Other'], required: true },
          { kind: 'text', id: 'issuingAuthority', label: 'Issuing Authority' },
          { kind: 'text', id: 'documentNumber', label: 'Document/ID Number' },
          { kind: 'date', id: 'issueDate', label: 'Issue Date', approximate: true },
          { kind: 'date', id: 'expiryDate', label: 'Expiry Date' },
          { kind: 'text', id: 'placeIssued', label: 'Place Issued' }
        ]
      },
      {
        id: 'media',
        title: 'Scans & Photos',
        description: 'Upload document scans and photos',
        fields: [
          { kind: 'ocr', id: 'extractText', label: 'Extract Document Text', source: 'scan', targetFields: ['documentNumber', 'issueDate'] }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Context',
        description: 'Document the story and significance',
        fields: [
          { kind: 'date', id: 'acquiredDate', label: 'When obtained', approximate: true },
          { kind: 'textarea', id: 'history', label: 'Historical context & story' },
          { kind: 'text', id: 'significance', label: 'Family significance' }
        ]
      },
      {
        id: 'details',
        title: 'Organization & Details',
        description: 'Final details and organization',
        fields: [
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' },
          { kind: 'text', id: 'storageLocation', label: 'Physical storage location' }
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
        title: 'Basic Information',
        description: 'Tell us about this correspondence or diary',
        fields: [
          { kind: 'text', id: 'title', label: 'Title/Subject', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'type', label: 'Type', options: ['Letter', 'Diary', 'Journal', 'Postcard', 'Telegram', 'Other'], required: true },
          { kind: 'text', id: 'author', label: 'Author/Writer' },
          { kind: 'text', id: 'recipient', label: 'Recipient' },
          { kind: 'date', id: 'writtenDate', label: 'Date Written', approximate: true },
          { kind: 'text', id: 'location', label: 'Written From' }
        ]
      },
      {
        id: 'media',
        title: 'Scans & Photos',
        description: 'Upload scans and extract text',
        fields: [
          { kind: 'ocr', id: 'transcription', label: 'Extract Text', source: 'scan', targetFields: ['content'] }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Story',
        description: 'Document the background and significance',
        fields: [
          { kind: 'textarea', id: 'context', label: 'Historical context' },
          { kind: 'textarea', id: 'familyStory', label: 'Family story & significance' },
          { kind: 'text', id: 'howPreserved', label: 'How was it preserved?' }
        ]
      },
      {
        id: 'details',
        title: 'Organization & Care',
        description: 'Final details and preservation',
        fields: [
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' },
          { kind: 'textarea', id: 'preservationNotes', label: 'Preservation & care notes' }
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
        title: 'Basic Information',
        description: 'Tell us about this piece of jewelry',
        fields: [
          { kind: 'text', id: 'title', label: 'Name/Title', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'type', label: 'Type', options: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Watch', 'Brooch', 'Cufflinks', 'Other'], required: true },
          { kind: 'chips', id: 'materials', label: 'Materials', options: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl', 'Ruby', 'Sapphire', 'Emerald'] },
          { kind: 'text', id: 'hallmarks', label: 'Hallmarks/Stamps' },
          { kind: 'text', id: 'size', label: 'Size' },
          { kind: 'money', id: 'appraisalValue', label: 'Appraised Value', private: true }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Documentation',
        description: 'Upload photos and scan any certificates',
        fields: [
          { kind: 'text', id: 'photoInstructions', label: 'Photo Tips', help: 'Take photos showing hallmarks, unique features, and overall condition' }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Provenance',
        description: 'Document the story and ownership history',
        fields: [
          { kind: 'date', id: 'acquiredDate', label: 'When acquired', approximate: true },
          { kind: 'text', id: 'acquiredFrom', label: 'Acquired from' },
          { kind: 'textarea', id: 'history', label: 'History & Story' },
          { kind: 'text', id: 'occasion', label: 'Special occasion/significance' },
          { kind: 'date', id: 'estimatedAge', label: 'Estimated date made', approximate: true }
        ]
      },
      {
        id: 'details',
        title: 'Care & Details',
        description: 'Additional details and care information',
        fields: [
          { kind: 'textarea', id: 'careInstructions', label: 'Care Instructions' },
          { kind: 'text', id: 'insuranceDetails', label: 'Insurance policy details' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us about this clothing or textile item',
        fields: [
          { kind: 'text', id: 'title', label: 'Name/Title', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'type', label: 'Type', options: ['Dress', 'Suit', 'Uniform', 'Quilt', 'Fabric', 'Hat', 'Shoes', 'Accessories', 'Other'], required: true },
          { kind: 'text', id: 'size', label: 'Size' },
          { kind: 'chips', id: 'materials', label: 'Materials/Fiber', options: ['Cotton', 'Wool', 'Silk', 'Linen', 'Polyester', 'Leather'] },
          { kind: 'text', id: 'maker', label: 'Maker/Brand' },
          { kind: 'text', id: 'pattern', label: 'Pattern/Style' }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Documentation',
        description: 'Upload photos showing details and condition',
        fields: [
          { kind: 'text', id: 'photoTips', label: 'Photo Tips', help: 'Capture labels, unique features, patterns, and overall condition' }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Story',
        description: 'Document the background and significance',
        fields: [
          { kind: 'date', id: 'acquiredDate', label: 'When acquired', approximate: true },
          { kind: 'text', id: 'acquiredFrom', label: 'Acquired from' },
          { kind: 'textarea', id: 'history', label: 'History & story' },
          { kind: 'text', id: 'occasion', label: 'Special occasions worn' },
          { kind: 'date', id: 'estimatedAge', label: 'Estimated date made', approximate: true }
        ]
      },
      {
        id: 'details',
        title: 'Care & Details',
        description: 'Care instructions and final details',
        fields: [
          { kind: 'textarea', id: 'careInstructions', label: 'Care Instructions' },
          { kind: 'text', id: 'condition', label: 'Current condition' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us about this artwork or craft item',
        fields: [
          { kind: 'text', id: 'title', label: 'Title/Name', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'text', id: 'artist', label: 'Artist/Maker', required: true },
          { kind: 'select', id: 'medium', label: 'Medium', options: ['Oil Paint', 'Watercolor', 'Acrylic', 'Pencil', 'Ink', 'Sculpture', 'Pottery', 'Textile', 'Mixed Media', 'Other'] },
          { kind: 'dimensions', id: 'dimensions', label: 'Dimensions', units: ['cm', 'in'] },
          { kind: 'text', id: 'signature', label: 'Signature/Mark' },
          { kind: 'text', id: 'frame', label: 'Frame Description' },
          { kind: 'text', id: 'edition', label: 'Edition Number' }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Documentation',
        description: 'Upload photos and document details',
        fields: [
          { kind: 'text', id: 'photoTips', label: 'Photo Tips', help: 'Capture signatures, unique details, and overall piece including frame' }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Provenance',
        description: 'Document the artwork\'s history and significance',
        fields: [
          { kind: 'date', id: 'dateCreated', label: 'Date created', approximate: true },
          { kind: 'date', id: 'acquiredDate', label: 'When acquired', approximate: true },
          { kind: 'text', id: 'acquiredFrom', label: 'Acquired from' },
          { kind: 'textarea', id: 'history', label: 'History & provenance' },
          { kind: 'money', id: 'purchasePrice', label: 'Purchase price', private: true },
          { kind: 'money', id: 'currentValue', label: 'Current estimated value', private: true }
        ]
      },
      {
        id: 'details',
        title: 'Care & Details',
        description: 'Conservation and final details',
        fields: [
          { kind: 'textarea', id: 'conservationNotes', label: 'Conservation & care notes' },
          { kind: 'text', id: 'exhibitionHistory', label: 'Exhibition history' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us about this book or printed material',
        fields: [
          { kind: 'text', id: 'title', label: 'Title', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'text', id: 'author', label: 'Author', required: true },
          { kind: 'text', id: 'publisher', label: 'Publisher' },
          { kind: 'number', id: 'year', label: 'Publication Year' },
          { kind: 'text', id: 'isbn', label: 'ISBN' },
          { kind: 'text', id: 'edition', label: 'Edition' }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Scans',
        description: 'Upload photos and extract text from inscriptions',
        fields: [
          { kind: 'ocr', id: 'extractText', label: 'Extract Text', source: 'scan', targetFields: ['inscriptions'] }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Story',
        description: 'Document the book\'s history and significance',
        fields: [
          { kind: 'date', id: 'acquiredDate', label: 'When acquired', approximate: true },
          { kind: 'text', id: 'acquiredFrom', label: 'Acquired from' },
          { kind: 'textarea', id: 'inscriptions', label: 'Inscriptions/Dedications' },
          { kind: 'textarea', id: 'familyHistory', label: 'Family history & significance' },
          { kind: 'text', id: 'originalOwner', label: 'Original owner' }
        ]
      },
      {
        id: 'details',
        title: 'Condition & Details',
        description: 'Final details and condition notes',
        fields: [
          { kind: 'text', id: 'condition', label: 'Current condition' },
          { kind: 'textarea', id: 'preservationNotes', label: 'Preservation notes' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us about this media item',
        fields: [
          { kind: 'text', id: 'title', label: 'Title/Subject', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'format', label: 'Format', options: ['Print Photo', 'Negative', 'Slide', '8mm Film', 'VHS', 'Cassette', 'Vinyl Record', 'CD', 'Digital', 'Other'], required: true },
          { kind: 'textarea', id: 'subjects', label: 'Subjects/People' },
          { kind: 'date', id: 'dateTaken', label: 'Date Taken/Recorded', approximate: true },
          { kind: 'text', id: 'location', label: 'Location' },
          { kind: 'select', id: 'digitizationStatus', label: 'Digitization Status', options: ['Not Digitized', 'Digitized', 'Digital Original'] }
        ]
      },
      {
        id: 'media',
        title: 'Digital Preservation',
        description: 'Upload scans/digitized versions',
        fields: [
          { kind: 'text', id: 'digitalTips', label: 'Digitization Tips', help: 'High-resolution scans preserve memories for future generations' }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Context',
        description: 'Document the story behind this media',
        fields: [
          { kind: 'text', id: 'photographer', label: 'Photographer/Creator' },
          { kind: 'textarea', id: 'context', label: 'Historical context & story' },
          { kind: 'text', id: 'eventOccasion', label: 'Event/Occasion' },
          { kind: 'date', id: 'acquiredDate', label: 'When acquired', approximate: true }
        ]
      },
      {
        id: 'details',
        title: 'Organization & Care',
        description: 'Final details and preservation',
        fields: [
          { kind: 'textarea', id: 'preservationNotes', label: 'Preservation & storage notes' },
          { kind: 'text', id: 'originalCondition', label: 'Original condition' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'People in Photo/Media', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us about this kitchen or dining item',
        fields: [
          { kind: 'text', id: 'title', label: 'Name/Title', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'type', label: 'Type', options: ['China/Dishes', 'Silverware', 'Glassware', 'Cookware', 'Utensils', 'Appliance', 'Serving Pieces', 'Other'], required: true },
          { kind: 'text', id: 'maker', label: 'Maker/Brand' },
          { kind: 'text', id: 'pattern', label: 'Pattern/Model' },
          { kind: 'chips', id: 'materials', label: 'Materials', options: ['Porcelain', 'China', 'Silver', 'Stainless Steel', 'Glass', 'Cast Iron', 'Copper'] },
          { kind: 'number', id: 'pieces', label: 'Number of Pieces' }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Documentation',
        description: 'Upload photos showing details and condition',
        fields: [
          { kind: 'text', id: 'photoTips', label: 'Photo Tips', help: 'Capture maker marks, patterns, and any unique features' }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Story',
        description: 'Document the background and family use',
        fields: [
          { kind: 'date', id: 'acquiredDate', label: 'When acquired', approximate: true },
          { kind: 'text', id: 'acquiredFrom', label: 'Acquired from' },
          { kind: 'textarea', id: 'familyUse', label: 'Family use & occasions' },
          { kind: 'textarea', id: 'history', label: 'History & story' },
          { kind: 'date', id: 'estimatedAge', label: 'Estimated date made', approximate: true }
        ]
      },
      {
        id: 'details',
        title: 'Care & Details',
        description: 'Care instructions and final details',
        fields: [
          { kind: 'textarea', id: 'careInstructions', label: 'Care & cleaning instructions' },
          { kind: 'text', id: 'condition', label: 'Current condition' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us about this military or service item',
        fields: [
          { kind: 'text', id: 'title', label: 'Name/Title', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'select', id: 'type', label: 'Item Type', options: ['Medal', 'Citation', 'Uniform', 'Equipment', 'Documents', 'Photos', 'Other'], required: true },
          { kind: 'select', id: 'branch', label: 'Service Branch', options: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'Other'] },
          { kind: 'text', id: 'rank', label: 'Rank' },
          { kind: 'text', id: 'unit', label: 'Unit/Division' },
          { kind: 'text', id: 'theater', label: 'Theater/Campaign' }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Documentation',
        description: 'Upload photos and scan any documents',
        fields: [
          { kind: 'text', id: 'photoTips', label: 'Photo Tips', help: 'Capture insignia, serial numbers, and any identifying marks' }
        ]
      },
      {
        id: 'provenance',
        title: 'Service History',
        description: 'Document the service history and significance',
        fields: [
          { kind: 'date', id: 'serviceStart', label: 'Service Start', approximate: true },
          { kind: 'date', id: 'serviceEnd', label: 'Service End', approximate: true },
          { kind: 'textarea', id: 'serviceHistory', label: 'Service history & achievements' },
          { kind: 'textarea', id: 'familyStory', label: 'Family story & significance' },
          { kind: 'text', id: 'veteranName', label: 'Veteran\'s name' }
        ]
      },
      {
        id: 'details',
        title: 'Preservation & Details',
        description: 'Care information and final details',
        fields: [
          { kind: 'textarea', id: 'preservationNotes', label: 'Preservation & care notes' },
          { kind: 'text', id: 'condition', label: 'Current condition' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'Associated People', to: 'people' }
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
        title: 'Basic Information',
        description: 'Tell us what you know about this mystery item',
        fields: [
          { kind: 'text', id: 'title', label: 'Name/Title (if known)', required: true },
          { kind: 'textarea', id: 'description', label: 'Description' },
          { kind: 'textarea', id: 'whatIsThis', label: 'What might this be?' },
          { kind: 'textarea', id: 'whereFound', label: 'Where was it found?' },
          { kind: 'chips', id: 'materials', label: 'Materials (if known)' },
          { kind: 'dimensions', id: 'dimensions', label: 'Approximate Size', units: ['cm', 'in'] }
        ]
      },
      {
        id: 'media',
        title: 'Photos & Documentation',
        description: 'Upload detailed photos from multiple angles',
        fields: [
          { kind: 'text', id: 'photoTips', label: 'Photo Tips', help: 'Take photos from all angles, close-ups of any markings or details' }
        ]
      },
      {
        id: 'provenance',
        title: 'History & Context',
        description: 'Document what you know about its background',
        fields: [
          { kind: 'date', id: 'foundDate', label: 'When found/discovered', approximate: true },
          { kind: 'text', id: 'foundWhere', label: 'Where found' },
          { kind: 'textarea', id: 'context', label: 'Any known history or context' },
          { kind: 'textarea', id: 'familyConnection', label: 'Possible family connection' }
        ]
      },
      {
        id: 'details',
        title: 'Investigation & Details',
        description: 'Research notes and crowd-sourcing help',
        fields: [
          { kind: 'textarea', id: 'researchNotes', label: 'Research notes & findings' },
          { kind: 'text', id: 'crowdsourceHelp', label: 'Ask family for help identifying' },
          { kind: 'chips', id: 'tags', label: 'Tags' },
          { kind: 'relation', id: 'peopleIds', label: 'People who might know more', to: 'people' }
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