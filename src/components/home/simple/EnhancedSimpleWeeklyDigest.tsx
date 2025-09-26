import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, Mail, Settings, Eye, Send, Users, Lock, CheckCircle2 } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { weeklyDigestService } from '@/lib/weeklyDigestService'
import EnhancedDigestContributions from '@/components/digest/EnhancedDigestContributions'
import type { DigestSettings, DigestPreview } from '@/lib/digestTypes'

export default function EnhancedSimpleWeeklyDigest() {
  const [digestSettings, setDigestSettings] = useState<DigestSettings | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [digestPreview, setDigestPreview] = useState<DigestPreview | null>(null)
  const [sendingTest, setSendingTest] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState('')
  const [lastActionSummary, setLastActionSummary] = useState<{
    action: string
    details: string
  } | null>(null)

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

      // Get user's family info
      const { data: memberData } = await supabase
        .from('members')
        .select(`
          family_id,
          families:family_id (name)
        `)
        .eq('profile_id', user.id)
        .single()

      if (memberData) {
        setFamilyId(memberData.family_id)
        setFamilyName(memberData.families?.name || 'Your Family')
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
      
      setLastActionSummary({
        action: enabled ? 'Digest Enabled' : 'Digest Disabled',
        details: enabled 
          ? 'Weekly family updates will be sent to all members'
          : 'Weekly digest has been turned off'
      })
      setShowConfirmation(true)
    } catch (error) {
      console.error('Error toggling digest:', error)
      toast({
        title: 'Error',
        description: 'Failed to update digest settings',
        variant: 'destructive'
      })
    }
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
          family_name: familyName
        }
      })

      if (error) throw error

      setLastActionSummary({
        action: 'Test Email Sent',
        details: `Preview digest sent to ${userEmail}`
      })
      setShowConfirmation(true)
      
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

  const getStoryCount = async () => {
    if (!familyId) return 0
    
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { count } = await supabase
      .from('stories')
      .select('id', { count: 'exact' })
      .eq('family_id', familyId)
      .gte('created_at', oneWeekAgo.toISOString())
    
    return count || 0
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
    <>
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
              {/* Lock Status Warning */}
              {!digestSettings.is_unlocked && (
                <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Digest Currently Locked</span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      Weekly Digest unlocks when 2+ family members join. This ensures meaningful family stories to share!
                    </p>
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
                </div>
              )}
              
              {/* Status Info with Contributions Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Next digest: This weekend</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Includes: New stories, photos, and comments from this week
                </p>
                
                {/* Weekly Contributions Preview */}
                {familyId && (
                  <EnhancedDigestContributions
                    familyId={familyId}
                    startDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
                    endDate={new Date().toISOString()}
                    showPreview={true}
                    maxItems={3}
                  />
                )}
              </div>
              
              {/* Admin Actions - Simple Style */}
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
                  >
                    <Eye className="h-4 w-4" />
                    Preview Digest
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSendTestCopy}
                    disabled={sendingTest || !userEmail}
                    className="gap-2 text-xs h-9 font-medium border-primary/20 hover:border-primary/40"
                  >
                    <Send className="h-4 w-4" />
                    {sendingTest ? 'Sending...' : 'Test Send'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* No Stories Placeholder */}
              <div className="text-center py-6 space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">No new memories this week</h3>
                  <p className="text-xs text-muted-foreground">But stay tuned for future family updates!</p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleToggle(true)}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Enable Weekly Digest
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weekly Digest Preview</DialogTitle>
            <DialogDescription>
              This is how your family's weekly digest will look
            </DialogDescription>
          </DialogHeader>
          
          {digestPreview && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Weekly Family Digest</h3>
                <div className="space-y-2 text-sm">
                  <div>Stories this week: {digestPreview.stories || 0}</div>
                  <div>Comments: {digestPreview.comments || 0}</div>
                  <div>Photos: {digestPreview.photos || 0}</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                This digest will be sent to all family members who have opted in.
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreviewModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle>{lastActionSummary?.action}</DialogTitle>
                <DialogDescription>
                  {lastActionSummary?.details}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {lastActionSummary?.action.includes('Enabled') && digestSettings && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-semibold">Digest Summary</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Delivery: Every Sunday morning</div>
                <div>• Recipients: All family members</div>
                <div>• Content: Stories, photos, and comments</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowConfirmation(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Also export as WeeklyDigest for compatibility
export { EnhancedSimpleWeeklyDigest as WeeklyDigest }