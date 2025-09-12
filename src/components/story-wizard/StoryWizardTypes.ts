export interface StoryFormData {
  // Step 1 - Basics
  title: string
  content: string
  
  // Step 2 - People & Places
  date: string
  dateType: 'exact' | 'approximate'
  location: string
  people: SelectedPerson[]
  tags: string[]
  
  // Step 3 - Media
  media: MediaItem[]
  
  // Step 4 - Publishing
  visibility: 'family' | 'branch' | 'private'
  collection: 'none' | 'recipe' | 'object' | 'property'
}

export interface SelectedPerson {
  id?: string // undefined for new people not yet in database
  name: string
  isExisting: boolean
}

export interface MediaItem {
  id: string
  file: File
  caption: string
  isCover: boolean
  order: number
  preview?: string
}

export interface AutosaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  message: string
}

export interface AIAssist {
  titleSuggestions: string[]
  tagSuggestions: string[]
  peopleSuggestions: string[]
}

export const WIZARD_STEPS = [
  { id: 1, title: '1. Basics', description: 'Title and story' },
  { id: 2, title: '2. People & Places', description: 'When, where, and who' },
  { id: 3, title: '3. Photos & Video', description: 'Add media' },
  { id: 4, title: '4. Review & Publish', description: 'Final review' }
] as const

export type WizardStep = typeof WIZARD_STEPS[number]['id']