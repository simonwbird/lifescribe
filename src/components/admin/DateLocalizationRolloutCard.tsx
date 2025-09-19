/**
 * Rollout progress card for date localization feature flag
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'

interface RolloutPhase {
  name: string
  description: string
  percentage: number
  status: 'pending' | 'active' | 'completed' | 'failed'
  targetUsers: string
  startDate?: string
  completedDate?: string
}

interface DateLocalizationRolloutCardProps {
  currentPhase: number
  phases: RolloutPhase[]
  onPhaseActivate: (phaseIndex: number) => void
  errorRate: number
  isEmergencyRollback: boolean
}

export default function DateLocalizationRolloutCard({
  currentPhase,
  phases,
  onPhaseActivate,
  errorRate,
  isEmergencyRollback
}: DateLocalizationRolloutCardProps) {
  const getPhaseIcon = (status: RolloutPhase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Users className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: RolloutPhase['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'active':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Date Localization Rollout
          {isEmergencyRollback && (
            <Badge variant="destructive">Emergency Rollback Active</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Progressive deployment of locale-aware date formatting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round((currentPhase / (phases.length - 1)) * 100)}%</span>
          </div>
          <Progress value={(currentPhase / (phases.length - 1)) * 100} />
        </div>

        {/* Error Rate Alert */}
        {errorRate > 5 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Error rate at {errorRate}% - Monitor closely
            </span>
          </div>
        )}

        {/* Phase List */}
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-3 border rounded-lg ${
                index === currentPhase ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                {getPhaseIcon(phase.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{phase.name}</h4>
                  <Badge variant={getStatusColor(phase.status)}>
                    {phase.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {phase.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>Target: {phase.targetUsers}</span>
                  <span>Rollout: {phase.percentage}%</span>
                  {phase.startDate && <span>Started: {phase.startDate}</span>}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {index > currentPhase && phase.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPhaseActivate(index)}
                    disabled={index > currentPhase + 1 || isEmergencyRollback}
                  >
                    Activate
                  </Button>
                )}
                {index === currentPhase && (
                  <Badge>Current</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}