import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Search, UserPlus, Filter } from 'lucide-react'
import PeopleTable from '@/components/people/PeopleTable'
import PeopleDirectory from '@/components/people/PeopleDirectory'
import PersonForm from '@/components/people/PersonForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface MemberRole {
  role: 'admin' | 'member' | 'guest'
}

export default function People() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null)
  const [showPersonForm, setShowPersonForm] = useState(false)
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
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', spaceId)
        .order('given_name')

      if (error) throw error

      const peopleWithStatus = (data || []).map((person: any) => {
        const gender = (person.gender as ('male' | 'female' | 'other' | 'unknown')) || undefined
        const derivedLiving =
          typeof person.is_living === 'boolean'
            ? person.is_living
            : (person.death_date ? false : true)
        return {
          ...person,
          gender,
          is_living: derivedLiving,
          account_status: 'not_on_app' // Placeholder until invites/person_user_links are joined
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
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
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
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">People</h1>
                <p className="text-muted-foreground">
                  {isAdmin ? 'Manage your family members and invitations' : 'Browse your family directory'}
                </p>
              </div>
              
              {isAdmin && (
                <Dialog open={showPersonForm} onOpenChange={setShowPersonForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Person
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Person</DialogTitle>
                    </DialogHeader>
                    <PersonForm
                      familyId={currentSpaceId!}
                      onSuccess={handlePersonCreated}
                      onCancel={() => setShowPersonForm(false)}
                    />
                  </DialogContent>
                </Dialog>
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
                  <div className="text-xs text-muted-foreground">Deceased</div>
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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  <SelectItem value="living">Living</SelectItem>
                  <SelectItem value="deceased">Deceased</SelectItem>
                  <SelectItem value="joined">Joined</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="not_on_app">Not on App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            {isAdmin ? (
              <PeopleTable 
                people={filteredPeople}
                onPersonUpdated={handlePersonUpdated}
                familyId={currentSpaceId!}
              />
            ) : (
              <PeopleDirectory 
                people={filteredPeople}
                familyId={currentSpaceId!}
              />
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}