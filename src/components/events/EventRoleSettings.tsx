import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import {
  EventAcl,
  EventRole,
  getEventAcl,
  updateEventRole,
  revokeEventAccess
} from '@/lib/eventAclService'

interface EventRoleSettingsProps {
  eventId: string
  familyId: string
  isOpen: boolean
  onClose: () => void
}

interface AclWithProfile extends EventAcl {
  profile?: {
    full_name: string
    email: string
  }
}

export const EventRoleSettings: React.FC<EventRoleSettingsProps> = ({
  eventId,
  familyId,
  isOpen,
  onClose
}) => {
  const [aclEntries, setAclEntries] = useState<AclWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { track } = useAnalytics()

  useEffect(() => {
    if (isOpen) {
      loadAclWithProfiles()
    }
  }, [isOpen, eventId])

  const loadAclWithProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('event_acl')
        .select(`
          *,
          profiles!event_acl_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map the profiles relation correctly
      const mappedData = (data || []).map(entry => ({
        ...entry,
        role: entry.role as EventRole,
        profile: Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
      }))

      setAclEntries(mappedData as AclWithProfile[])
    } catch (error) {
      console.error('Error loading ACL:', error)
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: EventRole) => {
    try {
      const result = await updateEventRole(eventId, userId, newRole)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Role updated',
        description: 'Event permissions updated successfully'
      })

      track('event_role_changed' as any, {
        event_id: eventId,
        new_role: newRole,
        user_id: userId
      })

      loadAclWithProfiles()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      })
    }
  }

  const handleRevoke = async (userId: string) => {
    try {
      const result = await revokeEventAccess(eventId, userId)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: 'Access revoked',
        description: 'User access removed successfully'
      })

      track('event_access_revoked' as any, {
        event_id: eventId,
        user_id: userId
      })

      loadAclWithProfiles()
    } catch (error) {
      console.error('Error revoking access:', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        variant: 'destructive'
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'contributor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'viewer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'guest':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Event Access</DialogTitle>
          <DialogDescription>
            Control who can view and contribute to this event
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : aclEntries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No access permissions set yet</p>
            <p className="text-sm mt-2">Use the invite feature to add people</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aclEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">
                      {entry.profile?.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {entry.profile?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.profile?.email || entry.guest_session_id || 'No email'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getRoleBadgeColor(entry.role)} border-0`}
                  >
                    {entry.role}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Select
                    value={entry.role}
                    onValueChange={(value) =>
                      entry.user_id && handleRoleChange(entry.user_id, value as EventRole)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => entry.user_id && handleRevoke(entry.user_id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <h4 className="font-medium">Role Descriptions</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              <strong>Contributor:</strong> Can add notes, photos, and videos
            </li>
            <li>
              <strong>Viewer:</strong> Can view content and add comments only
            </li>
            <li>
              <strong>Guest:</strong> View-only access, needs approval to contribute
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
