// Data types for the Home dashboard

export type LastVisit = { 
  lastLoginAt: string 
}

export type ActivityKind = 'story' | 'photo' | 'comment' | 'invite'

export type ActivityItem = {
  id: string
  kind: ActivityKind
  title: string
  actor: string
  when: string // ISO
  read: boolean
  targetUrl: string
}

export type DraftKind = 'story' | 'photos' | 'audio' | 'scan'

export type DraftItem = {
  id: string
  kind: DraftKind
  title?: string
  progress: 'Needs title' | 'Tag people' | 'Add date' | 'Ready to publish'
  updatedAt: string // ISO
}

export type SpaceSummary = { 
  name: string
  count: number
  updatedAt: string
}

export type Suggestion = { 
  id: string
  text: string
  actionLabel: string
  href: string
}

export type UpcomingItem = { 
  id: string
  person: string
  type: 'Birthday' | 'Anniversary'
  when: string
}

// Mock data
export const mockLastVisit: LastVisit = {
  lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
}

export const mockActivityItems: ActivityItem[] = [
  {
    id: '1',
    kind: 'story',
    title: 'Mom shared "Thanksgiving Memories"',
    actor: 'Mom',
    when: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    read: false,
    targetUrl: '/stories/thanksgiving-memories'
  },
  {
    id: '2',
    kind: 'photo',
    title: 'Dad added 5 photos to "Family Vacation"',
    actor: 'Dad',
    when: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    targetUrl: '/albums/family-vacation'
  },
  {
    id: '3',
    kind: 'comment',
    title: 'Sarah commented on "Wedding Day Story"',
    actor: 'Sarah',
    when: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: true,
    targetUrl: '/stories/wedding-day#comment-123'
  },
  {
    id: '4',
    kind: 'invite',
    title: 'Uncle Robert joined the family',
    actor: 'Uncle Robert',
    when: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    read: false,
    targetUrl: '/family/members/uncle-robert'
  }
]

export const mockDraftItems: DraftItem[] = [
  {
    id: 'draft1',
    kind: 'story',
    title: 'Summer Camp Adventures',
    progress: 'Add date',
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
  },
  {
    id: 'draft2',
    kind: 'photos',
    title: 'Christmas Morning Photos',
    progress: 'Tag people',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'draft3',
    kind: 'audio',
    progress: 'Needs title',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  }
]

export const mockSpaceSummaries: SpaceSummary[] = [
  {
    name: 'Family Stories',
    count: 47,
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    name: 'Photos',
    count: 324,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Recipes',
    count: 23,
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Heirlooms',
    count: 15,
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Homes',
    count: 3,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'My Stuff',
    count: 8,
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
]

export const mockSuggestions: Suggestion[] = [
  {
    id: 'sug1',
    text: 'Share a story about your first job',
    actionLabel: 'Start story',
    href: '/stories/new?prompt=first-job'
  },
  {
    id: 'sug2',
    text: 'Add photos from your phone',
    actionLabel: 'Upload photos',
    href: '/photos/upload'
  },
  {
    id: 'sug3',
    text: 'Ask your family about holiday traditions',
    actionLabel: 'Ask question',
    href: '/prompts/new?topic=holidays'
  }
]

export const mockUpcomingItems: UpcomingItem[] = [
  {
    id: 'up1',
    person: 'Mom',
    type: 'Birthday',
    when: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  },
  {
    id: 'up2',
    person: 'Sarah & Mike',
    type: 'Anniversary',
    when: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days from now
  }
]