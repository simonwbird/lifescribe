import { usePerformanceBudget } from '@/hooks/usePerformanceBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

export function PerformanceBudgetMonitor() {
  const { budgetStatus, overallHealth } = usePerformanceBudget()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const healthConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'text-green-500',
      badge: 'default'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      badge: 'secondary'
    },
    critical: {
      icon: AlertCircle,
      color: 'text-red-500',
      badge: 'destructive'
    }
  }

  const config = healthConfig[overallHealth]
  const Icon = config.icon

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50 border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={config.color} />
          Performance Budget
          <Badge variant={config.badge as any} className="ml-auto">
            {overallHealth}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {budgetStatus.map((status) => (
          <div key={status.metric} className="flex items-center justify-between text-xs">
            <span className="truncate flex-1">{status.metric}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {status.actual.toFixed(status.metric.includes('Shift') ? 3 : 0)}
                {status.metric.includes('Shift') ? '' : 'ms'}
              </span>
              <Badge
                variant={
                  status.status === 'pass'
                    ? 'default'
                    : status.status === 'warn'
                    ? 'secondary'
                    : 'destructive'
                }
                className="text-xs"
              >
                {status.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
