// Types for Home Hub functionality

export type ActivityItem = 
  | { type: 'story_published'; id: string; title: string; author: string; when: string; unread?: boolean }
  | { type: 'comment_added'; id: string; storyTitle: string; author: string; when: string; unread?: boolean }
  | { type: 'photo_uploaded'; id: string; count: number; by: string; when: string; unread?: boolean }
  | { type: 'tag_request'; id: string; personName?: string; when: string; unread?: boolean }
  | { type: 'invite_accepted'; id: string; name: string; when: string; unread?: boolean }
  | { type: 'profile_updated'; id: string; name: string; when: string; unread?: boolean };

export type DraftItem = { 
  id: string; 
  kind: 'story' | 'photos' | 'scan' | 'audio'; 
  title?: string; 
  progress: string; 
  updatedAt: string;
};

export type ActivityFilter = 'all' | 'my-family' | 'about-me';

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
};

export type SpaceCard = {
  id: string;
  title: string;
  description: string;
  count?: number;
  lastAdded?: string;
  href: string;
  thumbnail?: string;
};

export type UpcomingMoment = {
  id: string;
  type: 'birthday' | 'anniversary';
  personName: string;
  date: string;
  daysUntil: number;
};