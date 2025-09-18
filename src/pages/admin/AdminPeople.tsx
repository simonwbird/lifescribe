import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Users, UserCheck, UserX, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AdminUser {
  id: string
  full_name: string | null
  email: string
  created_at: string
  families: { id: string; name: string; role: string }[]
}

interface AdminFamily {
  id: string
  name: string
  description: string | null
  created_at: string
  memberCount: number
  creator: string
}

export default function AdminPeople() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [families, setFamilies] = useState<AdminFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState<'users' | 'families'>('users')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch users with their family memberships
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // For each user, get their family memberships
      const enrichedUsers: AdminUser[] = []
      for (const user of usersData || []) {
        const { data: memberships } = await supabase
          .from('members')
          .select(`
            role,
            families (
              id,
              name
            )
          `)
          .eq('profile_id', user.id)

        enrichedUsers.push({
          ...user,
          families: (memberships || []).map(m => ({
            id: m.families.id,
            name: m.families.name,
            role: m.role
          }))
        })
      }

      setUsers(enrichedUsers)

      // Fetch families with member counts
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by,
          profiles!families_created_by_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (familiesError) throw familiesError

      // Get member counts for each family
      const enrichedFamilies: AdminFamily[] = []
      for (const family of familiesData || []) {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', family.id)

        enrichedFamilies.push({
          id: family.id,
          name: family.name,
          description: family.description,
          created_at: family.created_at,
          memberCount: count || 0,
          creator: family.profiles?.full_name || family.profiles?.email || 'Unknown'
        })
      }

      setFamilies(enrichedFamilies)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' ||
      (filterType === 'with_families' && user.families.length > 0) ||
      (filterType === 'without_families' && user.families.length === 0)

    return matchesSearch && matchesFilter
  })

  const filteredFamilies = families.filter(family =>
    searchQuery === '' || 
    family.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    family.creator.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">People & Families</h1>
        <p className="text-muted-foreground">
          Manage users, families, and memberships
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('families')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'families'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Families ({families.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {activeTab === 'users' && (
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="with_families">With Families</SelectItem>
              <SelectItem value="without_families">Without Families</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-sm">
                      {user.full_name || 'Unnamed User'}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {user.families.length} families
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-mono">{user.email}</p>
                </div>
                
                {user.families.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Family Memberships</p>
                    <div className="space-y-1">
                      {user.families.slice(0, 2).map((family) => (
                        <div key={family.id} className="flex items-center justify-between text-xs">
                          <span className="truncate">{family.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {family.role}
                          </Badge>
                        </div>
                      ))}
                      {user.families.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{user.families.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFamilies.map((family) => (
            <Card key={family.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm">{family.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {family.memberCount} members
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {family.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{family.description}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="text-sm">{family.creator}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(family.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(activeTab === 'users' ? filteredUsers : filteredFamilies).length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No {activeTab} found matching your criteria
          </p>
        </div>
      )}
    </div>
  )
}