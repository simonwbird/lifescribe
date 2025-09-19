import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Flag, Plus, Settings, Target, Trash2, Edit, Activity, BarChart3, Search } from 'lucide-react'
import { useFeatureFlagAdmin } from '@/hooks/useFeatureFlags'
import { useToast } from '@/hooks/use-toast'
import { FeatureFlag, RemoteConfig, FeatureFlagStatus, RolloutType, TargetingType } from '@/lib/featureFlagTypes'
import { FeatureFlagTargetingModal } from './FeatureFlagTargetingModal'
import { RemoteConfigModal } from './RemoteConfigModal'

export const FeatureFlagManager = () => {
  const { flags, config, isLoading, createFlag, updateFlag, deleteFlag } = useFeatureFlagAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FeatureFlagStatus>('all')
  const [showCreateFlag, setShowCreateFlag] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)
  const [showTargeting, setShowTargeting] = useState(false)
  const [showRemoteConfig, setShowRemoteConfig] = useState(false)
  const { toast } = useToast()

  const [newFlag, setNewFlag] = useState({
    name: '',
    key: '',
    description: '',
    rollout_percentage: 0,
    rollout_type: 'global' as RolloutType,
    is_kill_switch: false
  })

  const filteredFlags = flags.filter((flag: FeatureFlag) => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.key.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || flag.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateFlag = async () => {
    try {
      if (!newFlag.name || !newFlag.key) {
        toast({
          title: 'Error',
          description: 'Name and key are required',
          variant: 'destructive'
        })
        return
      }

      await createFlag(newFlag)
      setShowCreateFlag(false)
      setNewFlag({
        name: '',
        key: '',
        description: '',
        rollout_percentage: 0,
        rollout_type: 'global',
        is_kill_switch: false
      })
      toast({
        title: 'Success',
        description: 'Feature flag created successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create feature flag',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateFlag = async (flagId: string, updates: Partial<FeatureFlag>) => {
    try {
      await updateFlag(flagId, updates)
      toast({
        title: 'Success',
        description: 'Feature flag updated successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteFlag = async (flagId: string) => {
    try {
      await deleteFlag(flagId)
      toast({
        title: 'Success',
        description: 'Feature flag deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete feature flag',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: FeatureFlagStatus) => {
    const variants = {
      draft: 'outline',
      active: 'default',
      inactive: 'secondary',
      archived: 'destructive'
    } as const

    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const getRolloutColor = (percentage: number) => {
    if (percentage === 0) return 'text-gray-500'
    if (percentage < 25) return 'text-red-500'
    if (percentage < 50) return 'text-yellow-500'
    if (percentage < 75) return 'text-blue-500'
    return 'text-green-500'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading feature flags...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags & Remote Config
              </CardTitle>
              <CardDescription>
                Manage feature flags and remote configuration settings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRemoteConfig(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Remote Config
              </Button>
              <Dialog open={showCreateFlag} onOpenChange={setShowCreateFlag}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Flag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Feature Flag</DialogTitle>
                    <DialogDescription>
                      Create a new feature flag to control feature rollouts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="New UI Design"
                        value={newFlag.name}
                        onChange={(e) => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Key</Label>
                      <Input
                        placeholder="new_ui_enabled"
                        value={newFlag.key}
                        onChange={(e) => setNewFlag(prev => ({ ...prev, key: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Enable the new user interface design"
                        value={newFlag.description}
                        onChange={(e) => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rollout %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newFlag.rollout_percentage}
                          onChange={(e) => setNewFlag(prev => ({ ...prev, rollout_percentage: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rollout Type</Label>
                        <Select value={newFlag.rollout_type} onValueChange={(value: RolloutType) => setNewFlag(prev => ({ ...prev, rollout_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">Global</SelectItem>
                            <SelectItem value="cohort">Cohort</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newFlag.is_kill_switch}
                        onCheckedChange={(checked) => setNewFlag(prev => ({ ...prev, is_kill_switch: checked }))}
                      />
                      <Label>Kill Switch</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateFlag(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFlag}>
                      Create Flag
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flags" className="space-y-4">
            <TabsList>
              <TabsTrigger value="flags">Feature Flags</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="flags" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search flags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Flags Table */}
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rollout</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last Changed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFlags.map((flag: FeatureFlag) => (
                      <TableRow key={flag.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="flex items-center gap-2">
                              {flag.name}
                              {flag.is_kill_switch && (
                                <Badge variant="destructive" className="text-xs">
                                  Kill Switch
                                </Badge>
                              )}
                            </div>
                            {flag.description && (
                              <div className="text-sm text-muted-foreground">
                                {flag.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {flag.key}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(flag.status)}</TableCell>
                        <TableCell>
                          <span className={getRolloutColor(flag.rollout_percentage)}>
                            {flag.rollout_percentage}%
                          </span>
                        </TableCell>
                        <TableCell className="capitalize">{flag.rollout_type}</TableCell>
                        <TableCell>
                          {flag.last_changed_at 
                            ? new Date(flag.last_changed_at).toLocaleDateString()
                            : new Date(flag.created_at).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFlag(flag)
                                setShowTargeting(true)
                              }}
                            >
                              <Target className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={flag.status === 'active'}
                              onCheckedChange={(checked) => 
                                handleUpdateFlag(flag.id, { 
                                  status: checked ? 'active' : 'inactive' 
                                })
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{flag.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteFlag(flag.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{flags.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {flags.filter((f: FeatureFlag) => f.status === 'active').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Kill Switches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {flags.filter((f: FeatureFlag) => f.is_kill_switch).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Config Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{config.length}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedFlag && (
        <FeatureFlagTargetingModal
          flag={selectedFlag}
          isOpen={showTargeting}
          onClose={() => {
            setShowTargeting(false)
            setSelectedFlag(null)
          }}
        />
      )}

      <RemoteConfigModal
        config={config}
        isOpen={showRemoteConfig}
        onClose={() => setShowRemoteConfig(false)}
      />
    </div>
  )
}