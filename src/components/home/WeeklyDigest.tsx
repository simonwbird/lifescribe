import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calendar, Mail, Settings, Eye, Send, Users } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { DigestPreviewModal } from '@/components/admin/DigestPreviewModal'
import DigestQuickActions from './DigestQuickActions'
import { EnhancedDigestRecipientManager } from './EnhancedDigestRecipientManager'
import DigestMetricsSummary from './DigestMetricsSummary'
import { weeklyDigestService } from '@/lib/weeklyDigestService'
import { supabase } from '@/integrations/supabase/client'
import type { DigestSettings, DigestPreview } from '@/lib/digestTypes'

export default function WeeklyDigest() {
  const [digestSettings, setDigestSettings] = useState<DigestSettings | null>(null)
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showRecipientManager, setShowRecipientManager] = useState(false)
  const [digestPreview, setDigestPreview] = useState<DigestPreview | null>(null)
  const [sendingTest, setSendingTest] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [familyId, setFamilyId] = useState<string | null>(null)
  const { track } = useAnalytics()
  const { toast } = useToast()

  useEffect(() => {
    loadDigestSettings()
    loadUserProfile()
  }, [])

  const loadDigestSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const settings = await weeklyDigestService.getSettings(user.id)
      setDigestSettings(settings)

      // Get user's family ID
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (memberData) {
        setFamilyId(memberData.family_id)
      }
    } catch (error) {
      console.error('Error loading digest settings:', error)
    }
  }

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!digestSettings || !familyId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (enabled) {
        await weeklyDigestService.enableDigest(user.id, familyId)
      } else {
        await weeklyDigestService.disableDigest(user.id)
      }

      await loadDigestSettings()
      track('weekly_digest_toggled', { enabled })
      
      toast({
        title: enabled ? 'Digest Enabled' : 'Digest Disabled',
        description: enabled 
          ? 'You will receive weekly family updates' 
          : 'Weekly digest has been turned off'
      })
    } catch (error) {
      console.error('Error toggling digest:', error)
      toast({
        title: 'Error',
        description: 'Failed to update digest settings',
        variant: 'destructive'
      })
    }
  }

  const handleScheduleChange = async (newSchedule: string) => {
    if (!digestSettings) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const scheduleMap: { [key: string]: { day: number; hour: number } } = {
        'sunday': { day: 0, hour: 9 },
        'monday': { day: 1, hour: 9 },
        'friday': { day: 5, hour: 18 }
      }

      const schedule = scheduleMap[newSchedule]
      await weeklyDigestService.updateSchedule(user.id, schedule.day, schedule.hour)
      await loadDigestSettings()
      
      track('weekly_digest_schedule_changed', { schedule: newSchedule })
      
      toast({
        title: 'Schedule Updated',
        description: `Digest will be sent on ${scheduleOptions.find(o => o.value === newSchedule)?.label}`
      })
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive'
      })
    }
  }

  const handleCustomizeClick = () => {
    track('weekly_digest_settings_opened')
    setShowCustomizeDialog(true)
  }

  const handleSaveSettings = async () => {
    if (!digestSettings) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await weeklyDigestService.updateSettings(user.id, {
        content_settings: digestSettings.content_settings
      })

      await loadDigestSettings()
      
      toast({
        title: "Settings saved",
        description: "Your weekly digest preferences have been updated."
      })
      
      setShowCustomizeDialog(false)
      track('weekly_digest_settings_saved', { settings: digestSettings.content_settings })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      })
    }
  }

  const handleContentSettingChange = (setting: string, value: boolean) => {
    if (!digestSettings) return

    setDigestSettings(prev => prev ? {
      ...prev,
      content_settings: {
        ...prev.content_settings,
        [setting]: value
      }
    } : prev)
  }

  const handlePreviewDigest = async () => {
    if (!familyId) return

    try {
      const preview = await weeklyDigestService.generatePreview(familyId)
      setDigestPreview(preview)
      setShowPreviewModal(true)
      track('weekly_digest_preview_opened')
    } catch (error) {
      console.error('Error generating preview:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive'
      })
    }
  }

  const handleSendTestCopy = async () => {
    if (!userEmail) return

    setSendingTest(true)
    try {
      const { error } = await supabase.functions.invoke('send-digest-preview', {
        body: {
          email: userEmail,
          family_name: 'Your Family'
        }
      })

      if (error) throw error

      toast({
        title: '📧 Test Sent!',
        description: `Digest preview sent to ${userEmail}`,
      })
      
      track('weekly_digest_test_sent')
    } catch (error) {
      console.error('Error sending test:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setSendingTest(false)
    }
  }

  const handleUpdateRecipients = async (recipients: string[] | { all: boolean; exclude: string[] }) => {
    if (!digestSettings) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await weeklyDigestService.updateSettings(user.id, {
        recipients
      })

      await loadDigestSettings()
      track('weekly_digest_recipients_updated')
    } catch (error) {
      console.error('Error updating recipients:', error)
      toast({
        title: 'Error',
        description: 'Failed to update recipients',
        variant: 'destructive'
      })
    }
  }

  const scheduleOptions = [
    { value: 'sunday', label: 'Sunday morning' },
    { value: 'monday', label: 'Monday morning' },
    { value: 'friday', label: 'Friday evening' }
  ]

  const getCurrentSchedule = () => {
    if (!digestSettings) return 'sunday'
    
    if (digestSettings.delivery_day === 0) return 'sunday'
    if (digestSettings.delivery_day === 1) return 'monday'
    if (digestSettings.delivery_day === 5) return 'friday'
    return 'sunday'
  }

  const getRecipientCount = () => {
    if (!digestSettings?.recipients) return 0
    
    if (Array.isArray(digestSettings.recipients)) {
      return digestSettings.recipients.length
    } else if (digestSettings.recipients.all) {
      // This would need actual family member count - simplified for now
      return 'all family members'
    }
    return 0
  }

  if (!digestSettings) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Weekly Digest
          </CardTitle>
          <Switch
            checked={digestSettings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {digestSettings.enabled ? (
          <>
            {/* Metrics Summary */}
            {familyId && (
              <DigestMetricsSummary familyId={familyId} className="bg-muted/30" />
            )}
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Delivery schedule</span>
              </div>
              
              <div className="space-y-2">
                {scheduleOptions.map((option) => (
                  <label 
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value={option.value}
                      checked={getCurrentSchedule() === option.value}
                      onChange={(e) => handleScheduleChange(e.target.value)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recipients</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecipientManager(true)}
                  className="h-6 px-2 text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sending to {getRecipientCount()} recipients
              </p>
            </div>

            <div className="pt-3 border-t">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Next digest: {digestSettings.last_sent_at ? 
                    new Date(new Date(digestSettings.last_sent_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    : 'This weekend'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Content: {Object.entries(digestSettings.content_settings).filter(([_, enabled]) => enabled).map(([key]) => key).join(', ')}
                </p>
              </div>
            </div>
            
            {/* Enhanced Quick Actions */}
            <DigestQuickActions
              onPreviewDigest={handlePreviewDigest}
              onSendTest={handleSendTestCopy}
              onCustomizeContent={handleCustomizeClick}
              onManageRecipients={() => setShowRecipientManager(true)}
              sendingTest={sendingTest}
              recipientCount={getRecipientCount()}
              nextDigestDate={digestSettings.last_sent_at ? 
                new Date(new Date(digestSettings.last_sent_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                : 'This weekend'
              }
            />
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Get a weekly summary of your family's stories and activities
            </p>
            <Button 
              size="sm"
              onClick={() => handleToggle(true)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Enable digest
            </Button>
          </div>
        )}
      </CardContent>

      {/* Customize Content Dialog */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Weekly Digest</DialogTitle>
            <DialogDescription>
              Choose what content to include in your weekly family digest
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Content Types */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Content Types</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-stories" className="text-sm">New stories</Label>
                  <Switch
                    id="include-stories"
                    checked={digestSettings.content_settings.stories}
                    onCheckedChange={(checked) => handleContentSettingChange('stories', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-photos" className="text-sm">New photos</Label>
                  <Switch
                    id="include-photos"
                    checked={digestSettings.content_settings.photos}
                    onCheckedChange={(checked) => handleContentSettingChange('photos', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-comments" className="text-sm">Comments</Label>
                  <Switch
                    id="include-comments"
                    checked={digestSettings.content_settings.comments}
                    onCheckedChange={(checked) => handleContentSettingChange('comments', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-reactions" className="text-sm">Reactions</Label>
                  <Switch
                    id="include-reactions"
                    checked={digestSettings.content_settings.reactions}
                    onCheckedChange={(checked) => handleContentSettingChange('reactions', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Special Content */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Special Content</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-birthdays" className="text-sm">Upcoming birthdays</Label>
                  <Switch
                    id="include-birthdays"
                    checked={digestSettings.content_settings.birthdays}
                    onCheckedChange={(checked) => handleContentSettingChange('birthdays', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-highlights" className="text-sm">Weekly highlights</Label>
                  <Switch
                    id="include-highlights"
                    checked={digestSettings.content_settings.highlights}
                    onCheckedChange={(checked) => handleContentSettingChange('highlights', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {digestPreview && (
        <DigestPreviewModal
          preview={digestPreview}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          familyName="Your Family"
        />
      )}

      {/* Enhanced Recipient Manager */}
      {familyId && (
        <EnhancedDigestRecipientManager
          isOpen={showRecipientManager}
          onClose={() => setShowRecipientManager(false)}
          familyId={familyId}
          currentRecipients={digestSettings.recipients}
          onUpdateRecipients={handleUpdateRecipients}
        />
      )}
    </Card>
  )
}