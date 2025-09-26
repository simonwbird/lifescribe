import { supabase } from '@/integrations/supabase/client'
import { DigestSettings, DigestPreview, DigestSendLog, DEFAULT_DIGEST_SETTINGS, DigestContentSettings } from './digestTypes'

// Legacy interface for backward compatibility
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
  async getSettings(userId: string): Promise<DigestSettings | null> {
    // Prefer family-based settings; user-based may not exist if another admin created it
    const { data: membership } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', userId)
      .limit(1)
      .maybeSingle()

    if (membership?.family_id) {
      const byFamily = await this.getSettingsByFamily(membership.family_id)
      if (byFamily) return byFamily
    }

    // Fallback to creator-based lookup for backward compatibility
    const { data, error } = await supabase
      .from('weekly_digest_settings')
      .select('*')
      .eq('created_by', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching digest settings:', error)
      throw error
    }

    if (!data) return null

    return {
      ...data,
      recipients: Array.isArray(data.recipients) ? (data.recipients as string[]) :
                  (typeof data.recipients === 'object' && data.recipients !== null) ? data.recipients : [],
      content_settings: (data.content_settings as unknown as DigestContentSettings) || DEFAULT_DIGEST_SETTINGS.content_settings!
    } as DigestSettings
  }

  async getSettingsByFamily(familyId: string): Promise<DigestSettings | null> {
    const { data, error } = await supabase
      .from('weekly_digest_settings')
      .select('*')
      .eq('family_id', familyId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching digest settings by family:', error)
      throw error
    }

    if (!data) return null

    return {
      ...data,
      recipients: Array.isArray(data.recipients) ? (data.recipients as string[]) :
                  (typeof data.recipients === 'object' && data.recipients !== null) ? data.recipients : [],
      content_settings: (data.content_settings as unknown as DigestContentSettings) || DEFAULT_DIGEST_SETTINGS.content_settings!
    } as DigestSettings
  }

  async updateSettings(userId: string, settings: Partial<DigestSettings>): Promise<void> {
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
      .upsert(updateData, { onConflict: 'family_id' })

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

  async pauseDigest(userId: string, familyId: string, reason?: string): Promise<void> {
    await this.updateSettings(userId, {
      family_id: familyId,
      is_paused: true,
      pause_reason: reason,
      paused_at: new Date().toISOString(),
      paused_by: userId
    })
  }

  async resumeDigest(userId: string, familyId: string): Promise<void> {
    await this.updateSettings(userId, {
      family_id: familyId,
      is_paused: false,
      pause_reason: null,
      paused_at: null,
      paused_by: null
    })
  }

  async forceSendDigest(userId: string, familyId: string): Promise<void> {
    // Update settings to track forced send
    await this.updateSettings(userId, {
      family_id: familyId,
      last_forced_send_at: new Date().toISOString(),
      forced_send_by: userId
    })

    // Call edge function to send digest
    const { error } = await supabase.functions.invoke('send-digest', {
      body: {
        family_id: familyId,
        send_type: 'forced',
        sent_by: userId
      }
    })

    if (error) {
      console.error('Error force-sending digest:', error)
      throw error
    }

    // Log the send
    await this.logDigestSend(familyId, 'forced', userId)
  }

  async generatePreview(familyId: string): Promise<DigestPreview> {
    const { data, error } = await supabase.rpc('generate_digest_preview', {
      p_family_id: familyId
    })

    if (error) {
      console.error('Error generating digest preview:', error)
      throw error
    }

    return data as unknown as DigestPreview
  }

  async checkUnlockStatus(familyId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_digest_unlock_status', {
      p_family_id: familyId
    })

    if (error) {
      console.error('Error checking unlock status:', error)
      throw error
    }

    return data
  }

  async updateUnlockStatus(userId: string, familyId: string): Promise<void> {
    const isUnlocked = await this.checkUnlockStatus(familyId)
    
    if (isUnlocked) {
      await this.updateSettings(userId, {
        family_id: familyId,
        is_unlocked: true
      })
    }
  }

  private async logDigestSend(familyId: string, sendType: 'scheduled' | 'forced', sentBy?: string): Promise<void> {
    const currentWeek = new Date()
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()) // Start of week

    const { error } = await supabase
      .from('digest_send_log')
      .insert({
        family_id: familyId,
        digest_week: currentWeek.toISOString().split('T')[0],
        send_type: sendType,
        sent_by: sentBy,
        recipient_count: 0, // Will be updated by edge function
        content_summary: {}
      })

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error logging digest send:', error)
    }
  }

  async getDigestHistory(familyId: string): Promise<DigestSendLog[]> {
    const { data, error } = await supabase
      .from('digest_send_log')
      .select('*')
      .eq('family_id', familyId)
      .order('sent_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching digest history:', error)
      throw error
    }

    return data as DigestSendLog[]
  }
}

export const weeklyDigestService = new WeeklyDigestService()