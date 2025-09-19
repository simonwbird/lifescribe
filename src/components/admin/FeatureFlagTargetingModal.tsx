import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Trash2, Target, Users, Globe, Building, User } from 'lucide-react'
import { FeatureFlag, FeatureFlagTargeting, TargetingType } from '@/lib/featureFlagTypes'
import { featureFlagService } from '@/lib/featureFlagService'
import { useToast } from '@/hooks/use-toast'

interface FeatureFlagTargetingModalProps {
  flag: FeatureFlag
  isOpen: boolean
  onClose: () => void
}

export const FeatureFlagTargetingModal = ({ flag, isOpen, onClose }: FeatureFlagTargetingModalProps) => {
  const [targetingRules, setTargetingRules] = useState<FeatureFlagTargeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({
    targeting_type: 'role' as TargetingType,
    targeting_value: '',
    rollout_percentage: 100
  })
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadTargetingRules()
    }
  }, [isOpen, flag.id])

  const loadTargetingRules = async () => {
    try {
      setIsLoading(true)
      const rules = await featureFlagService.getTargetingRules(flag.id)
      setTargetingRules(rules)
    } catch (error) {
      console.error('Error loading targeting rules:', error)
      toast({
        title: 'Error',
        description: 'Failed to load targeting rules',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRule = async () => {
    try {
      if (!newRule.targeting_value.trim()) {
        toast({
          title: 'Error',
          description: 'Targeting value is required',
          variant: 'destructive'
        })
        return
      }

      const values = newRule.targeting_value.split(',').map(v => v.trim()).filter(v => v)
      
      await featureFlagService.createTargetingRule({
        flag_id: flag.id,
        targeting_type: newRule.targeting_type,
        targeting_value: values,
        rollout_percentage: newRule.rollout_percentage
      })

      setShowAddRule(false)
      setNewRule({
        targeting_type: 'role',
        targeting_value: '',
        rollout_percentage: 100
      })
      await loadTargetingRules()
      
      toast({
        title: 'Success',
        description: 'Targeting rule added successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create targeting rule',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await featureFlagService.deleteTargetingRule(ruleId)
      await loadTargetingRules()
      toast({
        title: 'Success',
        description: 'Targeting rule deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete targeting rule',
        variant: 'destructive'
      })
    }
  }

  const getTargetingTypeIcon = (type: TargetingType) => {
    switch (type) {
      case 'role': return <Users className="h-4 w-4" />
      case 'country': return <Globe className="h-4 w-4" />
      case 'cohort': return <Target className="h-4 w-4" />
      case 'family_id': return <Building className="h-4 w-4" />
      case 'user_id': return <User className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getTargetingTypePlaceholder = (type: TargetingType) => {
    switch (type) {
      case 'role': return 'admin, super_admin, user'
      case 'country': return 'US, CA, UK'
      case 'cohort': return '2024_W1, 2024_W2'
      case 'family_id': return 'family-uuid-1, family-uuid-2'
      case 'user_id': return 'user-uuid-1, user-uuid-2'
      default: return 'comma,separated,values'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Targeting Rules - {flag.name}
          </DialogTitle>
          <DialogDescription>
            Configure targeting rules to control who sees this feature flag
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flag Info */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Key:</span> <code>{flag.key}</code>
              </div>
              <div>
                <span className="font-medium">Global Rollout:</span> {flag.rollout_percentage}%
              </div>
              <div>
                <span className="font-medium">Type:</span> {flag.rollout_type}
              </div>
            </div>
          </div>

          {/* Add Rule Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Targeting Rules</h3>
            <Button
              onClick={() => setShowAddRule(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>

          {/* Add Rule Form */}
          {showAddRule && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Targeting Type</Label>
                  <Select
                    value={newRule.targeting_type}
                    onValueChange={(value: TargetingType) => setNewRule(prev => ({ ...prev, targeting_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">User Role</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="cohort">Signup Cohort</SelectItem>
                      <SelectItem value="family_id">Family ID</SelectItem>
                      <SelectItem value="user_id">User ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Values (comma-separated)</Label>
                  <Input
                    placeholder={getTargetingTypePlaceholder(newRule.targeting_type)}
                    value={newRule.targeting_value}
                    onChange={(e) => setNewRule(prev => ({ ...prev, targeting_value: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rollout %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newRule.rollout_percentage}
                    onChange={(e) => setNewRule(prev => ({ ...prev, rollout_percentage: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddRule(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRule}>
                  Add Rule
                </Button>
              </div>
            </div>
          )}

          {/* Rules Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading targeting rules...</p>
            </div>
          ) : targetingRules.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No targeting rules</h3>
              <p className="text-sm text-muted-foreground">
                Add targeting rules to control who sees this feature flag
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Values</TableHead>
                    <TableHead>Rollout %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTargetingTypeIcon(rule.targeting_type)}
                          <span className="capitalize">{rule.targeting_type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(rule.targeting_value).slice(0, 3).map((value: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                          {JSON.parse(rule.targeting_value).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{JSON.parse(rule.targeting_value).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={rule.rollout_percentage === 100 ? 'text-green-600' : 'text-yellow-600'}>
                          {rule.rollout_percentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_enabled ? 'default' : 'secondary'}>
                          {rule.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(rule.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Targeting Rule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this targeting rule? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRule(rule.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}