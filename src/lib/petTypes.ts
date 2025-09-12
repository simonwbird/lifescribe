// Pet Types for Collections System

export type PetSpecies = 
  | 'dog' 
  | 'cat' 
  | 'rabbit' 
  | 'guinea-pig' 
  | 'hamster' 
  | 'gerbil' 
  | 'mouse' 
  | 'rat' 
  | 'ferret' 
  | 'chinchilla' 
  | 'hedgehog'
  | 'parrot' 
  | 'canary' 
  | 'finch' 
  | 'pigeon' 
  | 'chicken' 
  | 'duck'
  | 'snake' 
  | 'lizard' 
  | 'gecko' 
  | 'bearded-dragon' 
  | 'turtle' 
  | 'tortoise' 
  | 'frog' 
  | 'newt' 
  | 'axolotl'
  | 'freshwater-fish' 
  | 'marine-fish' 
  | 'shrimp' 
  | 'snail' 
  | 'hermit-crab'
  | 'horse' 
  | 'pony' 
  | 'donkey'
  | 'goat' 
  | 'sheep' 
  | 'pig' 
  | 'alpaca' 
  | 'llama'
  | 'other'

export type PetSex = 'male' | 'female' | 'unknown'
export type PetStatus = 'current' | 'past'
export type ReminderStatus = 'upcoming' | 'overdue' | 'done'

export interface ContactRef {
  name: string
  phone?: string
  email?: string
}

export interface Vaccine {
  id?: string
  name: string
  dateGiven?: string
  dueDate?: string
  notes?: string
}

export interface VetVisit {
  id?: string
  date: string
  reason?: string
  notes?: string
  attachments?: string[]
}

export interface Reminder {
  id?: string
  type: string
  title: string
  dueDate: string
  status: ReminderStatus
  notes?: string
}

export interface Pet {
  id: string
  familyId: string
  createdBy: string
  
  // Identity
  name: string
  species: PetSpecies | string
  breed?: string
  sex?: PetSex
  neutered?: boolean
  color?: string
  markings?: string
  dobApprox?: string // supports approx like "Spring 2020"
  gotchaDate?: string
  passedAt?: string // for memorial
  
  // IDs & Registration
  microchip?: {
    number?: string
    provider?: string
    date?: string
  }
  license?: {
    number?: string
    expires?: string
    authority?: string
  }
  registry?: {
    org?: string
    id?: string
  }
  dnaTest?: {
    provider?: string
    url?: string
  }
  
  // Health & Care
  vet?: ContactRef
  insurance?: {
    provider?: string
    policy?: string
    renews?: string
  }
  health: {
    weightKg?: number
    diet?: string
    allergies?: string
    medications?: string
    conditions?: string[]
    vaccines?: Vaccine[]
    visits?: VetVisit[]
  }
  
  // Life & Training
  roles?: string[] // service, therapy, show, etc.
  awards?: string[]
  temperament?: string
  favorites?: string[]
  routine?: {
    feeding?: string
    walks?: string
    bedtime?: string
  }
  careInstructions?: string
  
  // People & Place
  guardianIds: string[] // person IDs
  propertyId?: string
  room?: string
  breederRescue?: string
  
  // Media
  coverUrl?: string
  
  // Status & Metadata
  status: PetStatus
  tags: string[]
  reminders?: Reminder[]
  
  createdAt: string
  updatedAt: string
}

// Species groupings for UI
export const SPECIES_GROUPS = {
  'Dogs': ['dog'],
  'Cats': ['cat'],
  'Small Mammals': ['rabbit', 'guinea-pig', 'hamster', 'gerbil', 'mouse', 'rat', 'ferret', 'chinchilla', 'hedgehog'],
  'Birds': ['parrot', 'canary', 'finch', 'pigeon', 'chicken', 'duck'],
  'Reptiles & Amphibians': ['snake', 'lizard', 'gecko', 'bearded-dragon', 'turtle', 'tortoise', 'frog', 'newt', 'axolotl'],
  'Fish & Invertebrates': ['freshwater-fish', 'marine-fish', 'shrimp', 'snail', 'hermit-crab'],
  'Equines': ['horse', 'pony', 'donkey'],
  'Livestock Pets': ['goat', 'sheep', 'pig', 'alpaca', 'llama'],
  'Other': ['other']
}

// Common vaccines by species
export const VACCINE_TEMPLATES = {
  dog: ['Rabies', 'DHPP', 'Lepto', 'Bordetella', 'Lyme'],
  cat: ['Rabies', 'FVRCP', 'FeLV', 'FIV'],
  rabbit: ['RHDV', 'Myxomatosis'],
  // Add more as needed
}

export type PetFilter = {
  search?: string
  species?: PetSpecies[]
  status?: PetStatus[]
  sex?: PetSex[]
  ageRange?: { min?: number; max?: number }
  guardianIds?: string[]
  tags?: string[]
  microchipped?: boolean
  vaccinesStatus?: 'up-to-date' | 'overdue'
  insuranceStatus?: 'active' | 'expired'
}

export type PetSort = 
  | 'recent' 
  | 'name-asc' 
  | 'name-desc'
  | 'age-asc' 
  | 'age-desc'
  | 'added' 
  | 'next-reminder'