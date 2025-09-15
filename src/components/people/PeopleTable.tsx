import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UserPlus, Mail, Edit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { calculateAge, calculateDaysUntilBirthday, formatUpcoming } from '@/utils/dateUtils'
import PersonForm from './PersonForm'
import InvitePersonModal from './InvitePersonModal'
import MembershipChip from './MembershipChip'
import MemorializeModal from './MemorializeModal'
import PeopleTableRowActions from './PeopleTableRowActions'
import type { Person } from '@/lib/familyTreeTypes'
import type { PersonAccounts, CurrentUser } from '@/utils/personState'

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
  const [memorizingPerson, setMemorizingPerson] = useState<Person | null>(null)
  const [inlineEditing, setInlineEditing] = useState<{personId: string, field: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const { toast } = useToast()

  // Build personAccounts lookup for the new row actions component
  const personAccounts: PersonAccounts = {}
  people.forEach(person => {
    if (person.account_status === 'joined' && person.member_role) {
      personAccounts[person.id] = {
        user_id: currentUserId || '',
        member_role: person.member_role
      }
    }
  })

  // Current user context
  const currentUser: CurrentUser = {
    role: currentUserRole as 'admin' | 'member' | 'guest' | null,
    id: currentUserId
  }

  // Permission helpers (simplified since new component handles most logic)
  const canEdit = () => currentUserRole === 'admin' || currentUserRole === 'member'

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
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
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
        aValue = (a as any).person_story_links?.length || 0
        bValue = (b as any).person_story_links?.length || 0
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const copyInviteLink = async (person: Person) => {
    // This would need to generate an invite link for the specific person
    // For now, we'll just copy a placeholder
    const inviteLink = `${window.location.origin}/invite/${person.id}`
    await navigator.clipboard.writeText(inviteLink)
    toast({
      title: "Success",
      description: "Invite link copied to clipboard"
    })
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
      {/* Table */}
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
              <TableHead>Relation</TableHead>
              <TableHead>Life Dates</TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-2">
                  Age / Would be
                  {getSortIcon('age')}
                </div>
              </TableHead>
              <TableHead>Membership</TableHead>
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
                     <div className="flex items-center gap-3">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={person.avatar_url || ''} />
                         <AvatarFallback className="text-xs">
                           {getInitials(person.full_name || 'Unknown')}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <div className="font-medium cursor-pointer hover:text-primary" 
                              onClick={() => window.open(`/people/${person.id}`, '_blank')}>
                           {person.full_name}
                         </div>
                         {person.alt_names && person.alt_names.length > 0 && (
                           <div className="text-xs text-muted-foreground">
                             aka {person.alt_names.join(', ')}
                           </div>
                         )}
                       </div>
                     </div>
                   </TableCell>

                   <TableCell>
                     <span className="text-muted-foreground">—</span>
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
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveInlineEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setInlineEditing(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 border border-transparent hover:border-border transition-colors group"
                          onClick={() => canEdit() && handleInlineEdit(person, 'birth_date')}
                          title={canEdit() ? "Click to edit birth date" : "View birth date"}
                        >
                          <div className="flex items-center justify-between">
                            <span>{person.birth_date ? new Date(person.birth_date).toLocaleDateString() : 'Unknown'}</span>
                            {canEdit() && (
                              <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {person.death_date && (
                        <div className="text-xs text-muted-foreground">
                          {inlineEditing?.personId === person.id && inlineEditing?.field === 'death_date' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32 text-xs"
                                autoFocus
                              />
                              <Button size="sm" onClick={handleSaveInlineEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setInlineEditing(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 border border-transparent hover:border-border transition-colors group"
                              onClick={() => canEdit() && handleInlineEdit(person, 'death_date')}
                              title={canEdit() ? "Click to edit death date" : "View death date"}
                            >
                              <div className="flex items-center justify-between">
                                <span>† {new Date(person.death_date).toLocaleDateString()}</span>
                                {canEdit() && (
                                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                                )}
                              </div>
                            </div>
                          )}
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
                     <MembershipChip person={person as any} />
                   </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>📖</span>
                      {(person as any).stories?.length || 0}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>📷</span>
                      {(person as any).media?.length || 0}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {daysUntilBirthday !== null && (
                      <Badge variant="outline">
                        <span className="mr-1">🎂</span>
                        {daysUntilBirthday === 0 ? 'Today!' : `${daysUntilBirthday} days`}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <PeopleTableRowActions
                      person={person}
                      personAccounts={personAccounts}
                      currentUser={currentUser}
                      familyId={familyId}
                      onPersonUpdated={onPersonUpdated}
                    />
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

      {/* Memorialize Modal */}
      {memorizingPerson && (
        <Dialog open={!!memorizingPerson} onOpenChange={() => setMemorizingPerson(null)}>
          <DialogContent>
            <MemorializeModal
              person={memorizingPerson}
              onClose={() => setMemorizingPerson(null)}
              onSuccess={() => {
                setMemorizingPerson(null)
                onPersonUpdated()
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}