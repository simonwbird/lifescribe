import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { calculateAge, calculateDaysUntilBirthday, formatUpcoming } from '@/utils/dateUtils'
import PersonForm from './PersonForm'
import InvitePersonModal from './InvitePersonModal'
import MembershipChip from './MembershipChip'
import MemorializeModal from './MemorializeModal'
import PeopleTableRowActions from './PeopleTableRowActions'
import type { Person } from '@/lib/familyTreeTypes'
import type { PersonAccounts, CurrentUser } from '@/utils/personState'
import { AvatarService } from '@/lib/avatarService'
import maleDefaultAvatar from '@/assets/avatar-male-default.png'
import femaleDefaultAvatar from '@/assets/avatar-female-default.png'

interface PeopleTableProps {
  people: Person[]
  personUserLinks: Array<{ person_id: string, user_id: string }>
  onPersonUpdated: () => void
  familyId: string
  currentUserRole: string | null
  currentUserId: string | null
}

export default function PeopleTable({ people, personUserLinks, onPersonUpdated, familyId, currentUserRole, currentUserId }: PeopleTableProps) {
  const navigate = useNavigate()
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
    if ((person as any).account_status === 'joined' && (person as any).member_role) {
      personAccounts[person.id] = {
        user_id: currentUserId || '',
        member_role: (person as any).member_role
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
        aValue = (a as any).stories_count || 0
        bValue = (b as any).stories_count || 0
        break
      case 'photos':
        aValue = (a as any).media_count || 0
        bValue = (b as any).media_count || 0
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

  // Get default avatar based on gender
  const getDefaultAvatar = (person: Person) => {
    return person.gender?.toLowerCase() === 'female' || person.gender?.toLowerCase() === 'f' 
      ? femaleDefaultAvatar 
      : maleDefaultAvatar
  }

  const handleInlineEdit = (person: Person, field: string) => {
    setInlineEditing({ personId: person.id, field })
    const currentValue = field === 'birth_date' ? person.birth_date : 
                        field === 'death_date' ? person.death_date : ''
    setEditValue(currentValue || '')
  }

  const handleSaveInlineEdit = async () => {
    if (!inlineEditing) return

    try {
      const { error } = await supabase
        .from('people')
        .update({ [inlineEditing.field]: editValue || null })
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

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('name')}>
                  Name {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('age')}>
                  Age {getSortIcon('age')}
                </div>
              </TableHead>
              <TableHead>Birth Date</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('stories')}>
                  Stories {getSortIcon('stories')}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('photos')}>
                  Media {getSortIcon('photos')}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort('birthday')}>
                  Upcoming {getSortIcon('birthday')}
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
                    <Avatar className="h-8 w-8">
                      {person.avatar_url ? (
                        <AvatarImage 
                          src={person.avatar_url}
                          onError={async (e) => {
                            const target = e.currentTarget as HTMLImageElement
                            
                            // Try to refresh the signed URL
                            const refreshedUrl = await AvatarService.refreshSignedUrl(person.avatar_url!)
                            if (refreshedUrl && refreshedUrl !== person.avatar_url) {
                              target.onerror = null
                              target.src = refreshedUrl
                              return
                            }
                            
                            // If refresh failed, use gender default
                            target.onerror = null
                            target.src = getDefaultAvatar(person)
                          }}
                        />
                      ) : (
                        <AvatarImage 
                          src={getDefaultAvatar(person)}
                          onError={(e) => {
                            // Fallback to initials if default avatar fails
                            const target = e.currentTarget as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(person.full_name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div 
                        className="font-medium hover:text-primary cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/people/${person.id}`)
                        }}
                        title={`View ${person.is_living === false ? 'Tribute' : 'Life'} Page for ${person.full_name}`}
                      >
                        {person.full_name}
                      </div>
                      {person.alt_names && person.alt_names.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Also known as: {person.alt_names.join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <MembershipChip 
                      person={person as Person & { 
                        account_status?: string
                        member_role?: string | null
                      }} 
                    />
                  </TableCell>
                  
                  <TableCell>
                    {age !== null && (
                      <div>
                        <span className="font-medium">{age}</span>
                        {person.is_living === false && <span className="text-muted-foreground"> (at death)</span>}
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
                            className="w-32 text-xs"
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
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>📖</span>
                      {(person as any).stories_count || 0}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>📷</span>
                      {(person as any).media_count || 0}
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
                      person={person as Person & { 
                        account_status?: string
                        member_role?: string | null
                        stories_count?: number
                        photos_count?: number
                      }}
                      personAccounts={personAccounts}
                      currentUser={currentUser}
                      familyId={familyId}
                      personUserLink={personUserLinks?.find(link => link.person_id === person.id)}
                      onPersonUpdated={onPersonUpdated}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
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

      {memorizingPerson && (
        <MemorializeModal
          person={memorizingPerson}
          onClose={() => setMemorizingPerson(null)}
          onSuccess={() => {
            setMemorizingPerson(null)
            onPersonUpdated()
          }}
        />
      )}
    </div>
  )
}