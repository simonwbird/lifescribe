import React from 'react'
import { logError } from '@/lib/errorLogger'

interface ErrorBoundaryProps {
  route: string
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  async componentDidCatch(error: Error) {
    try {
      await logError({ route: this.props.route, error })
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded-md border p-4 text-sm">
          <p className="font-medium">Something went wrong loading this section.</p>
          <p className="text-muted-foreground">Please reload the page.</p>
        </div>
      )
    }
    return this.props.children
  }
}
