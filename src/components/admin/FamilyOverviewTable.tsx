import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react'
import { useAdminFamilyData } from '@/hooks/useAdminFamilyData'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { FamilyOverviewData, FamilyOverviewFilters, AdminFamilyAnalyticsEvent } from '@/lib/adminFamilyTypes'
import { formatDistanceToNow } from 'date-fns'

const HEALTH_COLORS = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  attention: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  problem: 'bg-red-100 text-red-800 border-red-200'
}

const HEALTH_LABELS = {
  healthy: 'Healthy',
  attention: 'Needs Attention',
  problem: 'Problem'
}

export default function FamilyOverviewTable() {
  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)
  const [filters, setFilters] = useState<FamilyOverviewFilters>({
    search: '',
    health_status: 'all',
    no_first_memory_24h: false,
    no_invites_sent: false,
    digest_disabled: false,
    storage_over_80: false,
    has_flags: false
  })

  const { startImpersonation } = useImpersonation()
  const { track } = useAnalytics()
  const { data, loading, error, totalCount } = useAdminFamilyData({ page, pageSize, filters })

  const handleFilterChange = (key: keyof FamilyOverviewFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(0) // Reset to first page
    
    track('ADMIN_FAMILY_FILTER_APPLIED' as AdminFamilyAnalyticsEvent, {
      filter: key,
      value,
      activeFilters: Object.keys(newFilters).filter(k => {
        const val = newFilters[k as keyof FamilyOverviewFilters]
        return val !== '' && val !== 'all' && val !== false
      })
    })
  }

  const handleRowAction = (action: string, family: FamilyOverviewData) => {
    track('ADMIN_ROW_ACTION_CLICKED' as AdminFamilyAnalyticsEvent, {
      action,
      familyId: family.id,
      familyName: family.name,
      healthStatus: family.health_status
    })

    switch (action) {
      case 'view':
        window.open(`/admin/families/${family.id}`, '_blank')
        break
      case 'impersonate':
        startImpersonation({
          id: family.id,
          name: family.name,
          email: family.creator.email,
          type: 'family'
        })
        break
      case 'nudge':
        // TODO: Implement nudge functionality
        console.log('Sending nudge to family:', family.name)
        break
      case 'digest':
        // TODO: Open digest settings
        console.log('Opening digest settings for:', family.name)
        break
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB'
    const mb = bytes
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(1)} GB`
  }

  const getStoragePercent = (used: number, limit: number): number => {
    return Math.round((used / limit) * 100)
  }

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter((value, index) => {
      const keys = Object.keys(filters)
      const key = keys[index]
      return key !== 'search' && key !== 'health_status' && value === true
    }).length + (filters.search ? 1 : 0) + (filters.health_status !== 'all' ? 1 : 0)
  }, [filters])

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading family data: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">People & Families Overview</h2>
        <p className="text-muted-foreground">
          Monitor family activation and health across your platform
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search families..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Health Status */}
            <Select
              value={filters.health_status}
              onValueChange={(value) => handleFilterChange('health_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Health Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="attention">Needs Attention</SelectItem>
                <SelectItem value="problem">Problem</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Problem Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-memory"
                checked={filters.no_first_memory_24h}
                onCheckedChange={(checked) => handleFilterChange('no_first_memory_24h', checked)}
              />
              <label htmlFor="no-memory" className="text-sm">
                No first memory after 24h
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-invites"
                checked={filters.no_invites_sent}
                onCheckedChange={(checked) => handleFilterChange('no_invites_sent', checked)}
              />
              <label htmlFor="no-invites" className="text-sm">
                0 invites sent
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="digest-off"
                checked={filters.digest_disabled}
                onCheckedChange={(checked) => handleFilterChange('digest_disabled', checked)}
              />
              <label htmlFor="digest-off" className="text-sm">
                Digest disabled
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="storage-high"
                checked={filters.storage_over_80}
                onCheckedChange={(checked) => handleFilterChange('storage_over_80', checked)}
              />
              <label htmlFor="storage-high" className="text-sm">
                Storage &gt;80%
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-flags"
                checked={filters.has_flags}
                onCheckedChange={(checked) => handleFilterChange('has_flags', checked)}
              />
              <label htmlFor="has-flags" className="text-sm">
                Has flags
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Families ({totalCount.toLocaleString()})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={data.length < pageSize}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Contributors</TableHead>
                    <TableHead>Memories</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Digest</TableHead>
                    <TableHead>Invites</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((family) => {
                    const storagePercent = getStoragePercent(family.storage_used_mb, family.storage_limit_mb)
                    
                    return (
                      <TableRow key={family.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{family.name}</div>
                            <div className="text-sm text-muted-foreground">
                              by {family.creator.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{family.total_members}</span>
                            <span className="text-xs text-muted-foreground">
                              ({family.living_members}L/{family.deceased_members}D)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={family.contributors_30d > 0 ? 'default' : 'secondary'}>
                            {family.contributors_30d}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={family.memories_count > 0 ? 'default' : 'secondary'}>
                            {family.memories_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {family.last_activity ? (
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(family.last_activity), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={family.digest_enabled ? 'default' : 'secondary'}>
                            {family.digest_enabled ? 'On' : 'Off'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600">{family.invites_accepted}</span>
                            <span className="text-muted-foreground">/{family.invites_sent}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {formatBytes(family.storage_used_mb)}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={storagePercent > 80 ? 'bg-red-100 text-red-800' : ''}
                            >
                              {storagePercent}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={HEALTH_COLORS[family.health_status]}
                          >
                            {HEALTH_LABELS[family.health_status]}
                          </Badge>
                          {family.flags_count > 0 && (
                            <Badge variant="destructive" className="ml-1">
                              {family.flags_count} flags
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRowAction('view', family)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Family
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRowAction('impersonate', family)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Impersonate (Read-Only)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRowAction('nudge', family)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Nudge
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRowAction('digest', family)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Digest Settings
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {data.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No families found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}