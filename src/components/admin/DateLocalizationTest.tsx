/**
 * Temporary test component to debug the DateLocalization import issue
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'
import { useFeatureFlagAdmin } from '@/hooks/useFeatureFlags'
import { useToast } from '@/hooks/use-toast'

export default function DateLocalizationTest() {
  const [showUTC, setShowUTC] = useState(false)
  const [rolloutPhase, setRolloutPhase] = useState<'draft' | 'staff' | 'cohort' | 'full'>('draft')
  const [isRollingOut, setIsRollingOut] = useState(false)
  const { flags, updateFlag, loadData } = useFeatureFlagAdmin()
  const { toast } = useToast()

  const dateLocalizationFlag = flags.find((f: any) => f.key === 'date_localisation_v1')

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRollout = async (phase: 'staff' | 'cohort' | 'full') => {
    if (!dateLocalizationFlag) {
      toast({
        title: 'Error',
        description: 'Feature flag not found',
        variant: 'destructive'
      })
      return
    }

    setIsRollingOut(true)
    try {
      let rolloutPercentage = 0
      let status: 'draft' | 'active' = 'active'

      switch (phase) {
        case 'staff':
          rolloutPercentage = 0 // Staff uses targeting rules
          break
        case 'cohort':
          rolloutPercentage = 10
          break
        case 'full':
          rolloutPercentage = 100
          break
      }

      await updateFlag(dateLocalizationFlag.id, {
        status,
        rollout_percentage: rolloutPercentage
      })

      setRolloutPhase(phase)
      toast({
        title: 'Rollout Successful! 🚀',
        description: `Date localization rolled out to ${phase === 'staff' ? 'staff only' : phase === 'cohort' ? '10% of users' : 'all users'}`,
      })
    } catch (error) {
      toast({
        title: 'Rollout Failed',
        description: 'Failed to update feature flag',
        variant: 'destructive'
      })
    } finally {
      setIsRollingOut(false)
    }
  }

  return (
    <AdminAuthGuard requiredRole="SUPER_ADMIN">
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Date Localization Control</h1>
            <p className="text-muted-foreground">Manage rollout phases and monitor date formatting</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="utc-toggle"
              checked={showUTC}
              onCheckedChange={setShowUTC}
            />
            <label htmlFor="utc-toggle" className="text-sm font-medium">
              Show UTC Values
            </label>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge>{rolloutPhase.toUpperCase()}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rollout %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dateLocalizationFlag?.rollout_percentage || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kill Switch</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm">
                Emergency Rollback
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Rollout Phases */}
        <Card>
          <CardHeader>
            <CardTitle>Rollout Phases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="default"
                className="h-20 flex-col bg-green-600 hover:bg-green-700"
                onClick={() => handleRollout('staff')}
                disabled={isRollingOut}
              >
                <div className="font-semibold">🚀 Phase 1</div>
                <div className="text-sm">Roll to Staff</div>
              </Button>
              
              <Button
                variant="default"
                className="h-20 flex-col bg-blue-600 hover:bg-blue-700"
                onClick={() => handleRollout('cohort')}
                disabled={isRollingOut}
              >
                <div className="font-semibold">🎯 Phase 2</div>
                <div className="text-sm">10% Rollout</div>
              </Button>
              
              <Button
                variant="default"
                className="h-20 flex-col bg-purple-600 hover:bg-purple-700"
                onClick={() => handleRollout('full')}
                disabled={isRollingOut}
              >
                <div className="font-semibold">🌍 Phase 3</div>
                <div className="text-sm">Full Rollout</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAuthGuard>
  )
}