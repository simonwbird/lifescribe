import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Globe, Users, Lock, MoreVertical, GripVertical, Calendar, Unlock } from 'lucide-react'
import { PersonPageBlock as BlockData } from '@/types/personPage'
import { cn } from '@/lib/utils'

interface PersonPageBlockProps {
  block: BlockData
  canEdit: boolean
  onVisibilityChange: (visibility: BlockData['visibility']) => void
  onUnlockDateChange?: (unlockDate: string | null) => void
  onRemove: () => void
  children: React.ReactNode
  dragHandleProps?: any
  viewerRole?: string
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
  about_me: 'About Me',
  timeline: 'Timeline',
  life_arc_timeline: 'Life Timeline',
  story_roll: 'Stories',
  story_collage: 'Story Collage',
  stories: 'Stories',
  photos: 'Photos',
  gallery: 'Photo Gallery',
  audio_remembrances: 'Audio Memories',
  voice_notes: 'Voice Notes',
  people_web: 'Family Tree',
  relationships: 'Relationships',
  guestbook_live: 'Guestbook',
  notes_from_friends: 'Notes from Friends',
  guestbook_tribute: 'Memorial Guestbook',
  now_next: 'Now & Next',
  service_events: 'Services & Events',
  objects_places: 'Places & Things',
  quick_facts: 'Quick Facts',
}

export default function PersonPageBlock({
  block,
  canEdit,
  onVisibilityChange,
  onUnlockDateChange,
  onRemove,
  children,
  dragHandleProps,
  viewerRole
}: PersonPageBlockProps) {
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [unlockDate, setUnlockDate] = useState(block.unlock_at?.split('T')[0] || '')
  
  const visConfig = visibilityConfig[block.visibility]
  const VisIcon = visConfig.icon
  const blockTitle = blockTitles[block.type] || block.type
  
  // Bio blocks are locked under hero/memorial
  const isLockedBlock = block.type === 'bio' || block.type === 'bio_overview'
  
  // Check if block is locked for current viewer
  const isLocked = block.unlock_at && 
    new Date(block.unlock_at) > new Date() && 
    viewerRole !== 'owner'
  
  const handleSaveUnlockDate = () => {
    onUnlockDateChange?.(unlockDate || null)
    setShowUnlockDialog(false)
  }
  
  const handleRemoveUnlockDate = () => {
    setUnlockDate('')
    onUnlockDateChange?.(null)
    setShowUnlockDialog(false)
  }
  
  // If locked for viewer, show lock card
  if (isLocked) {
    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            {blockTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              This section will unlock on{' '}
              <span className="font-medium text-foreground">
                {new Date(block.unlock_at!).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "relative transition-all duration-200",
      "hover:shadow-md hover:scale-[1.01]",
      canEdit && "group cursor-default"
    )}>
      {canEdit && (
        <div 
          {...dragHandleProps}
          className={cn(
            "absolute left-2 top-2 active:cursor-grabbing opacity-40 group-hover:opacity-100 hover:scale-110 transition-all z-10",
            isLockedBlock ? "cursor-move" : "cursor-grab"
          )}
          title={isLockedBlock ? "Drag to reorder (stays after hero)" : "Drag to reorder"}
        >
          <GripVertical className={cn(
            "h-6 w-6 hover:text-primary",
            isLockedBlock ? "text-orange-500" : "text-muted-foreground"
          )} />
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
              <>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowUnlockDialog(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      {block.unlock_at ? 'Edit Unlock Date' : 'Set Unlock Date'}
                    </DropdownMenuItem>
                    {block.unlock_at && (
                      <DropdownMenuItem onClick={handleRemoveUnlockDate}>
                        <Unlock className="h-4 w-4 mr-2" />
                        Remove Unlock Date
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Remove Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Unlock Date</DialogTitle>
                      <DialogDescription>
                        Choose when this block should become visible to viewers. Until this date, only you will see the content.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="unlock-date">Unlock Date</Label>
                        <Input
                          id="unlock-date"
                          type="date"
                          value={unlockDate}
                          onChange={(e) => setUnlockDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {block.unlock_at && (
                          <p className="text-sm text-muted-foreground">
                            Current unlock date: {new Date(block.unlock_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveUnlockDate}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
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