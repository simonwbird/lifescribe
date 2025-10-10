import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, Globe, Users, Lock, MoreVertical, GripVertical } from 'lucide-react'
import { PersonPageBlock as BlockData } from '@/types/personPage'
import { cn } from '@/lib/utils'

interface PersonPageBlockProps {
  block: BlockData
  canEdit: boolean
  onVisibilityChange: (visibility: BlockData['visibility']) => void
  onRemove: () => void
  children: React.ReactNode
  dragHandleProps?: any
}

const visibilityConfig = {
  only_me: { icon: Lock, label: 'Only Me', color: 'text-red-500' },
  inner_circle: { icon: Users, label: 'Inner Circle', color: 'text-orange-500' },
  family: { icon: Users, label: 'Family', color: 'text-blue-500' },
  public: { icon: Globe, label: 'Public', color: 'text-green-500' }
}

const blockTitles: Record<string, string> = {
  hero: 'Hero',
  hero_memorial: 'Memorial',
  bio_overview: 'Biography',
  timeline: 'Timeline',
  life_arc_timeline: 'Life Timeline',
  story_roll: 'Stories',
  story_collage: 'Story Collage',
  stories: 'Stories',
  photos: 'Photos',
  gallery: 'Photo Gallery',
  audio_remembrances: 'Audio Memories',
  people_web: 'Family Tree',
  relationships: 'Relationships',
  guestbook_live: 'Guestbook',
  guestbook_tribute: 'Memorial Guestbook',
  now_next: 'Now & Next',
  service_events: 'Services & Events',
  objects_places: 'Places & Things',
}

export default function PersonPageBlock({
  block,
  canEdit,
  onVisibilityChange,
  onRemove,
  children,
  dragHandleProps
}: PersonPageBlockProps) {
  const visConfig = visibilityConfig[block.visibility]
  const VisIcon = visConfig.icon
  const blockTitle = blockTitles[block.type] || block.type

  return (
    <Card className={cn(
      "relative transition-all duration-200",
      "hover:shadow-md hover:scale-[1.01]",
      canEdit && "group cursor-default"
    )}>
      {canEdit && (
        <div 
          {...dragHandleProps}
          className="absolute left-2 top-2 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-100 hover:scale-110 transition-all z-10"
          title="Drag to reorder"
        >
          <GripVertical className="h-6 w-6 text-muted-foreground hover:text-primary" />
        </div>
      )}

      <CardHeader className={cn(canEdit && "pl-10")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{blockTitle}</CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("gap-1", visConfig.color)}>
              <VisIcon className="h-3 w-3" />
              <span className="text-xs">{visConfig.label}</span>
            </Badge>

            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onVisibilityChange('only_me')}>
                    <Lock className="h-4 w-4 mr-2" />
                    Only Me
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onVisibilityChange('inner_circle')}>
                    <Users className="h-4 w-4 mr-2" />
                    Inner Circle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onVisibilityChange('family')}>
                    <Users className="h-4 w-4 mr-2" />
                    Family
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onVisibilityChange('public')}>
                    <Globe className="h-4 w-4 mr-2" />
                    Public
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={onRemove}
                    className="text-destructive focus:text-destructive"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Remove Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}