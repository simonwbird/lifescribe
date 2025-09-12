// Recipe-specific types for the recipe flow

export type Quantity = { 
  value?: number
  unit?: 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'oz' | 'lb' | 'piece' | string
}

export type IngredientRow = {
  id: string
  section?: string          // "Dough", "Filling"
  qty?: Quantity
  item: string              // "plain flour"
  notes?: string            // "sifted"
}

export type StepRow = {
  id: string
  text: string
  timerSec?: number
  imageUrl?: string
  optional?: boolean
  tip?: string
}

export type Recipe = {
  id: string
  title: string
  subtitle?: string
  source?: string
  cuisine?: string
  occasion?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  serves?: string
  prepMin?: number
  cookMin?: number
  totalMin?: number
  diet?: { 
    veg?: boolean
    vegan?: boolean
    glutenFree?: boolean
    dairyFree?: boolean
  }
  peopleIds: string[]
  place?: string
  year?: string             // supports approx text
  tags: string[]
  ingredients: IngredientRow[]
  steps: StepRow[]
  notes?: string            // story/context
  coverUrl?: string
  gallery: { url: string; alt?: string; kind?: 'photo' | 'scan' }[]
  visibility: 'family' | 'branch' | 'private'
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  authorId: string
  authorName: string
  familyId: string
}

export type RecipeFormData = {
  // Step 1 - Details
  title: string
  subtitle?: string
  source?: string
  cuisine?: string
  occasion: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  serves?: string
  prepMin?: number
  cookMin?: number
  diet: {
    veg: boolean
    vegan: boolean
    glutenFree: boolean
    dairyFree: boolean
  }
  
  // Step 2 - People & Context
  peopleIds: string[]
  place?: string
  year?: string
  tags: string[]
  
  // Step 3 - Ingredients
  ingredients: IngredientRow[]
  
  // Step 4 - Steps
  steps: StepRow[]
  notes?: string
  
  // Step 5 - Media & Publishing
  coverUrl?: string
  gallery: { url: string; alt?: string; kind?: 'photo' | 'scan' }[]
  visibility: 'family' | 'branch' | 'private'
  status: 'draft' | 'published'
}

export type AutosaveStatus = {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  message: string
}

export const RECIPE_WIZARD_STEPS = [
  { id: 1, title: '1. Details', description: 'Basic info and timing' },
  { id: 2, title: '2. People & Context', description: 'Who, when, and where' },
  { id: 3, title: '3. Ingredients', description: 'What you need' },
  { id: 4, title: '4. Instructions', description: 'How to make it' },
  { id: 5, title: '5. Media & Publish', description: 'Photos and sharing' }
] as const

export type RecipeWizardStep = typeof RECIPE_WIZARD_STEPS[number]['id']

export const UNITS = {
  METRIC: ['g', 'kg', 'ml', 'l'] as const,
  US: ['tsp', 'tbsp', 'cup', 'oz', 'lb'] as const,
  UNIVERSAL: ['piece', 'whole', 'clove', 'pinch', 'dash'] as const
}

export const CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Indian', 'French', 'Thai', 'Japanese', 
  'Mediterranean', 'American', 'British', 'Greek', 'Spanish', 'Other'
]

export const OCCASIONS = [
  'Everyday', 'Holiday', 'Birthday', 'Christmas', 'Thanksgiving', 
  'Easter', 'Special Occasion', 'Comfort Food', 'Summer', 'Winter'
]