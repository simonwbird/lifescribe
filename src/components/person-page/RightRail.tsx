import React from 'react'
import { Person } from '@/utils/personUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

const PinnedHighlightsSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Pin className="h-4 w-4" />
        Pinned Highlights
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      <p>No highlights pinned yet</p>
    </CardContent>
  </Card>
)

const TOCSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <List className="h-4 w-4" />
        Table of Contents
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <a href="#hero" className="block text-foreground hover:text-primary transition-colors">
        Hero
      </a>
      <a href="#bio" className="block text-foreground hover:text-primary transition-colors">
        Biography
      </a>
      <a href="#timeline" className="block text-foreground hover:text-primary transition-colors">
        Timeline
      </a>
      <a href="#stories" className="block text-foreground hover:text-primary transition-colors">
        Stories
      </a>
    </CardContent>
  </Card>
)

const ContributeCTASlot = ({ preset }: { preset: 'life' | 'tribute' }) => (
  <Card className="bg-primary/5 border-primary/20">
    <CardContent className="pt-6 space-y-3">
      <div className="flex items-start gap-3">
        <Plus className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium text-sm mb-1">
            {preset === 'tribute' ? 'Share a Memory' : 'Add to Their Story'}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {preset === 'tribute' 
              ? 'Honor their memory with your stories and photos'
              : 'Help build their life story with photos and memories'}
          </p>
          <Button size="sm" className="w-full">
            Contribute
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)

const AnniversariesSlot = ({ person, preset }: { person: Person; preset: 'life' | 'tribute' }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {preset === 'tribute' ? 'Anniversaries' : 'Upcoming'}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm space-y-2">
      {person.birth_date && (
        <div>
          <Badge variant="outline" className="mb-1">Birthday</Badge>
          <p className="text-muted-foreground">
            {new Date(person.birth_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
      {person.death_date && (
        <div className="mt-2">
          <Badge variant="outline" className="mb-1">Memorial</Badge>
          <p className="text-muted-foreground">
            {new Date(person.death_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
)

const VisibilitySearchSlot = ({ visibility, indexability }: { visibility: string; indexability: string }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Search className="h-4 w-4" />
        Visibility & Discovery
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      <div>
        <span className="text-muted-foreground">Visibility:</span>{' '}
        <Badge variant="outline" className="ml-1">{visibility}</Badge>
      </div>
      <div>
        <span className="text-muted-foreground">Indexability:</span>{' '}
        <Badge variant="outline" className="ml-1">{indexability}</Badge>
      </div>
    </CardContent>
  </Card>
)

const MiniMapSlot = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Map className="h-4 w-4" />
        Places Map
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
        Map preview
      </div>
    </CardContent>
  </Card>
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
  className
}: RightRailProps) {
  return (
    <div className={cn(className)}>
      {/* Desktop: Sticky rail */}
      <div className="hidden lg:block lg:sticky lg:top-[120px] space-y-4">
        {config.quickFacts && <QuickFactsSlot person={person} />}
        {config.pinnedHighlights && <PinnedHighlightsSlot />}
        {config.toc && <TOCSlot />}
        {config.contributeCTA && <ContributeCTASlot preset={preset} />}
        {config.anniversaries && <AnniversariesSlot person={person} preset={preset} />}
        {config.visibilitySearch && <VisibilitySearchSlot visibility={visibility} indexability={indexability} />}
        {config.miniMap && <MiniMapSlot />}
        {config.mediaCounters && <MediaCountersSlot />}
        {config.favoritesQuirks && <FavoritesQuirksSlot />}
        {config.causes && <CausesSlot />}
        {config.shareExport && <ShareExportSlot />}
      </div>

      {/* Mobile: Stacks under Bio */}
      <div className="lg:hidden space-y-4 mt-6">
        {config.quickFacts && <QuickFactsSlot person={person} />}
        {config.contributeCTA && <ContributeCTASlot preset={preset} />}
        {config.anniversaries && <AnniversariesSlot person={person} preset={preset} />}
        {config.mediaCounters && <MediaCountersSlot />}
        {config.shareExport && <ShareExportSlot />}
      </div>
    </div>
  )
}
