import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { 
  Users, 
  Mail, 
  Send, 
  Copy,
  Check,
  Heart,
  UserPlus
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { UpcomingEvent } from '@/lib/eventsService'

interface EventInviteModalProps {
  event: UpcomingEvent | null
  isOpen: boolean
  onClose: () => void
}

interface FamilyMember {
  id: string
  full_name: string
  email: string
  avatar_url?: string
}

export const EventInviteModal = ({ event, isOpen, onClose }: EventInviteModalProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [externalEmails, setExternalEmails] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [includeContributionLink, setIncludeContributionLink] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const { track } = useAnalytics()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && event) {
      loadFamilyMembers()
      generateDefaultMessage()
    }
  }, [isOpen, event])

  const loadFamilyMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user's family ID
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (!memberData) return

      // Get all family members except current user
      const { data: profiles } = await supabase
        .from('members')
        .select(`
          profiles:profile_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('family_id', memberData.family_id)
        .neq('profile_id', user.id)

      if (profiles) {
        const members = profiles
          .filter(m => m.profiles)
          .map(m => m.profiles as FamilyMember)
          .filter(member => member !== null)

        setFamilyMembers(members)
      }
    } catch (error) {
      console.error('Error loading family members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDefaultMessage = () => {
    if (!event) return

    const eventType = event.type === 'birthday' ? 'birthday' : 'special day'
    const message = `Hi! ${event.person_name}'s ${eventType} is coming up on ${new Date(event.date).toLocaleDateString()}. 

I'd love for you to contribute a message, photo, or video to make it extra special! Click the link below to add your contribution:

[Contribution Link]

Looking forward to celebrating together! ❤️`

    setCustomMessage(message)
  }

  const generateContributionLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/events/${event?.id}/contribute`
  }

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === familyMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(familyMembers.map(m => m.id))
    }
  }

  const handleCopyLink = async () => {
    const link = generateContributionLink()
    await navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    
    track('event_contribution_link_copied', { 
      eventType: event?.type,
      eventId: event?.id 
    })
    
    toast({
      title: 'Link copied!',
      description: 'Contribution link copied to clipboard'
    })
  }

  const handleSendInvites = async () => {
    if (!event) return

    if (selectedMembers.length === 0 && !externalEmails.trim()) {
      toast({
        title: 'Select recipients',
        description: 'Please select family members or add email addresses',
        variant: 'destructive'
      })
      return
    }

    setIsSending(true)

    try {
      const contributionLink = generateContributionLink()
      let finalMessage = customMessage

      if (includeContributionLink) {
        finalMessage = finalMessage.replace('[Contribution Link]', contributionLink)
      } else {
        finalMessage = finalMessage.replace('\n\n[Contribution Link]\n\n', '\n\n')
      }

      // Collect all email addresses
      const emails: string[] = []
      
      // Add selected family member emails
      selectedMembers.forEach(memberId => {
        const member = familyMembers.find(m => m.id === memberId)
        if (member?.email) {
          emails.push(member.email)
        }
      })

      // Add external emails
      if (externalEmails.trim()) {
        const externalList = externalEmails
          .split(/[,\n]/)
          .map(email => email.trim())
          .filter(email => email.length > 0)
        emails.push(...externalList)
      }

      // Send invitations (this would need an edge function)
      const { error } = await supabase.functions.invoke('send-event-invites', {
        body: {
          event_id: event.id,
          event_name: `${event.person_name}'s ${event.type === 'birthday' ? 'Birthday' : 'Event'}`,
          event_date: event.date,
          emails,
          message: finalMessage,
          contribution_link: includeContributionLink ? contributionLink : null
        }
      })

      if (error) throw error

      track('event_invites_sent', {
        eventType: event.type,
        recipientCount: emails.length,
        familyMemberCount: selectedMembers.length,
        externalEmailCount: emails.length - selectedMembers.length,
        eventId: event.id
      })

      toast({
        title: '📨 Invites Sent!',
        description: `Invitations sent to ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`
      })

      onClose()

    } catch (error) {
      console.error('Error sending invites:', error)
      toast({
        title: 'Error',
        description: 'Failed to send invitations. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Family to Contribute
          </DialogTitle>
          <DialogDescription>
            Invite family members to add messages, photos, or videos for {event.person_name}'s {event.type === 'birthday' ? 'birthday' : 'event'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Family Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Family Members</Label>
              {familyMembers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedMembers.length === familyMembers.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : familyMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No other family members found
              </p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {familyMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Switch
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => {}} // Controlled by parent click
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Emails */}
          <div className="space-y-2">
            <Label htmlFor="external-emails">Additional Email Addresses</Label>
            <Textarea
              id="external-emails"
              placeholder="Enter email addresses (one per line or comma-separated)&#10;example@email.com, another@email.com"
              value={externalEmails}
              onChange={(e) => setExternalEmails(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Add external email addresses for friends or extended family
            </p>
          </div>

          {/* Message Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-message">Invitation Message</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeContributionLink}
                  onCheckedChange={setIncludeContributionLink}
                />
                <Label className="text-xs">Include contribution link</Label>
              </div>
            </div>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              placeholder="Write a personal message to include with the invitation..."
            />
          </div>

          {/* Contribution Link */}
          {includeContributionLink && (
            <div className="space-y-2">
              <Label>Contribution Link</Label>
              <div className="flex gap-2">
                <Input
                  value={generateContributionLink()}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will allow recipients to add their contributions directly
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Invitation Summary</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• {selectedMembers.length} family members selected</p>
              {externalEmails.trim() && (
                <p>• {externalEmails.split(/[,\n]/).filter(email => email.trim()).length} external emails</p>
              )}
              <p>• Message includes {includeContributionLink ? 'contribution link' : 'custom message only'}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendInvites} disabled={isSending}>
            {isSending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitations
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}