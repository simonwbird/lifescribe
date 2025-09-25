import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, Plus, Mail, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface DigestRecipientManagerProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  currentRecipients: string[] | { all: boolean; exclude: string[] }
  onUpdateRecipients: (recipients: string[] | { all: boolean; exclude: string[] }) => void
}

interface FamilyMember {
  id: string
  full_name: string
  email: string
  role: string
}

export const DigestRecipientManager = ({ 
  isOpen, 
  onClose, 
  familyId, 
  currentRecipients, 
  onUpdateRecipients 
}: DigestRecipientManagerProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadFamilyMembers()
      initializeSettings()
    }
  }, [isOpen, familyId, currentRecipients])

  const loadFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          profiles:profile_id (
            id,
            full_name,
            email
          ),
          role
        `)
        .eq('family_id', familyId)

      if (error) throw error

      const members = data?.map(member => ({
        id: member.profiles.id,
        full_name: member.profiles.full_name,
        email: member.profiles.email,
        role: member.role
      })) || []

      setFamilyMembers(members)
    } catch (error) {
      console.error('Error loading family members:', error)
      toast({
        title: 'Error',
        description: 'Failed to load family members',
        variant: 'destructive'
      })
    }
  }

  const initializeSettings = () => {
    if (Array.isArray(currentRecipients)) {
      setSendToAll(false)
      setSelectedRecipients(currentRecipients)
      setExcludedMembers([])
    } else if (currentRecipients?.all) {
      setSendToAll(true)
      setSelectedRecipients([])
      setExcludedMembers(currentRecipients.exclude || [])
    } else {
      setSendToAll(false)
      setSelectedRecipients([])
      setExcludedMembers([])
    }
  }

  const handleAddEmail = () => {
    if (newEmail && !selectedRecipients.includes(newEmail)) {
      setSelectedRecipients([...selectedRecipients, newEmail])
      setNewEmail('')
    }
  }

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter(r => r !== email))
  }

  const handleToggleExclude = (memberEmail: string) => {
    if (excludedMembers.includes(memberEmail)) {
      setExcludedMembers(excludedMembers.filter(e => e !== memberEmail))
    } else {
      setExcludedMembers([...excludedMembers, memberEmail])
    }
  }

  const handleSave = () => {
    let updatedRecipients: string[] | { all: boolean; exclude: string[] }

    if (sendToAll) {
      updatedRecipients = {
        all: true,
        exclude: excludedMembers
      }
    } else {
      updatedRecipients = selectedRecipients
    }

    onUpdateRecipients(updatedRecipients)
    toast({
      title: 'Recipients Updated',
      description: 'Digest recipients have been saved successfully.'
    })
    onClose()
  }

  const getRecipientCount = () => {
    if (sendToAll) {
      return familyMembers.length - excludedMembers.length
    }
    return selectedRecipients.length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Manage Digest Recipients
          </DialogTitle>
          <DialogDescription>
            Choose who receives the weekly family digest emails
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Send to All Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Send to all family members</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically include all current and future family members
                </p>
              </div>
              <Switch
                checked={sendToAll}
                onCheckedChange={setSendToAll}
              />
            </div>

            {sendToAll && (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <Label className="text-sm font-medium">Exclude specific members</Label>
                <div className="space-y-2">
                  {familyMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{member.full_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({member.email})</span>
                      </div>
                      <Switch
                        checked={!excludedMembers.includes(member.email)}
                        onCheckedChange={() => handleToggleExclude(member.email)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!sendToAll && (
            <>
              {/* Manual Recipient Selection */}
              <div className="space-y-4">
                <Label className="font-medium">Select specific recipients</Label>
                
                {/* Family Members */}
                <div className="space-y-2">
                  <Label className="text-sm">Family members</Label>
                  <div className="grid gap-2">
                    {familyMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{member.full_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({member.email})</span>
                        </div>
                        <Switch
                          checked={selectedRecipients.includes(member.email)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients([...selectedRecipients, member.email])
                            } else {
                              handleRemoveRecipient(member.email)
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add External Email */}
                <div className="space-y-2">
                  <Label className="text-sm">Add external email</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    />
                    <Button
                      onClick={handleAddEmail}
                      disabled={!newEmail}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Current Recipients */}
                {selectedRecipients.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Current recipients ({selectedRecipients.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipients.map(email => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <button
                            onClick={() => handleRemoveRecipient(email)}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total recipients</span>
              <Badge variant="outline">{getRecipientCount()}</Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Recipients
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}