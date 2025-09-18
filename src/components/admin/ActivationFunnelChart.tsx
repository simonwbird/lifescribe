import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Mail, Calendar, Clock, ArrowRight } from 'lucide-react'
import type { ActivationFunnel, FamilyStuckData } from '@/lib/activationTypes'
import { useAnalytics } from '@/hooks/useAnalytics'
import { formatDistanceToNow } from 'date-fns'

interface ActivationFunnelChartProps {
  funnel: ActivationFunnel
}

export default function ActivationFunnelChart({ funnel }: ActivationFunnelChartProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [showStuckFamilies, setShowStuckFamilies] = useState(false)
  const { track } = useAnalytics()

  const handleStageClick = (stageId: string) => {
    const stage = funnel.stages.find(s => s.id === stageId)
    if (stage && stage.stuckFamilies.length > 0) {
      setSelectedStage(stageId)
      setShowStuckFamilies(true)
      track('ADMIN_FUNNEL_STAGE_CLICKED' as any, {
        stage: stageId,
        stuckCount: stage.stuckFamilies.length
      })
    }
  }

  const handleNudge = (family: FamilyStuckData) => {
    track('ADMIN_NUDGE_SENT' as any, {
      familyId: family.id,
      familyName: family.name,
      stage: selectedStage,
      daysSinceSignup: family.daysSinceSignup
    })
    
    // TODO: Implement actual nudge functionality
    console.log('Sending nudge to:', family.name)
  }

  const selectedStageData = selectedStage 
    ? funnel.stages.find(s => s.id === selectedStage)
    : null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Activation Funnel</CardTitle>
          <p className="text-sm text-muted-foreground">
            From signup to first digest sent
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnel.stages.map((stage, index) => {
              const hasStuckFamilies = stage.stuckFamilies.length > 0
              const isClickable = hasStuckFamilies

              return (
                <div key={stage.id} className="flex items-center gap-4">
                  {/* Stage Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Stage Card */}
                  <div 
                    className={`flex-1 p-4 border rounded-lg transition-colors ${
                      isClickable 
                        ? 'cursor-pointer hover:border-primary hover:bg-primary/5' 
                        : 'cursor-default'
                    }`}
                    onClick={() => isClickable && handleStageClick(stage.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{stage.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold">{stage.count.toLocaleString()}</span>
                          <Badge variant="secondary">{stage.percentage}%</Badge>
                          {hasStuckFamilies && (
                            <Badge variant="destructive">
                              {stage.stuckFamilies.length} stuck
                            </Badge>
                          )}
                        </div>
                      </div>
                      {hasStuckFamilies && (
                        <Button variant="ghost" size="sm">
                          View Stuck Families
                        </Button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Arrow to next stage */}
                  {index < funnel.stages.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((funnel.stages[funnel.stages.length - 1].count / funnel.totalSignups) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Complete Funnel</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {funnel.stages.reduce((sum, stage) => sum + stage.stuckFamilies.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Families Stuck</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {funnel.totalSignups.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Signups</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(((funnel.stages[1].count - funnel.stages[funnel.stages.length - 1].count) / funnel.stages[1].count) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Drop-off Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stuck Families Modal */}
      <Dialog open={showStuckFamilies} onOpenChange={setShowStuckFamilies}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Families Stuck at: {selectedStageData?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStageData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedStageData.stuckFamilies.map((family) => (
                  <Card key={family.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium">{family.name}</h3>
                          <p className="text-sm text-muted-foreground">{family.email}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(family.createdAt), { addSuffix: true })}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {family.daysSinceSignup} days since signup
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Missing:</p>
                          {family.missingSteps.map((step, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs mr-1">
                              {step}
                            </Badge>
                          ))}
                        </div>

                        <Button 
                          size="sm" 
                          className="w-full gap-2"
                          onClick={() => handleNudge(family)}
                        >
                          <Mail className="h-3 w-3" />
                          Send Nudge
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}