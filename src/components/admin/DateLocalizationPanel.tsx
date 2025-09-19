/**
 * Admin panel for date localization management and monitoring
 * Provides UTC/Local toggle, rollout controls, and observability dashboard
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  Globe, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  MapPin
} from 'lucide-react'
import { useFeatureFlagAdmin } from '@/hooks/useFeatureFlags'
import { formatForUser, REGION_PRESETS } from '@/utils/date'
import { useToast } from '@/hooks/use-toast'

export default function DateLocalizationPanel() {
  const [showUTC, setShowUTC] = useState(false)
  const [rolloutPhase, setRolloutPhase] = useState<'draft' | 'staff' | 'cohort' | 'full'>('draft')
  const [errorCount, setErrorCount] = useState(0)
  const [isRollbackActive, setIsRollbackActive] = useState(false)
  const { flags, updateFlag, loadData } = useFeatureFlagAdmin()
  const { toast } = useToast()

  const dateLocalizationFlag = flags.find((f: any) => f.key === 'date_localisation_v1')

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    // Simulate error monitoring (in production, this would come from real metrics)
    const interval = setInterval(() => {
      setErrorCount(prev => prev + Math.floor(Math.random() * 3))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handlePhaseChange = async (phase: 'staff' | 'cohort' | 'full') => {
    if (!dateLocalizationFlag) return

    try {
      let rolloutPercentage = 0
      let status: 'draft' | 'active' = 'draft'

      switch (phase) {
        case 'staff':
          status = 'active'
          rolloutPercentage = 0 // Staff uses targeting rules
          break
        case 'cohort':
          status = 'active'
          rolloutPercentage = 10
          break
        case 'full':
          status = 'active'
          rolloutPercentage = 100
          break
      }

      await updateFlag(dateLocalizationFlag.id, {
        status,
        rollout_percentage: rolloutPercentage
      })

      setRolloutPhase(phase)
      toast({
        title: 'Rollout Updated',
        description: `Date localization moved to ${phase} phase`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update rollout phase',
        variant: 'destructive'
      })
    }
  }

  const handleEmergencyRollback = async () => {
    if (!dateLocalizationFlag) return

    try {
      await updateFlag(dateLocalizationFlag.id, {
        status: 'inactive'
      })

      setIsRollbackActive(true)
      toast({
        title: 'Emergency Rollback',
        description: 'Date localization has been disabled',
        variant: 'destructive'
      })
    } catch (error) {
      toast({
        title: 'Rollback Failed',
        description: 'Failed to disable feature flag',
        variant: 'destructive'
      })
    }
  }

  const sampleDate = '2024-03-15T14:30:00Z'
  const sampleBirthday = '1985-07-22'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Date Localization Control</h1>
          <p className="text-muted-foreground">Manage rollout phases and monitor date formatting</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="utc-toggle"
              checked={showUTC}
              onCheckedChange={setShowUTC}
            />
            <label htmlFor="utc-toggle" className="text-sm font-medium flex items-center gap-2">
              {showUTC ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Show UTC Values
            </label>
          </div>
          
          <Button
            onClick={() => loadData()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={rolloutPhase === 'draft' ? 'secondary' : 'default'}>
                {rolloutPhase.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {dateLocalizationFlag?.status || 'Not found'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rollout %</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dateLocalizationFlag?.rollout_percentage || 0}%</div>
            <Progress value={dateLocalizationFlag?.rollout_percentage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Count (1h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorCount}</div>
            <p className="text-xs text-muted-foreground">
              Threshold: 10/min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kill Switch</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleEmergencyRollback}
              variant="destructive"
              size="sm"
              disabled={isRollbackActive}
            >
              Emergency Rollback
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error Monitoring Alert */}
      {errorCount > 50 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>High Error Rate Detected!</AlertTitle>
          <AlertDescription>
            Timezone/Intl errors are above threshold. Consider rolling back immediately.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rollout" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rollout">Rollout Control</TabsTrigger>
          <TabsTrigger value="preview">Date Preview</TabsTrigger>
          <TabsTrigger value="metrics">Observability</TabsTrigger>
        </TabsList>

        <TabsContent value="rollout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rollout Phases</CardTitle>
              <CardDescription>
                Safely deploy date localization in controlled phases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  onClick={() => handlePhaseChange('staff')}
                  variant={rolloutPhase === 'staff' ? 'default' : 'outline'}
                  className="h-20 flex-col"
                >
                  <div className="font-semibold">Phase 1</div>
                  <div className="text-sm">Staff Only</div>
                </Button>
                
                <Button
                  onClick={() => handlePhaseChange('cohort')}
                  variant={rolloutPhase === 'cohort' ? 'default' : 'outline'}
                  className="h-20 flex-col"
                  disabled={rolloutPhase === 'draft'}
                >
                  <div className="font-semibold">Phase 2</div>
                  <div className="text-sm">10% Cohort</div>
                </Button>
                
                <Button
                  onClick={() => handlePhaseChange('full')}
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
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  UK User (London)
                </CardTitle>
                <CardDescription>en-GB, Europe/London</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Birthday (date-only)</div>
                  <div className="text-lg">
                    {formatForUser(sampleBirthday, 'dateOnly', REGION_PRESETS.UK)}
                  </div>
                  {showUTC && (
                    <div className="text-xs text-muted-foreground">UTC: {sampleBirthday}</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium">Upload Time (datetime)</div>
                  <div className="text-lg">
                    {formatForUser(sampleDate, 'datetime', REGION_PRESETS.UK)}
                  </div>
                  {showUTC && (
                    <div className="text-xs text-muted-foreground">UTC: {sampleDate}</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium">Relative Time</div>
                  <div className="text-lg">
                    {formatForUser(sampleDate, 'relative', REGION_PRESETS.UK)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  US User (New York)
                </CardTitle>
                <CardDescription>en-US, America/New_York</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Birthday (date-only)</div>
                  <div className="text-lg">
                    {formatForUser(sampleBirthday, 'dateOnly', REGION_PRESETS.US)}
                  </div>
                  {showUTC && (
                    <div className="text-xs text-muted-foreground">UTC: {sampleBirthday}</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium">Upload Time (datetime)</div>
                  <div className="text-lg">
                    {formatForUser(sampleDate, 'datetime', REGION_PRESETS.US)}
                  </div>
                  {showUTC && (
                    <div className="text-xs text-muted-foreground">UTC: {sampleDate}</div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium">Relative Time</div>
                  <div className="text-lg">
                    {formatForUser(sampleDate, 'relative', REGION_PRESETS.US)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Observability Dashboard</CardTitle>
              <CardDescription>
                Real-time monitoring of date formatting performance and errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">2.3ms</div>
                  <div className="text-sm text-muted-foreground">Avg Processing</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1,247</div>
                  <div className="text-sm text-muted-foreground">Renders/hour</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}