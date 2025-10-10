import React from 'react'
import { PersonPageBlock } from '@/types/personPage'
import PeopleWebBlock from './blocks/PeopleWebBlock'
import HeroLifeBlock from './blocks/HeroLifeBlock'
import HeroMemorialBlock from './blocks/HeroMemorialBlock'

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

    case 'people_web':
    case 'relationships':
      return <PeopleWebBlock personId={person.id} currentUserId={currentUserId} />

    case 'timeline':
    case 'life_arc_timeline':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Timeline coming soon</p>
        </div>
      )

    case 'story_roll':
    case 'story_collage':
    case 'stories':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Stories section coming soon</p>
        </div>
      )

    case 'photos':
    case 'gallery':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Photo gallery coming soon</p>
        </div>
      )

    case 'audio_remembrances':
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Audio remembrances coming soon</p>
        </div>
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
        <div className="text-center py-8">
          <p className="text-muted-foreground">Favorite places & things coming soon</p>
        </div>
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

    default:
      return (
        <div className="text-muted-foreground">
          Block content for {block.type} will be rendered here
        </div>
      )
  }
}