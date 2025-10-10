import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import Header from '@/components/Header'
import { AnalyticsDashboard } from '@/components/analytics'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          navigate('/auth')
          return
        }

        // Get user's family (assuming they have at least one)
        const { data: membership } = await supabase
          .from('members')
          .select('family_id, role')
          .eq('profile_id', user.id)
          .single()

        if (!membership) {
          setError('No family membership found')
          return
        }

        // Only allow admins to view analytics
        if (membership.role !== 'admin') {
          setError('Analytics are only available to family administrators')
          return
        }

        setFamilyId(membership.family_id)
      } catch (err: any) {
        console.error('Access check error:', err)
        setError(err.message || 'Failed to verify access')
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !familyId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Unable to load analytics'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <AnalyticsDashboard familyId={familyId} />
      </div>
    </div>
  )
}
