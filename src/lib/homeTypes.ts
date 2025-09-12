// Types for Home Hub functionality v2

export type LastVisit = { 
  lastLoginAt: string; 
};

export type ActivityKind = 'story' | 'photo' | 'comment' | 'invite';

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  actor: string;
  when: string; // ISO
  read: boolean;
  targetUrl: string;
};

export type DraftKind = 'story' | 'photos' | 'audio' | 'scan';

export type DraftItem = { 
  id: string; 
  kind: DraftKind; 
  title?: string; 
  progress: 'Needs title' | 'Tag people' | 'Add date' | 'Ready to publish'; 
  updatedAt: string; // ISO
};

export type ActivityFilter = 'all' | 'stories' | 'photos' | 'comments' | 'invites';

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: string;
  shortcut: string;
  action: () => void;
};

export type SpaceSummary = { 
  name: string; 
  count: number; 
  updatedAt: string; 
};

export type SpaceCard = {
  id: string;
  title: string;
  description: string;
  count?: number;
  updatedAt?: string;
  href: string;
  thumbnail?: string;
};

export type Suggestion = { 
  id: string; 
  text: string; 
  actionLabel: string; 
  href: string; 
};

export type UpcomingItem = { 
  id: string; 
  person: string; 
  type: 'Birthday' | 'Anniversary'; 
  when: string; 
};

// Legacy types for backward compatibility
export type UpcomingMoment = {
  id: string;
  type: 'birthday' | 'anniversary';
  personName: string;
  date: string;
  daysUntil: number;
};