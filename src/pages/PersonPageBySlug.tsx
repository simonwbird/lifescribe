import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function PersonPageBySlug() {
  const { slug } = useParams<{ slug: string }>()
  
  const { data: personId, isLoading, error } = useQuery({
    queryKey: ['person-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people' as any)
        .select('id')
        .eq('slug', slug)
        .single() as any
      
      if (error) throw error
      return data?.id as string
    },
    enabled: !!slug
  })
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (error || !personId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Person page not found. This link may be broken or the page may have been removed.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // Redirect to the actual PersonPage with the resolved ID
  return <Navigate to={`/people/${personId}/page`} replace />
}
