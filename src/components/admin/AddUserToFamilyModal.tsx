import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UserPlus, Search, Users, Mail } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  full_name: string | null
}

interface Family {
  id: string
  name: string
  description: string | null
}

export default function AddUserToFamilyModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedFamily, setSelectedFamily] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member' | 'guest'>('member')
  const [families, setFamilies] = useState<Family[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])

  useEffect(() => {
    if (open) {
      fetchFamilies()
    }
  }, [open])

  const fetchFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('id, name, description')
        .order('name')

      if (error) throw error
      setFamilies(data || [])
    } catch (error) {
      console.error('Failed to fetch families:', error)
      toast({
        title: "Error",
        description: "Failed to load families",
        variant: "destructive"
      })
    }
  }

  const searchUsers = async () => {
    if (!searchEmail.trim()) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${searchEmail.trim()}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Failed to search users:', error)
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addUserToFamily = async () => {
    console.log('addUserToFamily called', { selectedUser, selectedFamily, selectedRole })
    
    if (!selectedUser || !selectedFamily) {
      console.log('Missing user or family')
      toast({
        title: "Error",
        description: "Please select both a user and a family",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', selectedUser.id)
        .eq('family_id', selectedFamily)
        .maybeSingle()

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "This user is already a member of this family",
          variant: "destructive"
        })
        return
      }

      // Add user to family
      console.log('Attempting to add user to family', { 
        profile_id: selectedUser.id, 
        family_id: selectedFamily, 
        role: selectedRole 
      })
      
      const { error } = await supabase
        .from('members')
        .insert({
          profile_id: selectedUser.id,
          family_id: selectedFamily,
          role: selectedRole
        })

      console.log('Insert result:', { error })
      if (error) throw error

      toast({
        title: "Success",
        description: `${selectedUser.email} has been added to the family as ${selectedRole}`,
      })

      // Reset form
      setSelectedUser(null)
      setSelectedFamily('')
      setSelectedRole('member')
      setSearchEmail('')
      setSearchResults([])
      setOpen(false)
    } catch (error: any) {
      console.error('Error adding user to family:', error)
      const raw = (error?.message || '').toLowerCase()
      let description = 'Failed to add user to family'
      if (
        raw.includes('row level security') ||
        raw.includes('rls') ||
        raw.includes('not authorized') ||
        raw.includes('permission denied')
      ) {
        description = 'Action blocked by security (RLS): you must be an admin of the selected family to add members.'
      }
      toast({
        title: 'Action Blocked',
        description,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User to Family
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User to Family</DialogTitle>
          <DialogDescription>
            Search for a user by email and add them directly to a family
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Search */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Search User by Email</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button 
                  onClick={searchUsers} 
                  disabled={loading || !searchEmail.trim()}
                  size="icon"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Select User</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`p-2 cursor-pointer hover:bg-muted ${
                        selectedUser?.id === user.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {user.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected User Display */}
            {selectedUser && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      Selected: {selectedUser.full_name || 'Unnamed User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedUser.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Family Selection */}
          <div className="space-y-2">
            <Label htmlFor="family">Select Family</Label>
            <Select value={selectedFamily} onValueChange={setSelectedFamily}>
              <SelectTrigger>
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Choose a family" />
              </SelectTrigger>
              <SelectContent>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.id}>
                    <div>
                      <div className="font-medium">{family.name}</div>
                      {family.description && (
                        <div className="text-xs text-muted-foreground">
                          {family.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'admin' | 'member' | 'guest')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={addUserToFamily}
              disabled={loading || !selectedUser || !selectedFamily}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add to Family"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}