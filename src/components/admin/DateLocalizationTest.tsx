/**
 * Temporary test component to debug the DateLocalization import issue
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export default function DateLocalizationTest() {
  const [showUTC, setShowUTC] = useState(false)
  const [rolloutPhase, setRolloutPhase] = useState<'draft' | 'staff' | 'cohort' | 'full'>('draft')

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
              <div className="text-2xl font-bold">0%</div>
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
                variant={rolloutPhase === 'staff' ? 'default' : 'outline'}
                className="h-20 flex-col"
                onClick={() => setRolloutPhase('staff')}
              >
                <div className="font-semibold">Phase 1</div>
                <div className="text-sm">Staff Only</div>
              </Button>
              
              <Button
                variant={rolloutPhase === 'cohort' ? 'default' : 'outline'}
                className="h-20 flex-col"
                disabled={rolloutPhase === 'draft'}
              >
                <div className="font-semibold">Phase 2</div>
                <div className="text-sm">10% Cohort</div>
              </Button>
              
              <Button
                variant={rolloutPhase === 'full' ? 'default' : 'outline'}
                className="h-20 flex-col"
                disabled={rolloutPhase !== 'cohort'}
              >
                <div className="font-semibold">Phase 3</div>
                <div className="text-sm">100% Users</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAuthGuard>
  )
}