import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useLabs } from '@/hooks/useLabs'

interface LabsGuardProps {
  children: ReactNode
  feature?: keyof import('@/hooks/useLabs').LabsFlags
  fallback?: string
}

export default function LabsGuard({ children, feature, fallback = '/labs' }: LabsGuardProps) {
  const { labsEnabled, flags, loading } = useLabs()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If labs is not enabled, redirect to labs page
  if (!labsEnabled) {
    return <Navigate to={fallback} replace />
  }

  // If specific feature is required and not enabled, redirect to labs page
  if (feature && !flags[feature]) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}