import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ActivationKPICardProps {
  title: string
  value: string
  subtitle: string
  change?: number
  icon: React.ComponentType<{ className?: string }>
}

export default function ActivationKPICard({
  title,
  value,
  subtitle,
  change,
  icon: Icon
}: ActivationKPICardProps) {
  const getTrendIcon = () => {
    if (!change) return <Minus className="h-3 w-3" />
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    return <TrendingDown className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (!change) return 'text-muted-foreground'
    if (change > 0) return 'text-green-600'
    return 'text-red-600'
  }

  const getTrendBadgeVariant = () => {
    if (!change) return 'secondary'
    if (change > 0) return 'default'
    return 'destructive'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
          {change !== undefined && (
            <Badge variant={getTrendBadgeVariant()} className="gap-1">
              {getTrendIcon()}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}