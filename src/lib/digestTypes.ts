export interface DigestSettings {
  id?: string
  family_id: string
  enabled: boolean
  delivery_day: number // 0 = Sunday, 1 = Monday, etc.
  delivery_hour: number // 0-23
  delivery_timezone: string
  recipients: string[] | { all: boolean; exclude: string[] }
  last_sent_at?: string
  is_paused: boolean
  pause_reason?: string
  paused_at?: string
  paused_by?: string
  last_forced_send_at?: string
  forced_send_by?: string
  content_settings: DigestContentSettings
  unlock_threshold: number
  is_unlocked: boolean
  created_at?: string
  updated_at?: string
  created_by?: string
}

export interface DigestContentSettings {
  stories: boolean
  photos: boolean
  comments: boolean
  reactions: boolean
  birthdays: boolean
  highlights: boolean
}

export interface DigestPreview {
  stories: number
  photos: number
  comments: number
  birthdays: number
  generated_at: string
  preview_date: string
  is_unlocked: boolean
  blurred_content?: {
    story_titles: string[]
    photo_thumbnails: string[]
    birthday_names: string[]
  }
}

export interface DigestContentCache {
  id: string
  family_id: string
  digest_week: string
  content_snapshot: any
  generated_at: string
  expires_at: string
  created_by?: string
}

export interface DigestSendLog {
  id: string
  family_id: string
  digest_week: string
  sent_at: string
  sent_by?: string
  send_type: 'scheduled' | 'forced'
  recipient_count: number
  content_summary: any
}

export interface DigestGlobalSettings {
  default_unlock_threshold: number
  default_delivery_day: number
  default_delivery_hour: number
  default_timezone: string
  default_content_settings: DigestContentSettings
  max_recipients: number
  min_unlock_threshold: number
}

export const DEFAULT_DIGEST_SETTINGS: Partial<DigestSettings> = {
  enabled: true,
  delivery_day: 0, // Sunday
  delivery_hour: 9, // 9 AM
  delivery_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  recipients: [],
  is_paused: false,
  content_settings: {
    stories: true,
    photos: true,
    comments: true,
    reactions: true,
    birthdays: true,
    highlights: true
  },
  unlock_threshold: 2,
  is_unlocked: false
}

export const DIGEST_SCHEDULE_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export const DIGEST_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: new Date(0, 0, 0, i).toLocaleTimeString([], { 
    hour: 'numeric', 
    hour12: true 
  })
}))