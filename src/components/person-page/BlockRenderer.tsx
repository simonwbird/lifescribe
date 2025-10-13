import React from 'react'
import { PersonPageBlock } from '@/types/personPage'
import PeopleWebBlock from './blocks/PeopleWebBlock'
import HeroLifeBlock from './blocks/HeroLifeBlock'
import HeroMemorialBlock from './blocks/HeroMemorialBlock'
import BioOverviewBlock from './blocks/BioOverviewBlock'
import AboutMeBlock from './blocks/AboutMeBlock'
import TimelineBlockEnhanced from './blocks/TimelineBlockEnhanced'
import { ObjectsPlacesBlock } from './blocks/ObjectsPlacesBlock'
import QuickFactsBlock from './blocks/QuickFactsBlock'
import StoryCollageBlock from './blocks/StoryCollageBlock'
import VoiceNotesBlock from './blocks/VoiceNotesBlock'
import PhotoGalleryBlock from './blocks/PhotoGalleryBlock'
import { GuestbookTributeBlock } from './blocks/GuestbookTributeBlock'
import NotesFromFriendsBlock from './blocks/NotesFromFriendsBlock'
import NowNextBlock from './blocks/NowNextBlock'
import LettersTimeCapsuleBlock from './blocks/LettersTimeCapsuleBlock'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

function UnknownBlock({ type }: { type: string }) {
  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
      <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
      <div className="font-medium text-sm mb-1">Unsupported block: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{type}</code></div>
      <div className="text-sm text-muted-foreground mb-4">This block type is not yet implemented.</div>
      <Button variant="outline" size="sm" className="gap-2">
        <span>Replace Block</span>
      </Button>
    </div>
  )
}

interface BlockRendererProps {
  block: PersonPageBlock
  person: {
    id: string
    full_name: string
    preferred_name?: string
    avatar_url?: string
    bio?: string
    birth_date?: string
    death_date?: string
    status: 'living' | 'passed'
    family_id?: string
  }
  currentUserId: string | null
  canEdit: boolean
  onUpdate?: () => void
}

export default function BlockRenderer({ block, person, currentUserId, canEdit, onUpdate }: BlockRendererProps) {
  switch (block.type) {
    case 'hero':
    case 'hero_life':
      return (
        <HeroLifeBlock
          person={person}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'hero_memorial':
      return (
        <HeroMemorialBlock
          person={person}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'bio_overview':
      return (
        <BioOverviewBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'about_me':
      return (
        <AboutMeBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'people_web':
    case 'relationships':
      return <PeopleWebBlock personId={person.id} currentUserId={currentUserId} familyId={person.family_id} />

    case 'timeline':
    case 'timeline_enhanced':
    case 'life_arc_timeline':
      return (
        <TimelineBlockEnhanced
          personId={person.id}
          familyId={person.family_id || ''}
          canEdit={canEdit}
        />
      )

    case 'story_roll':
    case 'story_collage':
    case 'stories':
      return (
        <StoryCollageBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'photos':
    case 'photo_gallery':
    case 'gallery':
      return (
        <PhotoGalleryBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'audio_remembrances':
    case 'voice_notes':
      return (
        <VoiceNotesBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'guestbook_live':
    case 'notes_from_friends':
      return (
        <NotesFromFriendsBlock
          personId={person.id}
          familyId={person.family_id || ''}
          canModerate={canEdit}
          pageVisibility={block.content_json?.visibility || 'private'}
        />
      )

    case 'guestbook_tribute':
      return (
        <GuestbookTributeBlock
          personId={person.id}
          familyId={person.family_id || ''}
          canModerate={canEdit}
          pageVisibility={block.content_json?.visibility || 'private'}
        />
      )

    case 'objects_places':
      return (
        <ObjectsPlacesBlock
          personId={person.id}
          familyId={person.family_id || ''}
          canEdit={canEdit}
        />
      )

    case 'now_next':
      return (
        <NowNextBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'letters_time_capsule':
      return (
        <LettersTimeCapsuleBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'favorites_quirks':
    case 'favorites':
      return <UnknownBlock type={block.type} />

    case 'service_events':
      return <UnknownBlock type="service_events" />

    case 'quick_facts':
      return (
        <QuickFactsBlock
          personId={person.id}
          familyId={person.family_id || ''}
          person={person}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    default:
      return <UnknownBlock type={block.type} />
  }
}