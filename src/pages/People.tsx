import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import Header from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Search, UserPlus, Filter, Mail } from 'lucide-react'
import PeopleTable from '@/components/people/PeopleTable'
import PeopleDirectory from '@/components/people/PeopleDirectory'
import PersonForm from '@/components/people/PersonForm'
import DirectInviteModal from '@/components/people/DirectInviteModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface MemberRole {
  role: 'admin' | 'member' | 'guest'
}

export default function People() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('living')
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null)
  const [showPersonForm, setShowPersonForm] = useState(false)
  const [showDirectInvite, setShowDirectInvite] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const initializePage = async () => {
      try {
        const spaceId = await getCurrentSpaceId()
        if (!spaceId) return
        setCurrentSpaceId(spaceId)

        // Get current user's role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)

        const { data: memberData } = await supabase
          .from('members')
          .select('role')
          .eq('profile_id', user.id)
          .eq('family_id', spaceId)
          .single()

        if (memberData) {
          setCurrentUserRole(memberData.role)
        }

        await fetchPeople(spaceId)
      } catch (error) {
        console.error('Error initializing people page:', error)
        toast({
          title: "Error",
          description: "Failed to load people data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [])

  const fetchPeople = async (spaceId: string) => {
    try {
      // Fetch people and their member roles
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', spaceId)
        .order('given_name')

      if (peopleError) throw peopleError

      // Fetch member data to get roles
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('profile_id, role')
        .eq('family_id', spaceId)

      if (membersError) throw membersError

      // Fetch person-user links to connect people to users
      const { data: linksData, error: linksError } = await supabase
        .from('person_user_links')
        .select('person_id, user_id')
        .eq('family_id', spaceId)

      if (linksError) throw linksError

      const peopleWithStatus = (peopleData || []).map((person: any) => {
        const gender = (person.gender as ('male' | 'female' | 'other' | 'unknown')) || undefined
        // Prefer death_date to determine living status; if death_date exists, person is deceased
        const isLiving = person?.death_date ? false : (person.is_living !== false)
        
        // Find if this person is linked to a user account
        const personLink = linksData?.find(link => link.person_id === person.id)
        const memberRole = personLink ? membersData?.find(member => member.profile_id === personLink.user_id)?.role : null
        
        return {
          ...person,
          gender,
          is_living: isLiving,
          account_status: personLink ? 'joined' : 'not_on_app',
          member_role: memberRole // Add member role to person data
        }
      }) as Person[]

      setPeople(peopleWithStatus)
      setFilteredPeople(peopleWithStatus)
    } catch (error) {
      console.error('Error fetching people:', error)
      toast({
        title: "Error",
        description: "Failed to fetch people",
        variant: "destructive"
      })
    }
  }

  // Filter and search logic
  useEffect(() => {
    let filtered = people

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(person => 
        person.full_name?.toLowerCase().includes(query) ||
        person.given_name?.toLowerCase().includes(query) ||
        person.surname?.toLowerCase().includes(query) ||
        person.alt_names?.some(name => name.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(person => {
        switch (statusFilter) {
          case 'living':
            return person.is_living !== false
          case 'deceased':
            return person.is_living === false
          case 'invited':
            return person.account_status === 'invited'
          case 'not_on_app':
            return person.account_status === 'not_on_app'
          case 'joined':
            return person.account_status === 'joined'
          default:
            return true
        }
      })
    }

    setFilteredPeople(filtered)
  }, [people, searchQuery, statusFilter])

  const handlePersonCreated = () => {
    if (currentSpaceId) {
      fetchPeople(currentSpaceId)
    }
    setShowPersonForm(false)
    toast({
      title: "Success",
      description: "Person added successfully"
    })
  }

  const handlePersonUpdated = () => {
    if (currentSpaceId) {
      fetchPeople(currentSpaceId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const isAdmin = currentUserRole === 'admin'

  const stats = {
    total: people.length,
    living: people.filter(p => p.is_living !== false).length,
    deceased: people.filter(p => p.is_living === false).length,
    invited: people.filter(p => p.account_status === 'invited').length,
    not_on_app: people.filter(p => p.account_status === 'not_on_app').length
  }

  return (
    <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">People</h1>
                <p className="text-muted-foreground">
                  {currentUserRole === 'admin' ? 'Manage your family members and invitations' : 
                   currentUserRole === 'member' ? 'View and contribute to your family directory' :
                   currentUserRole === 'guest' ? 'Browse your family directory (read-only access)' :
                   'Loading family directory...'}
                </p>
              </div>
              
              {(currentUserRole === 'admin' || currentUserRole === 'member') && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDirectInvite(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Someone
                  </Button>
                  <Dialog open={showPersonForm} onOpenChange={setShowPersonForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Person
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Add New Person</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto flex-1 pr-2">
                        <PersonForm
                          familyId={currentSpaceId!}
                          onSuccess={handlePersonCreated}
                          onCancel={() => setShowPersonForm(false)}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total People</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.living}</div>
                  <div className="text-xs text-muted-foreground">Living</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{stats.deceased}</div>
                  <div className="text-xs text-muted-foreground">No longer with us</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.invited}</div>
                  <div className="text-xs text-muted-foreground">Invited</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.not_on_app}</div>
                  <div className="text-xs text-muted-foreground">Not on App</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              {/* Quick Filter Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Quick filters:</span>
                {[
                  { value: 'all', label: 'All People', count: stats.total },
                  { value: 'living', label: 'Living', count: stats.living },
                  { value: 'deceased', label: 'No longer with us', count: stats.deceased },
                  { value: 'joined', label: 'On App', count: stats.invited },
                  { value: 'not_on_app', label: 'Not on App', count: stats.not_on_app }
                ].map(filter => (
                  <Button
                    key={filter.value}
                    variant={statusFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(filter.value)}
                    className="h-8"
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>

            </div>

            {/* Content */}
            {(currentUserRole === 'admin' || currentUserRole === 'member') ? (
              <PeopleTable 
                people={filteredPeople}
                onPersonUpdated={handlePersonUpdated}
                familyId={currentSpaceId!}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
              />
            ) : (
              <PeopleDirectory 
                people={filteredPeople}
                familyId={currentSpaceId!}
              />
            )}
          </div>
        </div>
        
        {/* Direct Invite Modal */}
        {showDirectInvite && (
          <DirectInviteModal
            familyId={currentSpaceId!}
            onClose={() => setShowDirectInvite(false)}
            onSuccess={() => {
              setShowDirectInvite(false)
              if (currentSpaceId) {
                fetchPeople(currentSpaceId)
              }
            }}
          />
        )}
      </div>
    )
  }