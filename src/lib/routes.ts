/**
 * Canonical route builders + safe URL param parsing
 * One source of truth for all navigation routes
 */

export type StoryTab = 'text' | 'photo' | 'voice' | 'video' | 'mixed'
export const VALID_TABS: StoryTab[] = ['text', 'photo', 'voice', 'video', 'mixed']

export const isStoryTab = (v: unknown): v is StoryTab =>
  typeof v === 'string' && (VALID_TABS as string[]).includes(v)

/**
 * Parse ?tab and optional prefill params from location.search or a query string
 */
export function parseTabParam(input?: string | URLSearchParams) {
  const sp = typeof input === 'string'
    ? new URLSearchParams(input.startsWith('?') ? input : `?${input}`)
    : (input ?? new URLSearchParams())

  const raw = sp.get('tab') ?? 'text'
  const tab: StoryTab = isStoryTab(raw) ? (raw as StoryTab) : 'text'

  const promptId = sp.get('promptId') ?? undefined
  const personId = sp.get('personId') ?? undefined
  const children = sp.get('children')?.split(',').filter(Boolean) ?? undefined
  const circle = sp.get('circle') ?? undefined
  const album = sp.get('album') ?? undefined
  const source = sp.get('source') ?? undefined
  const petId = sp.get('petId') ?? undefined

  return { tab, promptId, personId, children, circle, album, source, petId }
}

/**
 * Canonical route builders
 */
export const routes = {
  // Home & Drafts
  home: () => '/home',
  drafts: () => '/drafts',
  
  // Pets
  pets: () => '/pets',
  petNew: () => '/pets/new',
  petDetail: (id: string) => `/pets/${id}`,
  petEdit: (id: string) => `/pets/${id}/edit`,
  petStories: (id: string) => `/pets/${id}/stories`,
  
  // Invites & Events
  invitesNew: () => '/invites/new',
  events: () => '/events',
  eventNew: () => '/events/new',
  eventShow: (id: string) => `/events/${id}`,

  // People & Stories
  people: (id: string) => `/people/${id}`,
  peopleIndex: () => '/people',
  peopleNew: () => '/people?new=true',
  
  storiesShow: (id: string) => `/stories/${id}`,
  storiesActivity: (id: string) => `/stories/${id}#activity`,
  storiesLikes: (id: string) => `/stories/${id}#likes`,
  storiesComments: (id: string) => `/stories/${id}#comments`,
  storiesPrivacy: (id: string) => `/stories/${id}#privacy`,
  storiesAudio: (id: string) => `/stories/${id}#audio`,
  storiesTagging: (id: string) => `/stories/${id}#tagging`,

  // Vault & SafeBox
  vault: () => '/vault',
  vaultDocsNew: () => '/vault/docs/new',
  vaultDelegates: () => '/vault/delegates',
  vaultChecklists: () => '/vault/checklists',

  // Analytics & Admin
  analyticsCapturesWeek: () => '/analytics/captures?range=this-week',
  adminDataHealth: () => '/admin/data-health',
  adminMergePeople: () => '/admin/merge?type=people',
  
  // Search
  searchOrphan: () => '/search?has=orphan',
  searchUntaggedFaces: () => '/search?has=untagged_faces',
  
  // Research
  researchCitations: () => '/research/citations?status=uncited',

  // Story Composer - Main builder with all options
  storyNew: (opts?: Partial<{
    tab: StoryTab
    promptId: string
    personId: string
    children: string[]
    circle: string
    album: string
    source: string
    petId: string
  }>) => {
    const p = new URLSearchParams()
    if (opts?.tab) p.set('tab', opts.tab)
    if (opts?.promptId) p.set('promptId', opts.promptId)
    if (opts?.personId) p.set('personId', opts.personId)
    if (opts?.children?.length) p.set('children', opts.children.join(','))
    if (opts?.circle) p.set('circle', opts.circle)
    if (opts?.album) p.set('album', opts.album)
    if (opts?.source) p.set('source', opts.source)
    if (opts?.petId) p.set('petId', opts.petId)
    const q = p.toString()
    return q ? `/stories/new?${q}` : `/stories/new`
  },

  // Legacy story routes (redirects to storyNew)
  newStory: () => '/new-story',
  capture: () => '/capture',

  // Prompts
  todaysPrompt: () => '/prompts/today',

  // Other Domains
  recipesNew: (prefill?: string) =>
    prefill ? `/recipes/new?prefill=${encodeURIComponent(prefill)}` : '/recipes/new',
  recipesIndex: () => '/recipes',
  
  meTimeline: () => '/me/timeline',
  albumsIndex: () => '/albums',
  objectsIndex: () => '/objects',
  propertiesIndex: () => '/properties',
  petsIndex: () => '/pets',
  tree: () => '/tree',
  saved: () => '/saved',
  
  // Notifications
  notifications: () => '/notifications',
  
  // Settings
  settings: () => '/settings',

  // Mobile Tools Drawer
  toolsDrawer: () => '/home?panel=tools',
} as const
