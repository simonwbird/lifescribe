import { ReactNode, useState, useTransition } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

interface OptimisticUIProps {
  children: ReactNode
  fallback?: ReactNode
  action: () => Promise<void>
  isLoading?: boolean
}

export function OptimisticUI({ children, fallback, action, isLoading }: OptimisticUIProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticState, setOptimisticState] = useState<ReactNode>(null)

  const handleAction = () => {
    startTransition(() => {
      setOptimisticState(fallback)
      action().then(() => {
        setOptimisticState(null)
      }).catch(() => {
        setOptimisticState(null)
      })
    })
  }

  if (isPending || isLoading) {
    return optimisticState || fallback || <OptimisticFeedSkeleton />
  }

  return <>{children}</>
}

export function OptimisticFeedSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading content">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Loading family updates...</span>
    </div>
  )
}

export function OptimisticPromptSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading prompts">
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
      <span className="sr-only">Loading prompt content...</span>
    </div>
  )
}