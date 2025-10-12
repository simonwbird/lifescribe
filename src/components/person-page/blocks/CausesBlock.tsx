import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Heart } from 'lucide-react'
import { usePrivacyAnalytics } from '@/hooks/usePrivacyAnalytics'

interface CausesBlockProps {
  personId: string
  familyId: string
  canEdit?: boolean
  onUpdate?: () => void
}

interface CauseData {
  cause_name: string | null
  cause_url: string | null
  cause_note: string | null
}

export function CausesBlock({ personId, familyId, canEdit, onUpdate }: CausesBlockProps) {
  const [causeData, setCauseData] = useState<CauseData | null>(null)
  const [loading, setLoading] = useState(true)
  const { trackEvent } = usePrivacyAnalytics({ familyId })

  useEffect(() => {
    fetchCauseData()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('causes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'people',
          filter: `id=eq.${personId}`
        },
        () => {
          fetchCauseData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [personId])

  const fetchCauseData = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('cause_name, cause_url, cause_note')
        .eq('id', personId)
        .single()

      if (error) throw error
      
      // Only set data if at least one field has content
      if (data?.cause_name || data?.cause_url || data?.cause_note) {
        setCauseData(data)
      } else {
        setCauseData(null)
      }
    } catch (error) {
      console.error('Error fetching cause data:', error)
      setCauseData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCauseClick = () => {
    trackEvent('cause_click', {
      person_id: personId,
      cause_name: causeData?.cause_name || undefined
    })
  }

  // Don't render if no data
  if (loading || !causeData) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="h-4 w-4" />
          Causes & Legacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {causeData.cause_name && (
          <div>
            <h4 className="font-medium text-sm mb-1">{causeData.cause_name}</h4>
          </div>
        )}
        
        {causeData.cause_note && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {causeData.cause_note}
          </p>
        )}
        
        {causeData.cause_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a
              href={causeData.cause_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCauseClick}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Visit Cause
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
