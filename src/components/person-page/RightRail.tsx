import React from 'react'
import { Person } from '@/utils/personUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import TOCBlock from './blocks/TOCBlock'
import { ContributeCTA } from './blocks/ContributeCTA'
import { AnniversariesWidget } from './blocks/AnniversariesWidget'
import { VisibilitySearchStatus } from './blocks/VisibilitySearchStatus'
import { MiniMap } from './blocks/MiniMap'
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
  config?: RightRailConfig
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

const MediaCountersSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Image className="h-4 w-4" />
        Media Stats
      </CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-3 text-sm">
      <div className="text-center">
        <div className="text-2xl font-bold">0</div>
        <div className="text-muted-foreground text-xs">Photos</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">0</div>
        <div className="text-muted-foreground text-xs">Stories</div>
      </div>
    </CardContent>
  </Card>
)

const FavoritesQuirksSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Heart className="h-4 w-4" />
        Favorites & Quirks
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      <p>Add favorite things and quirks</p>
    </CardContent>
  </Card>
)

const CausesSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Causes & Legacy
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      <p>No causes listed yet</p>
    </CardContent>
  </Card>
)

const ShareExportSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Share & Export
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <Button variant="outline" size="sm" className="w-full">
        Share Page
      </Button>
      <Button variant="outline" size="sm" className="w-full">
        Export PDF
      </Button>
    </CardContent>
  </Card>
)

export function RightRail({
  person_id,
  person,
  preset,
  viewer_role,
  visibility,
  indexability,
  config = {
    quickFacts: true,
    pinnedHighlights: true,
    toc: true,
    contributeCTA: true,
    anniversaries: true,
    visibilitySearch: false,
    miniMap: false,
    mediaCounters: true,
    favoritesQuirks: false,
    causes: false,
    shareExport: true
  },
  className,
  canEdit,
  onUpdate
}: RightRailProps) {
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
        {config.mediaCounters && <MediaCountersSlot />}
        {config.favoritesQuirks && <FavoritesQuirksSlot />}
        {config.causes && <CausesSlot />}
        {config.shareExport && <ShareExportSlot />}
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
        {config.mediaCounters && <MediaCountersSlot />}
        {config.shareExport && <ShareExportSlot />}
      </div>
    </div>
  )
}
