import { supabase } from './supabase'

export interface WeeklyDigestSettings {
  id?: string
  family_id?: string
  enabled: boolean
  delivery_day: number // 0 = Sunday, 1 = Monday, etc.
  delivery_hour: number // 0-23
  delivery_timezone: string
  recipients: string[] // array of email addresses
  last_sent_at?: string
  created_at?: string
  updated_at?: string
  created_by?: string
}

export class WeeklyDigestService {
  async getSettings(userId: string): Promise<WeeklyDigestSettings | null> {
    const { data, error } = await supabase
      .from('weekly_digest_settings')
      .select('*')
      .eq('created_by', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found, return default settings
        return null
      }
      console.error('Error fetching digest settings:', error)
      throw error
    }

    return {
      ...data,
      recipients: Array.isArray(data.recipients) ? (data.recipients as string[]) : []
    }
  }

  async updateSettings(userId: string, settings: Partial<WeeklyDigestSettings>): Promise<void> {
    // Get current user's family_id if not provided
    let familyId = settings.family_id
    if (!familyId) {
      const existingSettings = await this.getSettings(userId)
      familyId = existingSettings?.family_id
    }

    const updateData: any = {
      created_by: userId,
      ...settings,
    }
    
    // Only include family_id if we have one
    if (familyId) {
      updateData.family_id = familyId
    }

    // Convert recipients array to JSON for database
    if (settings.recipients) {
      updateData.recipients = settings.recipients
    }

    const { error } = await supabase
      .from('weekly_digest_settings')
      .upsert(updateData)

    if (error) {
      console.error('Error updating digest settings:', error)
      throw error
    }
  }

  async enableDigest(userId: string, familyId: string): Promise<void> {
    await this.updateSettings(userId, {
      family_id: familyId,
      enabled: true,
      delivery_day: 0, // Sunday
      delivery_hour: 9, // 9 AM
      delivery_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recipients: []
    })
  }

  async disableDigest(userId: string): Promise<void> {
    await this.updateSettings(userId, {
      enabled: false
    })
  }

  async updateSchedule(userId: string, day: number, hour: number): Promise<void> {
    await this.updateSettings(userId, {
      delivery_day: day,
      delivery_hour: hour
    })
  }

  async getNextDigestDate(userId: string): Promise<Date | null> {
    const settings = await this.getSettings(userId)
    
    if (!settings || !settings.enabled) {
      return null
    }

    const now = new Date()
    const targetDay = settings.delivery_day
    const targetHour = settings.delivery_hour
    
    // Calculate next occurrence of the target day and hour
    const daysUntilTarget = (targetDay - now.getDay() + 7) % 7
    const nextDigest = new Date(now)
    nextDigest.setDate(now.getDate() + daysUntilTarget)
    nextDigest.setHours(targetHour, 0, 0, 0)
    
    // If it's the same day but past the target hour, add 7 days
    if (daysUntilTarget === 0 && now.getHours() >= targetHour) {
      nextDigest.setDate(nextDigest.getDate() + 7)
    }
    
    return nextDigest
  }

  async logDigestSent(userId: string): Promise<void> {
    await this.updateSettings(userId, {
      last_sent_at: new Date().toISOString()
    })
  }
}

export const weeklyDigestService = new WeeklyDigestService()