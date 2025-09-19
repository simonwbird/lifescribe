import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Play, Pause, Send, Eye, Calendar, Clock, Users, Settings, History, Lock, Unlock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { weeklyDigestService } from '@/lib/weeklyDigestService'
import { DigestSettings, DigestPreview, DigestSendLog, DIGEST_SCHEDULE_OPTIONS, DIGEST_HOUR_OPTIONS, DEFAULT_DIGEST_SETTINGS } from '@/lib/digestTypes'
import { DigestPreviewModal } from './DigestPreviewModal'
import { DigestHistoryModal } from './DigestHistoryModal'

interface DigestSchedulerProps {
  familyId: string
  familyName: string
  memberCount: number
}

export const DigestScheduler = ({ familyId, familyName, memberCount }: DigestSchedulerProps) => {
  const [settings, setSettings] = useState<DigestSettings | null>(null)
  const [preview, setPreview] = useState<DigestPreview | null>(null)
  const [history, setHistory] = useState<DigestSendLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const { toast } = useToast()
  const { track } = useAnalytics()

  useEffect(() => {
    loadSettings()
  }, [familyId])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      // For now, use a mock user ID - in real app this would come from auth
      const mockUserId = 'mock-user-id'
      const digestSettings = await weeklyDigestService.getSettings(mockUserId)
      
      if (digestSettings && digestSettings.family_id === familyId) {
        setSettings(digestSettings)
      } else {
        // Create default settings for this family
        const defaultSettings: DigestSettings = {
          ...DEFAULT_DIGEST_SETTINGS,
          family_id: familyId,
          created_by: mockUserId
        } as DigestSettings
        setSettings(defaultSettings)
      }

      // Check unlock status
      const isUnlocked = await weeklyDigestService.checkUnlockStatus(familyId)
      if (settings) {
        setSettings(prev => prev ? { ...prev, is_unlocked: isUnlocked } : null)
      }
    } catch (error) {
      console.error('Error loading digest settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load digest settings',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const mockUserId = 'mock-user-id'
      await weeklyDigestService.updateSettings(mockUserId, settings)
      
      await track('digest_scheduled', {
        family_id: familyId,
        delivery_day: settings.delivery_day,
        delivery_hour: settings.delivery_hour,
        enabled: settings.enabled
      })

      toast({
        title: 'Settings saved',
        description: 'Digest settings have been updated successfully'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save digest settings',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePauseResume = async () => {
    if (!settings) return

    try {
      const mockUserId = 'mock-user-id'
      
      if (settings.is_paused) {
        await weeklyDigestService.resumeDigest(mockUserId, familyId)
        await track('digest_resumed', { family_id: familyId })
        toast({
          title: 'Digest resumed',
          description: 'Weekly digest has been resumed for this family'
        })
      } else {
        await weeklyDigestService.pauseDigest(mockUserId, familyId, pauseReason)
        await track('digest_paused', { family_id: familyId, reason: pauseReason })
        toast({
          title: 'Digest paused',
          description: 'Weekly digest has been paused for this family'
        })
      }
      
      await loadSettings()
      setPauseReason('')
    } catch (error) {
      console.error('Error pausing/resuming digest:', error)
      toast({
        title: 'Error',
        description: 'Failed to update digest status',
        variant: 'destructive'
      })
    }
  }

  const handleForceSend = async () => {
    if (!settings) return

    try {
      const mockUserId = 'mock-user-id'
      await weeklyDigestService.forceSendDigest(mockUserId, familyId)
      
      await track('digest_forced_send', { 
        family_id: familyId,
        family_name: familyName 
      })

      toast({
        title: 'Digest sent',
        description: 'Weekly digest has been sent immediately'
      })

      await loadSettings()
    } catch (error) {
      console.error('Error force sending digest:', error)
      toast({
        title: 'Error',
        description: 'Failed to send digest. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleShowPreview = async () => {
    try {
      const previewData = await weeklyDigestService.generatePreview(familyId)
      setPreview(previewData)
      setShowPreview(true)
    } catch (error) {
      console.error('Error generating preview:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate digest preview',
        variant: 'destructive'
      })
    }
  }

  const handleShowHistory = async () => {
    try {
      const historyData = await weeklyDigestService.getDigestHistory(familyId)
      setHistory(historyData)
      setShowHistory(true)
    } catch (error) {
      console.error('Error loading digest history:', error)
      toast({
        title: 'Error',
        description: 'Failed to load digest history',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading digest settings...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load digest settings</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isUnlocked = settings.is_unlocked || memberCount >= settings.unlock_threshold

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Weekly Digest - {familyName}
      </CardTitle>
      <CardDescription>
        Manage weekly digest settings for this family
      </CardDescription>
    </div>
    <div className="flex items-center gap-2">
      {isUnlocked ? (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Unlock className="h-3 w-3" />
          Unlocked
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Locked ({memberCount}/{settings.unlock_threshold} members)
        </Badge>
      )}
      {settings.is_paused && (
        <Badge variant="destructive">Paused</Badge>
      )}
    </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delivery Day</Label>
                  <Select 
                    value={settings.delivery_day.toString()} 
                    onValueChange={(value) => setSettings(prev => prev ? { ...prev, delivery_day: parseInt(value) } : null)}
                    disabled={!isUnlocked}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIGEST_SCHEDULE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Time</Label>
                  <Select 
                    value={settings.delivery_hour.toString()} 
                    onValueChange={(value) => setSettings(prev => prev ? { ...prev, delivery_hour: parseInt(value) } : null)}
                    disabled={!isUnlocked}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIGEST_HOUR_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={settings.delivery_timezone}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, delivery_timezone: e.target.value } : null)}
                  disabled={!isUnlocked}
                  placeholder="America/New_York"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => setSettings(prev => prev ? { ...prev, enabled } : null)}
                  disabled={!isUnlocked}
                />
                <Label>Enable weekly digest</Label>
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="text-sm text-muted-foreground">
                  Recipients are automatically determined by family members with email notifications enabled.
                </div>
                <div className="p-3 border rounded-md bg-muted">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {memberCount} family members will receive the digest
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-4">
                <Label>Content Settings</Label>
                <div className="space-y-3">
                  {Object.entries(settings.content_settings).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => 
                          setSettings(prev => prev ? {
                            ...prev,
                            content_settings: { ...prev.content_settings, [key]: checked }
                          } : null)
                        }
                        disabled={!isUnlocked}
                      />
                      <Label className="capitalize">{key}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Unlock Threshold</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.unlock_threshold}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, unlock_threshold: parseInt(e.target.value) || 2 } : null)}
                  disabled={!isUnlocked}
                />
                <div className="text-sm text-muted-foreground">
                  Minimum number of family members required to unlock digest features
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleShowPreview}
                  disabled={!isUnlocked}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Digest
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleShowHistory}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  View History
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={!isUnlocked}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Force Send Now
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Force Send Digest?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately send the weekly digest to all family members, 
                        regardless of the scheduled time. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleForceSend}>
                        Send Now
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant={settings.is_paused ? "default" : "outline"}
                      disabled={!isUnlocked}
                      className="flex items-center gap-2"
                    >
                      {settings.is_paused ? (
                        <>
                          <Play className="h-4 w-4" />
                          Resume Digest
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause Digest
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {settings.is_paused ? 'Resume' : 'Pause'} Weekly Digest?
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <p>
                            {settings.is_paused 
                              ? 'This will resume the weekly digest for this family.'
                              : 'This will pause the weekly digest for this family until you resume it.'
                            }
                          </p>
                          {!settings.is_paused && (
                            <div className="space-y-2">
                              <Label>Reason (optional)</Label>
                              <Textarea
                                placeholder="Enter reason for pausing..."
                                value={pauseReason}
                                onChange={(e) => setPauseReason(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePauseResume}>
                        {settings.is_paused ? 'Resume' : 'Pause'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {settings.is_paused && settings.pause_reason && (
                <div className="p-3 border rounded-md bg-destructive/10">
                  <div className="text-sm">
                    <strong>Paused:</strong> {settings.pause_reason}
                  </div>
                  {settings.paused_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Paused on {new Date(settings.paused_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving || !isUnlocked}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <DigestPreviewModal
          preview={preview}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          familyName={familyName}
        />
      )}

      {history && (
        <DigestHistoryModal
          history={history}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          familyName={familyName}
        />
      )}
    </div>
  )
}