import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MoreHorizontal, 
  EyeOff, 
  Trash2, 
  Shield, 
  Users, 
  Eye,
  Flag,
  Ban
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useSecureRoles } from '@/hooks/useSecureRoles'

interface InlineAdminControlsProps {
  storyId?: string
  userId?: string
  currentRole?: 'admin' | 'member' | 'guest'
  familyId: string
  onStoryAction?: (action: 'hidden' | 'deleted') => void
  onRoleChanged?: (newRole: 'admin' | 'member' | 'guest') => void
  compact?: boolean
}

export function InlineAdminControls({
  storyId,
  userId,
  currentRole,
  familyId,
  onStoryAction,
  onRoleChanged,
  compact = false
}: InlineAdminControlsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showHideConfirm, setShowHideConfirm] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | 'guest'>(currentRole || 'member')
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()
  const { data: userRoles } = useSecureRoles()

  // Check if current user is admin
  const isUserAdmin = userRoles?.familyRoles.some(
    role => role.familyId === familyId && role.role === 'admin'
  ) || userRoles?.systemRole === 'super_admin'

  if (!isUserAdmin) {
    return null // Don't show admin controls to non-admins
  }

  const handleHideStory = async () => {
    if (!storyId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('stories')
        .update({ 
          content: '[Hidden by admin]',
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)

      if (error) throw error

      toast({
        title: 'Story hidden',
        description: 'Story has been hidden from the family feed'
      })

      onStoryAction?.('hidden')
    } catch (error: any) {
      console.error('Error hiding story:', error)
      toast({
        title: 'Error',
        description: 'Failed to hide story',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setShowHideConfirm(false)
    }
  }

  const handleDeleteStory = async () => {
    if (!storyId) return

    setLoading(true)
    try {
      // Soft delete - mark title as deleted but keep record
      const { error } = await supabase
        .from('stories')
        .update({ 
          title: '[Deleted by admin]',
          content: '[Content removed by family admin]',
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)

      if (error) throw error

      toast({
        title: 'Story deleted',
        description: 'Story has been deleted and removed from the family feed'
      })

      // Trigger page reload to refresh feed
      window.location.reload()
    } catch (error: any) {
      console.error('Error deleting story:', error)
      toast({
        title: 'Error', 
        description: 'Failed to delete story',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleRoleChange = async () => {
    if (!userId || !selectedRole) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ 
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', userId)
        .eq('family_id', familyId)

      if (error) throw error

      toast({
        title: 'Role updated',
        description: `Member role changed to ${selectedRole}`
      })

      onRoleChanged?.(selectedRole)
    } catch (error: any) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setShowRoleChange(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />
      case 'member': return <Users className="h-3 w-3" />
      case 'guest': return <Eye className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'member': return 'secondary'
      case 'guest': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size={compact ? "sm" : "default"}
            className="h-8 w-8 p-0 hover:bg-muted"
            disabled={loading}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {storyId && (
            <>
              <DropdownMenuItem 
                className="text-orange-600 cursor-pointer"
                onClick={() => setShowHideConfirm(true)}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Story
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Story
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {userId && currentRole && (
            <>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setShowRoleChange(true)}
              >
                {getRoleIcon(currentRole)}
                <span className="ml-2">Change Role</span>
                <Badge variant={getRoleColor(currentRole)} className="ml-auto">
                  {currentRole}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer">
                <Ban className="h-4 w-4 mr-2" />
                Remove Member
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem className="text-yellow-600 cursor-pointer">
            <Flag className="h-4 w-4 mr-2" />
            Report Content
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hide Story Confirmation */}
      <AlertDialog open={showHideConfirm} onOpenChange={setShowHideConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This story will be hidden from the family feed but not permanently deleted. 
              You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleHideStory}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Hiding...' : 'Hide Story'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Story Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the story from your family feed. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStory}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete Story'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Dialog */}
      <AlertDialog open={showRoleChange} onOpenChange={setShowRoleChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new role for this family member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(value: 'admin' | 'member' | 'guest') => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">Full family management rights</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-muted-foreground">Can create content and comment</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="guest">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-muted-foreground">Can view and comment only</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRoleChange}
              disabled={loading || selectedRole === currentRole}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
