import { lazy, Suspense, ComponentType } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyRouteProps {
  factory: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
}

export function LazyRoute({ factory, fallback }: LazyRouteProps) {
  const Component = lazy(factory)

  const defaultFallback = (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  )
}

// Preload helper for critical routes
export function preloadRoute(factory: () => Promise<{ default: ComponentType<any> }>) {
  // Preload on hover/focus for better UX
  return () => {
    factory().catch(() => {
      // Ignore preload errors
    })
  }
}