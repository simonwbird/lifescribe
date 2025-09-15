import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, Mail, Copy, Calendar, Users, Image, ExternalLink, Trash2, Heart, Shield, Crown, User, ChevronUp, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PersonForm from './PersonForm'
import InvitePersonModal from './InvitePersonModal'
import type { Person } from '@/lib/familyTreeTypes'

interface PeopleTableProps {
  people: Person[]
  onPersonUpdated: () => void
  familyId: string
  currentUserRole: string | null
  currentUserId: string | null
}

export default function PeopleTable({ people, onPersonUpdated, familyId, currentUserRole, currentUserId }: PeopleTableProps) {
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [invitingPerson, setInvitingPerson] = useState<Person | null>(null)
  const [inlineEditing, setInlineEditing] = useState<{personId: string, field: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const { toast } = useToast()

  // Permission helpers
  const canEdit = () => currentUserRole === 'admin' || currentUserRole === 'member'
  const canInvite = () => currentUserRole === 'admin' || currentUserRole === 'member'
  const canDelete = () => currentUserRole === 'admin'
  const canManageRoles = () => currentUserRole === 'admin'

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  const sortedPeople = [...people].sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortField) {
      case 'name':
        aValue = a.full_name?.toLowerCase() || ''
        bValue = b.full_name?.toLowerCase() || ''
        break
      case 'age':
        aValue = calculateAge(a.birth_date, a.death_date, a.is_living !== false) || 0
        bValue = calculateAge(b.birth_date, b.death_date, b.is_living !== false) || 0
        break
      case 'stories':
        aValue = (a as any).stories?.length || 0
        bValue = (b as any).stories?.length || 0
        break
      case 'photos':
        aValue = (a as any).media?.length || 0
        bValue = (b as any).media?.length || 0
        break
      case 'birthday':
        aValue = calculateDaysUntilBirthday(a.birth_date) || 999
        bValue = calculateDaysUntilBirthday(b.birth_date) || 999
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const calculateAge = (birthDate: string | null, deathDate: string | null, isLiving: boolean) => {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    const compareDate = deathDate ? new Date(deathDate) : new Date()
    
    const age = compareDate.getFullYear() - birth.getFullYear()
    const monthDiff = compareDate.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && compareDate.getDate() < birth.getDate())) {
      return age - 1
    }
    
    return age
  }

  const calculateDaysUntilBirthday = (birthDate: string | null) => {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    const today = new Date()
    const thisYear = today.getFullYear()
    
    // Handle Feb 29 on non-leap years
    let nextBirthday = new Date(thisYear, birth.getMonth(), birth.getDate())
    if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(thisYear)) {
      nextBirthday = new Date(thisYear, 1, 28) // Feb 28
    }
    
    if (nextBirthday < today) {
      const nextYear = thisYear + 1
      nextBirthday = new Date(nextYear, birth.getMonth(), birth.getDate())
      if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(nextYear)) {
        nextBirthday = new Date(nextYear, 1, 28)
      }
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  const getRoleBadge = (memberRole: string | null) => {
    if (!memberRole) {
      return <Badge variant="secondary">No Account</Badge>
    }
    
    switch (memberRole) {
      case 'admin':
        return (
          <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">
            <Crown className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case 'member':
        return (
          <Badge variant="outline">
            <User className="h-3 w-3 mr-1" />
            Member
          </Badge>
        )
      case 'guest':
        return (
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" />
            Guest
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleRoleChange = async (person: Person, newRole: 'admin' | 'member' | 'guest') => {
    try {
      // Find the person-user link
      const { data: linkData, error: linkError } = await supabase
        .from('person_user_links')
        .select('user_id')
        .eq('person_id', person.id)
        .eq('family_id', familyId)
        .single()

      if (linkError || !linkData) {
        toast({
          title: "Error",
          description: "This person is not linked to a user account",
          variant: "destructive"
        })
        return
      }

      // Update the member role
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('profile_id', linkData.user_id)
        .eq('family_id', familyId)

      if (error) throw error

      toast({
        title: "Success",
        description: `${person.full_name} is now a ${newRole}`
      })
      
      onPersonUpdated()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (person: any) => {
    if (person.is_living === false) {
      return <Badge variant="secondary">Deceased</Badge>
    }
    
    if (person.account_status === 'joined') {
      return <Badge variant="default">Joined</Badge>
    } else if (person.account_status === 'invited') {
      return <Badge variant="outline">Invited</Badge>
    } else {
      return <Badge variant="secondary">Not on app</Badge>
    }
  }

  const handleInlineEdit = (person: Person, field: string) => {
    setInlineEditing({ personId: person.id, field })
    setEditValue((person as any)[field] || '')
  }

  const handleSaveInlineEdit = async () => {
    if (!inlineEditing) return

    try {
      const updates: any = {}
      updates[inlineEditing.field] = editValue

      const { error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', inlineEditing.personId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Person updated successfully"
      })
      
      onPersonUpdated()
      setInlineEditing(null)
    } catch (error) {
      console.error('Error updating person:', error)
      toast({
        title: "Error",
        description: "Failed to update person",
        variant: "destructive"
      })
    }
  }

  const handleMarkDeceased = async (person: Person) => {
    try {
      const { error } = await supabase
        .from('people')
        .update({ 
          is_living: false,
          death_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', person.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${person.full_name} marked as deceased`
      })
      
      onPersonUpdated()
    } catch (error) {
      console.error('Error marking person as deceased:', error)
      toast({
        title: "Error",
        description: "Failed to update person",
        variant: "destructive"
      })
    }
  }

  const handleDeletePerson = async (person: Person) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', person.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${person.full_name} has been deleted`
      })
      
      onPersonUpdated()
    } catch (error) {
      console.error('Error deleting person:', error)
      toast({
        title: "Error",
        description: "Failed to delete person",
        variant: "destructive"
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPeople(people.map(p => p.id))
    } else {
      setSelectedPeople([])
    }
  }

  const handleSelectPerson = (personId: string, checked: boolean) => {
    if (checked) {
      setSelectedPeople([...selectedPeople, personId])
    } else {
      setSelectedPeople(selectedPeople.filter(id => id !== personId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedPeople.length > 0 && canEdit() && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedPeople.length} selected</span>
          {canInvite() && (
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Bulk Invite
            </Button>
          )}
          {canEdit() && (
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Mark Deceased
            </Button>
          )}
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {canEdit() && (
                  <Checkbox
                    checked={selectedPeople.length === people.length && people.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50" 
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead>Life Dates</TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-2">
                  Age
                  {getSortIcon('age')}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('stories')}
              >
                <div className="flex items-center gap-2">
                  Stories
                  {getSortIcon('stories')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('photos')}
              >
                <div className="flex items-center gap-2">
                  Photos
                  {getSortIcon('photos')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('birthday')}
              >
                <div className="flex items-center gap-2">
                  Upcoming
                  {getSortIcon('birthday')}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPeople.map((person) => {
              const age = calculateAge(person.birth_date, person.death_date, person.is_living !== false)
              const daysUntilBirthday = person.is_living !== false ? calculateDaysUntilBirthday(person.birth_date) : null
              
              return (
                <TableRow key={person.id}>
                  <TableCell>
                    {canEdit() && (
                      <Checkbox
                        checked={selectedPeople.includes(person.id)}
                        onCheckedChange={(checked) => handleSelectPerson(person.id, checked as boolean)}
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium">{person.full_name}</div>
                    {person.alt_names && person.alt_names.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        aka {person.alt_names.join(', ')}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {inlineEditing?.personId === person.id && inlineEditing?.field === 'birth_date' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-32"
                          />
                          <Button size="sm" onClick={handleSaveInlineEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setInlineEditing(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted rounded px-2 py-1"
                          onClick={() => handleInlineEdit(person, 'birth_date')}
                        >
                          {person.birth_date ? new Date(person.birth_date).toLocaleDateString() : 'Unknown'}
                        </div>
                      )}
                      
                      {person.death_date && (
                        <div className="text-xs text-muted-foreground">
                          † {new Date(person.death_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {age !== null && (
                      <div>
                        {person.is_living === false ? `Was ${age}` : age}
                        {person.is_living === false && (
                          <div className="text-xs text-muted-foreground">(In memoriam)</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(person)}
                  </TableCell>
                  
                  <TableCell>
                    {getRoleBadge(person.member_role)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {(person as any).stories?.length || 0}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Image className="h-4 w-4" />
                      {(person as any).media?.length || 0}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {daysUntilBirthday !== null && (
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {daysUntilBirthday === 0 ? 'Today!' : `${daysUntilBirthday} days`}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit() && (
                          <DropdownMenuItem onClick={() => setEditingPerson(person)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                        )}
                        
                        {canInvite() && (
                          <DropdownMenuItem onClick={() => setInvitingPerson(person)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Invite/Manage
                          </DropdownMenuItem>
                        )}
                        
                        {/* Role Management - Only show for admins with person accounts */}
                        {canManageRoles() && person.member_role && (
                          <>
                            {person.member_role !== 'admin' && (
                              <DropdownMenuItem onClick={() => handleRoleChange(person, 'admin')}>
                                <Crown className="h-4 w-4 mr-2" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {person.member_role !== 'member' && (
                              <DropdownMenuItem onClick={() => handleRoleChange(person, 'member')}>
                                <User className="h-4 w-4 mr-2" />
                                Set as Member
                              </DropdownMenuItem>
                            )}
                            {person.member_role !== 'guest' && (
                              <DropdownMenuItem onClick={() => handleRoleChange(person, 'guest')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Set as Guest
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        
                        <DropdownMenuItem onClick={() => window.open(`/people/${person.id}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Wall
                        </DropdownMenuItem>
                        
                        {canDelete() && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {person.full_name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this person and all associated data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePerson(person)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Person Modal */}
      {editingPerson && (
        <Dialog open={!!editingPerson} onOpenChange={() => setEditingPerson(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit {editingPerson.full_name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 pr-2">
              <PersonForm
                person={editingPerson}
                familyId={familyId}
                onSuccess={() => {
                  setEditingPerson(null)
                  onPersonUpdated()
                }}
                onCancel={() => setEditingPerson(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Person Modal */}
      {invitingPerson && (
        <InvitePersonModal
          person={invitingPerson}
          familyId={familyId}
          onClose={() => setInvitingPerson(null)}
          onSuccess={() => {
            setInvitingPerson(null)
            onPersonUpdated()
          }}
        />
      )}
    </div>
  )
}