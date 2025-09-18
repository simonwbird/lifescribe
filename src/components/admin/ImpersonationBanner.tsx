import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, Clock, LogOut, AlertTriangle } from 'lucide-react'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { IMPERSONATION_TIMEOUT_MS } from '@/lib/impersonationTypes'

export default function ImpersonationBanner() {
  const { impersonationState, endImpersonation } = useImpersonation()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    if (!impersonationState.isImpersonating || !impersonationState.startedAt) {
      return
    }

    const updateTimeRemaining = () => {
      const elapsed = Date.now() - new Date(impersonationState.startedAt!).getTime()
      const remaining = Math.max(0, IMPERSONATION_TIMEOUT_MS - elapsed)
      setTimeRemaining(remaining)
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [impersonationState])

  if (!impersonationState.isImpersonating || !impersonationState.target) {
    return null
  }

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const isNearTimeout = timeRemaining < 5 * 60 * 1000 // 5 minutes

  return (
    <Alert className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-orange-600" />
          <div>
            <span className="font-medium">
              You're viewing as {impersonationState.target.name}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                Read-Only Mode
              </Badge>
              <Badge variant="outline" className="text-xs">
                All actions are logged
              </Badge>
              <div className={`flex items-center gap-1 text-xs ${isNearTimeout ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3" />
                {formatTimeRemaining(timeRemaining)} remaining
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => endImpersonation()}
          className="gap-2 hover:bg-orange-100 border-orange-300"
        >
          <LogOut className="h-3 w-3" />
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  )
}