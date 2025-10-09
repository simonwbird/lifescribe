import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calendar, Mail, Settings, Eye, Send, Users, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { SimpleDigestPreview } from '@/components/home/simple/SimpleDigestPreview'
import DigestQuickActions from './DigestQuickActions'
import { EnhancedDigestRecipientManager } from './EnhancedDigestRecipientManager'
import DigestMetricsSummary from './DigestMetricsSummary'
import SimpleRecipientDisplay from './simple/SimpleRecipientDisplay'
import { DigestFollowPreferences } from './DigestFollowPreferences'
import { weeklyDigestService } from '@/lib/weeklyDigestService'
import { supabase } from '@/integrations/supabase/client'
import type { DigestSettings, DigestPreview } from '@/lib/digestTypes'
import { DEFAULT_DIGEST_SETTINGS } from '@/lib/digestTypes'

export default function WeeklyDigest() {
  const [digestSettings, setDigestSettings] = useState<DigestSettings | null>(null)
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showRecipientManager, setShowRecipientManager] = useState(false)
  const [digestPreview, setDigestPreview] = useState<DigestPreview | null>(null)
  const [sendingTest, setSendingTest] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(true)
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

      // Get user's family ID first
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle()

      if (memberData?.family_id) {
        setFamilyId(memberData.family_id)
        const settings = await weeklyDigestService.getSettingsByFamily(memberData.family_id)
        setDigestSettings(
          settings || ({
            ...(DEFAULT_DIGEST_SETTINGS as DigestSettings),
            family_id: memberData.family_id,
            created_by: user.id
          } as DigestSettings)
        )
      } else {
        setDigestSettings({
          ...(DEFAULT_DIGEST_SETTINGS as DigestSettings),
          family_id: '',
          created_by: user.id
        } as DigestSettings)
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
      return 'All family'
    }
    return 0
  }

  const getUnlockExplanation = () => {
    if (!digestSettings || digestSettings.is_unlocked) return null
    
    const threshold = digestSettings.unlock_threshold || 2
    return {
      threshold,
      message: `Weekly Digest unlocks when ${threshold}+ family members join. This ensures meaningful family stories to share!`,
      action: 'Invite more family members to unlock weekly updates'
    }
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
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-lg font-serif hover:text-primary transition-colors"
          >
            <Mail className="h-5 w-5" />
            Weekly Digest
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <Switch
            checked={digestSettings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-4">
        {digestSettings.enabled ? (
          <>
            {/* Lock Status Warning */}
            {!digestSettings.is_unlocked && (
              <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Digest Currently Locked</span>
                  </div>
                  {getUnlockExplanation() && (
                    <div className="space-y-1">
                      <p className="text-xs text-yellow-700">{getUnlockExplanation()!.message}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/people'}
                        className="h-7 text-xs bg-white hover:bg-yellow-100 border-yellow-300"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Invite Family
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Enhanced Metrics Summary */}
            {familyId && (
              <DigestMetricsSummary familyId={familyId} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200" />
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

            {/* Recipients Section - Enhanced with Visual Display */}
            <SimpleRecipientDisplay
              recipients={digestSettings.recipients || []}
              onManage={() => setShowRecipientManager(true)}
              className="border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50"
            />

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
            
            {/* Enhanced Quick Actions - Simple Mode */}
            <div className="space-y-3 p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
              <div className="text-center">
                <h4 className="text-sm font-semibold text-primary mb-1">Admin Actions</h4>
                <p className="text-xs text-muted-foreground">Test and manage your family digest</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviewDigest}
                  className="gap-2 text-xs h-9 font-medium border-primary/20 hover:border-primary/40"
                  disabled={!familyId}
                >
                  <Eye className="h-4 w-4" />
                  Preview Email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSendTestCopy}
                  disabled={sendingTest || !userEmail}
                  className="gap-2 text-xs h-9 font-medium border-primary/20 hover:border-primary/40"
                >
                  <Send className="h-4 w-4" />
                  {sendingTest ? 'Sending...' : 'Test Email'}
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCustomizeClick}
                  className="text-xs h-7 text-primary hover:text-primary/80"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Customize Content Types
                </Button>
              </div>
            </div>
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
      )}

      {/* Customize Content Dialog */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize Weekly Digest</DialogTitle>
            <DialogDescription>
              Choose what content to include and who to follow in your weekly family digest
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Follow Preferences Section */}
            {familyId && (
              <>
                <DigestFollowPreferences familyId={familyId} />
                <Separator />
              </>
            )}

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

      {/* Enhanced Preview Modal - Simple Mode */}
      {digestPreview && (
        <SimpleDigestPreview
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