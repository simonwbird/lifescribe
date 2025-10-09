import { lazy, Suspense, ComponentType, Component, ErrorInfo, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface LazyRouteProps {
  factory: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class LazyRouteErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyRoute Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <LazyRouteErrorUI onReset={this.props.onReset} />
    }

    return this.props.children
  }
}

function LazyRouteErrorUI({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">We couldn't load the memory page.</h1>
          <p className="text-muted-foreground">
            Something went wrong while loading this page. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onReset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/home')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
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

  const handleReset = () => {
    window.location.reload()
  }

  return (
    <LazyRouteErrorBoundary onReset={handleReset}>
      <Suspense fallback={fallback || defaultFallback}>
        <Component />
      </Suspense>
    </LazyRouteErrorBoundary>
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