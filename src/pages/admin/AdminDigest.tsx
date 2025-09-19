import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DigestScheduler } from '@/components/admin/DigestScheduler'
import { Search, Calendar, Users, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface FamilyWithDigest {
  id: string
  name: string
  member_count: number
  digest_enabled: boolean
  digest_paused: boolean
  last_sent_at: string | null
  next_digest_date: string | null
}

export default function AdminDigest() {
  const [families, setFamilies] = useState<FamilyWithDigest[]>([])
  const [selectedFamily, setSelectedFamily] = useState<FamilyWithDigest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled' | 'paused'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadFamilies()
  }, [])

  const loadFamilies = async () => {
    try {
      setIsLoading(true)
      
      // Get families with member counts and digest settings
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select(`
          id,
          name,
          members(count),
          weekly_digest_settings(
            enabled,
            is_paused,
            last_sent_at,
            delivery_day,
            delivery_hour
          )
        `)
        .order('name')

      if (familiesError) throw familiesError

      const formattedFamilies: FamilyWithDigest[] = familiesData.map(family => {
        const settings = family.weekly_digest_settings as any
        const memberCount = (family.members as any)?.[0]?.count || 0
        
        // Calculate next digest date
        let nextDigestDate = null
        if (settings?.enabled && !settings.is_paused) {
          const now = new Date()
          const targetDay = settings.delivery_day
          const targetHour = settings.delivery_hour
          const daysUntilTarget = (targetDay - now.getDay() + 7) % 7
          const nextDate = new Date(now)
          nextDate.setDate(now.getDate() + daysUntilTarget)
          nextDate.setHours(targetHour, 0, 0, 0)
          
          if (daysUntilTarget === 0 && now.getHours() >= targetHour) {
            nextDate.setDate(nextDate.getDate() + 7)
          }
          
          nextDigestDate = nextDate.toISOString()
        }

        return {
          id: family.id,
          name: family.name,
          member_count: memberCount,
          digest_enabled: settings?.enabled || false,
          digest_paused: settings?.is_paused || false,
          last_sent_at: settings?.last_sent_at || null,
          next_digest_date: nextDigestDate
        }
      })

      setFamilies(formattedFamilies)
    } catch (error) {
      console.error('Error loading families:', error)
      toast({
        title: 'Error',
        description: 'Failed to load family digest data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFamilies = families.filter(family => {
    const matchesSearch = family.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'enabled' && family.digest_enabled && !family.digest_paused) ||
      (filterStatus === 'disabled' && !family.digest_enabled) ||
      (filterStatus === 'paused' && family.digest_paused)
    
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (family: FamilyWithDigest) => {
    if (!family.digest_enabled) {
      return <Badge variant="outline">Disabled</Badge>
    }
    if (family.digest_paused) {
      return <Badge variant="destructive">Paused</Badge>
    }
    return <Badge variant="secondary">Active</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (selectedFamily) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedFamily(null)}
          >
            ← Back to All Families
          </Button>
          <h2 className="text-xl font-semibold">Managing: {selectedFamily.name}</h2>
        </div>
        
        <DigestScheduler
          familyId={selectedFamily.id}
          familyName={selectedFamily.name}
          memberCount={selectedFamily.member_count}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Digest Management</h1>
          <p className="text-muted-foreground">
            Manage weekly digest settings across all families
          </p>
        </div>
        <Button 
          onClick={loadFamilies} 
          variant="outline"
          disabled={isLoading}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search families..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                <SelectItem value="enabled">Active Digests</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Families List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading families...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredFamilies.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No families found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No families have been created yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredFamilies.map((family) => (
            <Card key={family.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{family.name}</h3>
                      {getStatusBadge(family)}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {family.member_count} members
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last sent: {formatDate(family.last_sent_at)}
                      </span>
                      
                      {family.next_digest_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next: {formatDate(family.next_digest_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedFamily(family)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Families</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{families.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Digests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {families.filter(f => f.digest_enabled && !f.digest_paused).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {families.filter(f => f.digest_paused).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {families.filter(f => !f.digest_enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}