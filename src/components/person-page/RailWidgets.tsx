/**
 * Rail Widget wrappers for PageLayoutManager
 * Each widget component is wrapped to work with the layout system
 */

import React from 'react'
import { Person } from '@/utils/personUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'
import TOCBlock from './blocks/TOCBlock'
import { ContributeCTA } from './blocks/ContributeCTA'
import { AnniversariesWidget } from './blocks/AnniversariesWidget'
import { VisibilitySearchStatus } from './blocks/VisibilitySearchStatus'
import { MiniMap } from './blocks/MiniMap'
import { MediaCounters } from './blocks/MediaCounters'
import { FavoritesQuirks } from './blocks/FavoritesQuirks'
import { CausesBlock } from './blocks/CausesBlock'
import { ShareExport } from './blocks/ShareExport'

interface WidgetProps {
  personId: string
  person: Person
  familyId: string
  preset: 'life' | 'tribute'
  visibility: string
  indexability: string
  canEdit: boolean
  onUpdate: () => void
}

export function QuickFactsWidget({ person }: Pick<WidgetProps, 'person'>) {
  return (
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
}

export function PinnedHighlightsWidget() {
  // Placeholder for pinned highlights
  return null
}

export function TOCWidget() {
  return <TOCBlock />
}

export function ContributeCTAWidget({ 
  personId, 
  familyId, 
  preset, 
  visibility 
}: Pick<WidgetProps, 'personId' | 'familyId' | 'preset' | 'visibility'>) {
  return (
    <ContributeCTA
      personId={personId}
      familyId={familyId}
      preset={preset}
      visibility={visibility}
      canContribute={true}
    />
  )
}

export function AnniversariesWidgetWrapper({ 
  person, 
  preset, 
  canEdit 
}: Pick<WidgetProps, 'person' | 'preset' | 'canEdit'>) {
  return (
    <AnniversariesWidget
      person={person}
      preset={preset}
      canManageReminders={canEdit}
    />
  )
}

export function VisibilitySearchWidget({ 
  personId, 
  visibility, 
  indexability, 
  canEdit, 
  onUpdate 
}: Pick<WidgetProps, 'personId' | 'visibility' | 'indexability' | 'canEdit' | 'onUpdate'>) {
  return (
    <VisibilitySearchStatus
      personId={personId}
      visibility={visibility}
      indexability={indexability}
      canEdit={canEdit}
      onUpdate={onUpdate}
    />
  )
}

export function MiniMapWidget({ personId, familyId }: Pick<WidgetProps, 'personId' | 'familyId'>) {
  return <MiniMap personId={personId} familyId={familyId} />
}

export function MediaCountersWidget({ personId, familyId }: Pick<WidgetProps, 'personId' | 'familyId'>) {
  return <MediaCounters personId={personId} familyId={familyId} />
}

export function FavoritesQuirksWidget({ 
  personId, 
  familyId, 
  canEdit, 
  onUpdate 
}: Pick<WidgetProps, 'personId' | 'familyId' | 'canEdit' | 'onUpdate'>) {
  return (
    <FavoritesQuirks
      personId={personId}
      familyId={familyId}
      canEdit={canEdit}
      onUpdate={onUpdate}
    />
  )
}

export function CausesWidget({ 
  personId, 
  familyId, 
  canEdit, 
  onUpdate 
}: Pick<WidgetProps, 'personId' | 'familyId' | 'canEdit' | 'onUpdate'>) {
  return (
    <CausesBlock
      personId={personId}
      familyId={familyId}
      canEdit={canEdit}
      onUpdate={onUpdate}
    />
  )
}

export function ShareExportWidget({ 
  personId, 
  familyId, 
  person, 
  preset, 
  canEdit 
}: Pick<WidgetProps, 'personId' | 'familyId' | 'person' | 'preset' | 'canEdit'>) {
  const personName = `${person.given_name}${person.surname ? ` ${person.surname}` : ''}`
  const isMemorialized = preset === 'tribute'
  
  return (
    <ShareExport
      personId={personId}
      familyId={familyId}
      personName={personName}
      isMemorialized={isMemorialized}
      canExportPDF={canEdit}
    />
  )
}
