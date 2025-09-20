import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, Zap, TrendingUp } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface CollisionSignal {
  id: string
  family_id: string
  name_slug: string
  risk_score: number
  collision_candidates: string[]
  last_computed_at: string
  hashed_signals: any
}

export function CollisionDetectionPanel() {
  const [collisions, setCollisions] = useState<CollisionSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [runningDetection, setRunningDetection] = useState(false)

  useEffect(() => {
    loadCollisionSignals()
  }, [])

  const loadCollisionSignals = async () => {
    try {
      const { data, error } = await supabase
        .from('family_collision_signals')
        .select('*')
        .gte('risk_score', 10) // Only show medium to high risk
        .order('risk_score', { ascending: false })
        .limit(20)

      if (error) throw error
      setCollisions(data || [])
    } catch (error) {
      console.error('Error loading collision signals:', error)
      toast({
        title: "Error",
        description: "Failed to load collision signals",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const runCollisionDetection = async () => {
    setRunningDetection(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('collision-detector', {
        body: { manual_trigger: true }
      })

      if (error) throw error

      toast({
        title: "Detection Complete",
        description: `Processed ${data.families_processed} families, found ${data.collisions_found} potential collisions`,
      })

      await loadCollisionSignals()
    } catch (error) {
      console.error('Error running collision detection:', error)
      toast({
        title: "Error",
        description: "Failed to run collision detection",
        variant: "destructive"
      })
    } finally {
      setRunningDetection(false)
    }
  }

  const suggestMerge = async (sourceId: string, targetId: string, confidence: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('families-suggest-merge', {
        body: {
          source_family_id: sourceId,
          target_family_id: targetId,
          confidence_score: confidence,
          reason: 'Manual suggestion from collision detection panel'
        }
      })

      if (error) throw error

      toast({
        title: "Merge Suggested",
        description: "The merge proposal has been created and is pending review",
      })
    } catch (error) {
      console.error('Error suggesting merge:', error)
      toast({
        title: "Error",
        description: "Failed to create merge suggestion",
        variant: "destructive"
      })
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 50) return { level: 'High', variant: 'destructive' as const, color: 'text-red-600' }
    if (score >= 30) return { level: 'Medium', variant: 'default' as const, color: 'text-amber-600' }
    return { level: 'Low', variant: 'secondary' as const, color: 'text-blue-600' }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collision Detection</h2>
          <p className="text-muted-foreground">Monitor and manage potential family duplicates</p>
        </div>
        <Button onClick={runCollisionDetection} disabled={runningDetection}>
          <RefreshCw className={`h-4 w-4 mr-2 ${runningDetection ? 'animate-spin' : ''}`} />
          Run Detection
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{collisions.length}</p>
                <p className="text-sm text-muted-foreground">Potential Collisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{collisions.filter(c => c.risk_score >= 50).length}</p>
                <p className="text-sm text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {collisions.reduce((sum, c) => sum + c.collision_candidates.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collision List */}
      <div className="space-y-4">
        {collisions.map(collision => {
          const risk = getRiskLevel(collision.risk_score)
          
          return (
            <Card key={collision.id} className={`border-l-4 ${
              collision.risk_score >= 50 ? 'border-l-red-500' :
              collision.risk_score >= 30 ? 'border-l-amber-500' : 'border-l-blue-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Family: {collision.name_slug}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={risk.variant}>
                      {risk.level} Risk
                    </Badge>
                    <span className={`text-lg font-bold ${risk.color}`}>
                      {collision.risk_score}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  {collision.collision_candidates.length} potential matches • 
                  Last computed {new Date(collision.last_computed_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-2">Collision Candidates</p>
                  <div className="space-y-2">
                    {collision.collision_candidates.slice(0, 3).map((candidateId, index) => (
                      <div key={candidateId} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-mono">{candidateId.slice(0, 8)}...</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => suggestMerge(collision.family_id, candidateId, Math.min(collision.risk_score / 10, 10))}
                        >
                          Suggest Merge
                        </Button>
                      </div>
                    ))}
                    {collision.collision_candidates.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{collision.collision_candidates.length - 3} more candidates
                      </p>
                    )}
                  </div>
                </div>

                {collision.hashed_signals && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-medium text-sm mb-1">Detection Signals</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {collision.hashed_signals.name_hash && (
                        <p>Name hash: {collision.hashed_signals.name_hash.slice(0, 12)}...</p>
                      )}
                      {collision.hashed_signals.created_week && (
                        <p>Created week: {collision.hashed_signals.created_week}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {collisions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No collision risks detected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Run detection to check for potential family duplicates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}