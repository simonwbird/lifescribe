import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Settings } from 'lucide-react'

interface RightRailSlots {
  QuickFacts: boolean
  PinnedHighlights: boolean
  TOC: boolean
  ContributeCTA: boolean
  Anniversaries: boolean
  VisibilitySearch: boolean
  MiniMap: boolean
  MediaCounters: boolean
  FavoritesQuirks: boolean
  Causes: boolean
  ShareExport: boolean
}

interface RightRailCustomizeProps {
  personId: string
  canEdit?: boolean
}

const slotLabels: Record<keyof RightRailSlots, string> = {
  QuickFacts: 'Quick Facts',
  PinnedHighlights: 'Pinned Highlights',
  TOC: 'Table of Contents',
  ContributeCTA: 'Contribute CTA',
  Anniversaries: 'Anniversaries',
  VisibilitySearch: 'Visibility & Search',
  MiniMap: 'Mini Map',
  MediaCounters: 'Media Counters',
  FavoritesQuirks: 'Favorites & Quirks',
  Causes: 'Causes & Donations',
  ShareExport: 'Share & Export'
}

const slotDescriptions: Record<keyof RightRailSlots, string> = {
  QuickFacts: 'Birth, death, gender, and alternate names',
  PinnedHighlights: 'Pin favorite moments to the top',
  TOC: 'Jump to sections on the page',
  ContributeCTA: 'Encourage visitors to add memories',
  Anniversaries: 'Show upcoming dates and reminders',
  VisibilitySearch: 'Control page visibility and search indexing',
  MiniMap: 'Interactive locations map',
  MediaCounters: 'Quick stats and navigation links',
  FavoritesQuirks: 'Personal preferences and hobbies',
  Causes: 'Memorial funds and charities',
  ShareExport: 'Share link, QR code, and PDF export'
}

export function RightRailCustomize({ personId, canEdit = false }: RightRailCustomizeProps) {
  const [slots, setSlots] = useState<RightRailSlots | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRailConfig()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('rail-config-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'people',
          filter: `id=eq.${personId}`
        },
        (payload: any) => {
          if (payload.new?.rail_config?.slots) {
            setSlots(payload.new.rail_config.slots)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [personId])

  const fetchRailConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('rail_config')
        .eq('id', personId)
        .single()

      if (error) throw error

      // Parse and set slots from database or use defaults
      const railConfig = data?.rail_config as { slots?: RightRailSlots } | null
      setSlots(railConfig?.slots || {
        QuickFacts: true,
        PinnedHighlights: true,
        TOC: true,
        ContributeCTA: true,
        Anniversaries: true,
        VisibilitySearch: false,
        MiniMap: true,
        MediaCounters: true,
        FavoritesQuirks: true,
        Causes: true,
        ShareExport: true
      })
    } catch (error) {
      console.error('Error fetching rail config:', error)
      toast({
        title: 'Failed to load configuration',
        description: 'Could not load right rail settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSlot = async (slotName: keyof RightRailSlots, enabled: boolean) => {
    if (!canEdit || !slots) return

    setUpdating(slotName)
    const newSlots = { ...slots, [slotName]: enabled }

    try {
      const { error } = await supabase
        .from('people')
        .update({
          rail_config: {
            slots: newSlots
          }
        })
        .eq('id', personId)

      if (error) throw error

      setSlots(newSlots)
      
      toast({
        title: 'Settings updated',
        description: `${slotLabels[slotName]} ${enabled ? 'enabled' : 'disabled'}`
      })
    } catch (error) {
      console.error('Error updating rail config:', error)
      toast({
        title: 'Update failed',
        description: 'Could not save right rail settings',
        variant: 'destructive'
      })
    } finally {
      setUpdating(null)
    }
  }

  if (!canEdit) {
    return null
  }

  if (loading || !slots) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Right Rail Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(slots) as Array<keyof RightRailSlots>).map((slotName) => (
          <div key={slotName} className="flex items-start justify-between gap-4 py-2">
            <div className="flex-1 space-y-1">
              <Label 
                htmlFor={`slot-${slotName}`}
                className="text-sm font-medium cursor-pointer"
              >
                {slotLabels[slotName]}
              </Label>
              <p className="text-xs text-muted-foreground">
                {slotDescriptions[slotName]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {updating === slotName && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                id={`slot-${slotName}`}
                checked={slots[slotName]}
                onCheckedChange={(checked) => updateSlot(slotName, checked)}
                disabled={updating === slotName}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
