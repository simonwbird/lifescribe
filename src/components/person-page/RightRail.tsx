import React, { useState, useEffect } from 'react'
import { Person } from '@/utils/personUtils'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import TOCBlock from './blocks/TOCBlock'
import { ContributeCTA } from './blocks/ContributeCTA'
import { AnniversariesWidget } from './blocks/AnniversariesWidget'
import { VisibilitySearchStatus } from './blocks/VisibilitySearchStatus'
import { MiniMap } from './blocks/MiniMap'
import { MediaCounters } from './blocks/MediaCounters'
import { FavoritesQuirks } from './blocks/FavoritesQuirks'
import { CausesBlock } from './blocks/CausesBlock'
import { ShareExport } from './blocks/ShareExport'
import { 
  Info, 
  Pin, 
  List, 
  Plus, 
  Calendar, 
  Search, 
  Map, 
  Image, 
  Heart,
  FileText,
  Share2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RightRailConfig {
  quickFacts?: boolean
  pinnedHighlights?: boolean
  toc?: boolean
  contributeCTA?: boolean
  anniversaries?: boolean
  visibilitySearch?: boolean
  miniMap?: boolean
  mediaCounters?: boolean
  favoritesQuirks?: boolean
  causes?: boolean
  shareExport?: boolean
}

interface RightRailProps {
  person_id: string
  person: Person
  preset: 'life' | 'tribute'
  viewer_role: string | null
  visibility: string
  indexability: string
  className?: string
  canEdit?: boolean
  onUpdate?: () => void
}

// Slot Components
const QuickFactsSlot = ({ person }: { person: Person }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Info className="h-4 w-4" />
        Quick Facts
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      {person.birth_date && (
        <div>
          <span className="text-muted-foreground">Born:</span>{' '}
          <span>{new Date(person.birth_date).toLocaleDateString()}</span>
          {(person as any).birth_place && (
            <span className="text-muted-foreground text-xs block ml-0 mt-0.5">
              {(person as any).birth_place}
            </span>
          )}
        </div>
      )}
      {!person.is_living && person.death_date && (
        <div>
          <span className="text-muted-foreground">Died:</span>{' '}
          <span>{new Date(person.death_date).toLocaleDateString()}</span>
          {(person as any).death_place && (
            <span className="text-muted-foreground text-xs block ml-0 mt-0.5">
              {(person as any).death_place}
            </span>
          )}
        </div>
      )}
      {person.gender && (
        <div>
          <span className="text-muted-foreground">Gender:</span>{' '}
          <span className="capitalize">{person.gender}</span>
        </div>
      )}
      {person.alt_names && person.alt_names.length > 0 && (
        <div>
          <span className="text-muted-foreground">Also known as:</span>{' '}
          <span>{person.alt_names.join(', ')}</span>
        </div>
      )}
    </CardContent>
  </Card>
)

const PinnedHighlightsSlot = ({ personId, familyId, canEdit, onUpdate }: { 
  personId: string
  familyId: string
  canEdit?: boolean
  onUpdate?: () => void 
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Pin className="h-4 w-4" />
        Pinned Highlights
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      <div className="text-center py-4">
        <p className="mb-3">Pin your favorite moments to keep them at the top</p>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={onUpdate}>
            <Pin className="h-3 w-3 mr-2" />
            Pin Highlights
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
)

const TOCSlot = () => {
  return <TOCBlock />
}

const ContributeCTASlot = ({ 
  personId, 
  familyId, 
  preset, 
  visibility,
  canContribute 
}: { 
  personId: string
  familyId: string
  preset: 'life' | 'tribute'
  visibility: string
  canContribute?: boolean
}) => (
  <ContributeCTA
    personId={personId}
    familyId={familyId}
    preset={preset}
    visibility={visibility}
    canContribute={canContribute}
  />
)

const AnniversariesSlot = ({ 
  person, 
  preset,
  canManageReminders 
}: { 
  person: Person
  preset: 'life' | 'tribute'
  canManageReminders?: boolean
}) => (
  <AnniversariesWidget 
    person={person}
    preset={preset}
    canManageReminders={canManageReminders}
  />
)

const VisibilitySearchSlot = ({ 
  personId,
  visibility, 
  indexability,
  canEdit,
  lastIndexedAt,
  onUpdate
}: { 
  personId: string
  visibility: string
  indexability: string
  canEdit?: boolean
  lastIndexedAt?: Date | null
  onUpdate?: () => void
}) => (
  <VisibilitySearchStatus
    personId={personId}
    visibility={visibility}
    indexability={indexability}
    canEdit={canEdit}
    lastIndexedAt={lastIndexedAt}
    onUpdate={onUpdate}
  />
)

const MiniMapSlot = ({ 
  personId, 
  familyId 
}: { 
  personId: string
  familyId: string
}) => (
  <MiniMap personId={personId} familyId={familyId} />
)

const MediaCountersSlot = ({ 
  personId, 
  familyId 
}: { 
  personId: string
  familyId: string
}) => (
  <MediaCounters personId={personId} familyId={familyId} />
)

const FavoritesQuirksSlot = ({ 
  personId, 
  familyId, 
  canEdit, 
  onUpdate 
}: { 
  personId: string
  familyId: string
  canEdit?: boolean
  onUpdate?: () => void
}) => (
  <FavoritesQuirks 
    personId={personId} 
    familyId={familyId}
    canEdit={canEdit}
    onUpdate={onUpdate}
  />
)

const CausesSlot = ({ 
  personId, 
  familyId, 
  canEdit, 
  onUpdate 
}: { 
  personId: string
  familyId: string
  canEdit?: boolean
  onUpdate?: () => void
}) => (
  <CausesBlock 
    personId={personId} 
    familyId={familyId}
    canEdit={canEdit}
    onUpdate={onUpdate}
  />
)

const ShareExportSlot = ({ 
  personId, 
  familyId,
  personName,
  isMemorialized,
  canExportPDF 
}: { 
  personId: string
  familyId: string
  personName: string
  isMemorialized: boolean
  canExportPDF?: boolean
}) => (
  <ShareExport 
    personId={personId} 
    familyId={familyId}
    personName={personName}
    isMemorialized={isMemorialized}
    canExportPDF={canExportPDF}
  />
)

export function RightRail({
  person_id,
  person,
  preset,
  viewer_role,
  visibility,
  indexability,
  className,
  canEdit,
  onUpdate
}: RightRailProps) {
  const [config, setConfig] = useState<RightRailConfig>({
    quickFacts: true,
    pinnedHighlights: true,
    toc: true,
    contributeCTA: true,
    anniversaries: true,
    visibilitySearch: false,
    miniMap: true,
    mediaCounters: true,
    favoritesQuirks: true,
    causes: true,
    shareExport: true
  })

  useEffect(() => {
    fetchRailConfig()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('person-rail-config')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'people',
          filter: `id=eq.${person_id}`
        },
        (payload: any) => {
          if (payload.new?.rail_config?.slots) {
            const dbSlots = payload.new.rail_config.slots
            setConfig({
              quickFacts: dbSlots.QuickFacts ?? true,
              pinnedHighlights: dbSlots.PinnedHighlights ?? true,
              toc: dbSlots.TOC ?? true,
              contributeCTA: dbSlots.ContributeCTA ?? true,
              anniversaries: dbSlots.Anniversaries ?? true,
              visibilitySearch: dbSlots.VisibilitySearch ?? false,
              miniMap: dbSlots.MiniMap ?? true,
              mediaCounters: dbSlots.MediaCounters ?? true,
              favoritesQuirks: dbSlots.FavoritesQuirks ?? true,
              causes: dbSlots.Causes ?? true,
              shareExport: dbSlots.ShareExport ?? true
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [person_id])

  const fetchRailConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('rail_config')
        .eq('id', person_id)
        .single()

      if (error) throw error

      // Parse database config and map to component config
      const railConfig = data?.rail_config as { slots?: Record<string, boolean> } | null
      const dbSlots = railConfig?.slots || {}

      setConfig({
        quickFacts: dbSlots.QuickFacts ?? true,
        pinnedHighlights: dbSlots.PinnedHighlights ?? true,
        toc: dbSlots.TOC ?? true,
        contributeCTA: dbSlots.ContributeCTA ?? true,
        anniversaries: dbSlots.Anniversaries ?? true,
        visibilitySearch: dbSlots.VisibilitySearch ?? false,
        miniMap: dbSlots.MiniMap ?? true,
        mediaCounters: dbSlots.MediaCounters ?? true,
        favoritesQuirks: dbSlots.FavoritesQuirks ?? true,
        causes: dbSlots.Causes ?? true,
        shareExport: dbSlots.ShareExport ?? true
      })
    } catch (error) {
      console.error('Error fetching rail config:', error)
      // Keep default config on error
    }
  }

  return (
    <div className={cn(className)}>
      {/* Desktop: Sticky rail */}
      <div className="hidden lg:block lg:sticky lg:top-[120px] space-y-4">
        {config.quickFacts && <QuickFactsSlot person={person} />}
        {config.pinnedHighlights && (
          <PinnedHighlightsSlot 
            personId={person_id} 
            familyId={person.family_id}
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        )}
        {config.toc && <TOCSlot />}
        {config.contributeCTA && (
          <ContributeCTASlot 
            personId={person_id}
            familyId={person.family_id}
            preset={preset}
            visibility={visibility}
            canContribute={canEdit}
          />
        )}
        {config.anniversaries && (
          <AnniversariesSlot 
            person={person} 
            preset={preset}
            canManageReminders={canEdit}
          />
        )}
        {config.visibilitySearch && (
          <VisibilitySearchSlot 
            personId={person_id}
            visibility={visibility} 
            indexability={indexability}
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        )}
        {config.miniMap && (
          <MiniMapSlot 
            personId={person_id} 
            familyId={person.family_id}
          />
        )}
        {config.mediaCounters && (
          <MediaCountersSlot 
            personId={person_id} 
            familyId={person.family_id}
          />
        )}
        {config.favoritesQuirks && (
          <FavoritesQuirksSlot 
            personId={person_id} 
            familyId={person.family_id}
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        )}
        {config.causes && (
          <CausesSlot 
            personId={person_id} 
            familyId={person.family_id}
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        )}
        {config.shareExport && (
          <ShareExportSlot 
            personId={person_id} 
            familyId={person.family_id}
            personName={`${person.given_name}${person.surname ? ` ${person.surname}` : ''}`}
            isMemorialized={!person.is_living}
            canExportPDF={canEdit}
          />
        )}
      </div>

      {/* Mobile: Stacks under Bio */}
      <div className="lg:hidden space-y-4 mt-6">
        {config.quickFacts && <QuickFactsSlot person={person} />}
        {config.contributeCTA && (
          <ContributeCTASlot 
            personId={person_id}
            familyId={person.family_id}
            preset={preset}
            visibility={visibility}
            canContribute={canEdit}
          />
        )}
        {config.anniversaries && (
          <AnniversariesSlot 
            person={person} 
            preset={preset}
            canManageReminders={canEdit}
          />
        )}
        {config.mediaCounters && (
          <MediaCountersSlot 
            personId={person_id} 
            familyId={person.family_id}
          />
        )}
        {config.shareExport && (
          <ShareExportSlot 
            personId={person_id} 
            familyId={person.family_id}
            personName={`${person.given_name}${person.surname ? ` ${person.surname}` : ''}`}
            isMemorialized={!person.is_living}
            canExportPDF={canEdit}
          />
        )}
      </div>
    </div>
  )
}
