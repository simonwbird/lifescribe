import React from 'react'
import { PersonPageBlock } from '@/types/personPage'
import PeopleWebBlock from './blocks/PeopleWebBlock'
import HeroLifeBlock from './blocks/HeroLifeBlock'
import HeroMemorialBlock from './blocks/HeroMemorialBlock'
import BioOverviewBlock from './blocks/BioOverviewBlock'
import TimelineBlockEnhanced from './blocks/TimelineBlockEnhanced'
import { ObjectsPlacesBlock } from './blocks/ObjectsPlacesBlock'
import QuickFactsBlock from './blocks/QuickFactsBlock'
import StoryCollageBlock from './blocks/StoryCollageBlock'
import AudioRemembrancesBlock from './blocks/AudioRemembrancesBlock'
import PhotoGalleryBlock from './blocks/PhotoGalleryBlock'

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

    case 'people_web':
    case 'relationships':
      return <PeopleWebBlock personId={person.id} currentUserId={currentUserId} familyId={person.family_id} />

    case 'timeline':
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
      return (
        <AudioRemembrancesBlock
          personId={person.id}
          familyId={person.family_id || ''}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    case 'guestbook_live':
    case 'guestbook_tribute':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Guestbook coming soon</p>
        </div>
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
        <div className="text-center py-8">
          <p className="text-muted-foreground">Now & Next coming soon</p>
        </div>
      )

    case 'service_events':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Service events coming soon</p>
        </div>
      )

    case 'quick_facts':
      return (
        <QuickFactsBlock
          person={person}
          blockContent={block.content_json}
          canEdit={canEdit}
          onUpdate={onUpdate}
        />
      )

    default:
      return (
        <div className="text-muted-foreground">
          Block content for {block.type} will be rendered here
        </div>
      )
  }
}