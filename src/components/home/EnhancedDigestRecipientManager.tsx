import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Plus, Mail, UserPlus, Shield, Eye, Edit, Crown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface EnhancedDigestRecipientManagerProps {
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
  avatar_url?: string
  role: string
  digestRole?: 'viewer' | 'contributor' | 'admin'
}

interface ExternalRecipient {
  email: string
  role: 'viewer' | 'contributor' | 'admin'
  addedBy?: string
  addedAt?: string
}

export const EnhancedDigestRecipientManager = ({ 
  isOpen, 
  onClose, 
  familyId, 
  currentRecipients, 
  onUpdateRecipients 
}: EnhancedDigestRecipientManagerProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [externalRecipients, setExternalRecipients] = useState<ExternalRecipient[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRecipientRole, setNewRecipientRole] = useState<'viewer' | 'contributor' | 'admin'>('viewer')
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  const [memberRoles, setMemberRoles] = useState<Record<string, 'viewer' | 'contributor' | 'admin'>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadFamilyMembers()
      loadExternalRecipients()
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
            email,
            avatar_url
          ),
          role
        `)
        .eq('family_id', familyId)

      if (error) throw error

      const members = data?.map(member => ({
        id: member.profiles.id,
        full_name: member.profiles.full_name,
        email: member.profiles.email,
        avatar_url: member.profiles.avatar_url,
        role: member.role
      })) || []

      setFamilyMembers(members)

      // Initialize member roles
      const roles = members.reduce((acc, member) => {
        acc[member.email] = member.role === 'admin' ? 'admin' : 'contributor'
        return acc
      }, {} as Record<string, 'viewer' | 'contributor' | 'admin'>)
      setMemberRoles(roles)
    } catch (error) {
      console.error('Error loading family members:', error)
      toast({
        title: 'Error',
        description: 'Failed to load family members',
        variant: 'destructive'
      })
    }
  }

  const loadExternalRecipients = async () => {
    // For now, we'll manage external recipients in component state
    // In a real app, you might store these in a separate table
    const storedRecipients = localStorage.getItem(`digest-external-${familyId}`)
    if (storedRecipients) {
      setExternalRecipients(JSON.parse(storedRecipients))
    }
  }

  const saveExternalRecipients = (recipients: ExternalRecipient[]) => {
    localStorage.setItem(`digest-external-${familyId}`, JSON.stringify(recipients))
    setExternalRecipients(recipients)
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

  const handleAddExternalRecipient = () => {
    if (newEmail && !externalRecipients.find(r => r.email === newEmail)) {
      const newRecipient: ExternalRecipient = {
        email: newEmail,
        role: newRecipientRole,
        addedAt: new Date().toISOString()
      }
      const updated = [...externalRecipients, newRecipient]
      saveExternalRecipients(updated)
      setSelectedRecipients([...selectedRecipients, newEmail])
      setNewEmail('')
      setNewRecipientRole('viewer')
    }
  }

  const handleRemoveExternalRecipient = (email: string) => {
    const updated = externalRecipients.filter(r => r.email !== email)
    saveExternalRecipients(updated)
    setSelectedRecipients(selectedRecipients.filter(r => r !== email))
  }

  const handleUpdateExternalRole = (email: string, role: 'viewer' | 'contributor' | 'admin') => {
    const updated = externalRecipients.map(r => 
      r.email === email ? { ...r, role } : r
    )
    saveExternalRecipients(updated)
  }

  const handleToggleExclude = (memberEmail: string) => {
    if (excludedMembers.includes(memberEmail)) {
      setExcludedMembers(excludedMembers.filter(e => e !== memberEmail))
    } else {
      setExcludedMembers([...excludedMembers, memberEmail])
    }
  }

  const handleUpdateMemberRole = (email: string, role: 'viewer' | 'contributor' | 'admin') => {
    setMemberRoles(prev => ({ ...prev, [email]: role }))
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-600" />
      case 'contributor':
        return <Edit className="h-3 w-3 text-blue-600" />
      case 'viewer':
        return <Eye className="h-3 w-3 text-green-600" />
      default:
        return <Shield className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800'
      case 'contributor':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecipientCount = () => {
    if (sendToAll) {
      return familyMembers.length - excludedMembers.length + externalRecipients.length
    }
    return selectedRecipients.length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Manage Digest Recipients & Roles
          </DialogTitle>
          <DialogDescription>
            Choose who receives the weekly family digest and set their access levels
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Family Members</TabsTrigger>
            <TabsTrigger value="external">External Recipients</TabsTrigger>
            <TabsTrigger value="settings">Delivery Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {/* Send to All Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
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

            {/* Family Members List */}
            <div className="space-y-3">
              <Label className="font-medium">Family Members ({familyMembers.length})</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {familyMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        <AvatarFallback>
                          {member.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.full_name}
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Digest Role Selection */}
                      <Select
                        value={memberRoles[member.email] || 'contributor'}
                        onValueChange={(value: 'viewer' | 'contributor' | 'admin') => 
                          handleUpdateMemberRole(member.email, value)
                        }
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Viewer
                            </div>
                          </SelectItem>
                          <SelectItem value="contributor">
                            <div className="flex items-center gap-1">
                              <Edit className="h-3 w-3" />
                              Contributor
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Include/Exclude Toggle */}
                      <Switch
                        checked={sendToAll ? !excludedMembers.includes(member.email) : selectedRecipients.includes(member.email)}
                        onCheckedChange={(checked) => {
                          if (sendToAll) {
                            handleToggleExclude(member.email)
                          } else {
                            if (checked) {
                              setSelectedRecipients([...selectedRecipients, member.email])
                            } else {
                              setSelectedRecipients(selectedRecipients.filter(r => r !== member.email))
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="external" className="space-y-4">
            {/* Add External Recipient */}
            <div className="space-y-3">
              <Label className="font-medium">Add External Recipient</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddExternalRecipient()}
                  className="flex-1"
                />
                <Select
                  value={newRecipientRole}
                  onValueChange={(value: 'viewer' | 'contributor' | 'admin') => setNewRecipientRole(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddExternalRecipient}
                  disabled={!newEmail}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* External Recipients List */}
            {externalRecipients.length > 0 && (
              <div className="space-y-3">
                <Label className="font-medium">External Recipients ({externalRecipients.length})</Label>
                <div className="space-y-2">
                  {externalRecipients.map(recipient => (
                    <div key={recipient.email} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {recipient.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{recipient.email}</div>
                          <div className="text-sm text-muted-foreground">External recipient</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(recipient.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(recipient.role)}
                            {recipient.role}
                          </div>
                        </Badge>
                        <Select
                          value={recipient.role}
                          onValueChange={(value: 'viewer' | 'contributor' | 'admin') => 
                            handleUpdateExternalRole(recipient.email, value)
                          }
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="contributor">Contributor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExternalRecipient(recipient.email)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Role Descriptions */}
            <div className="space-y-3">
              <Label className="font-medium">Recipient Role Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Eye className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Viewer</div>
                    <div className="text-xs text-muted-foreground">
                      Receives digest emails only. Cannot manage settings.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Edit className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">Contributor</div>
                    <div className="text-xs text-muted-foreground">
                      Can customize their own digest preferences and content.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-sm">Admin</div>
                    <div className="text-xs text-muted-foreground">
                      Full access to digest settings and recipient management.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Total Recipients</span>
                <Badge variant="outline">{getRecipientCount()}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {sendToAll ? 'Sending to all family members' : `${selectedRecipients.length} specific recipients selected`}
                {externalRecipients.length > 0 && ` • ${externalRecipients.length} external recipients`}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Recipients & Roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}