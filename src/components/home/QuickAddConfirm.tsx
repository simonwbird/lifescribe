import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, MapPin, Users, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import ChildTimelineSelector from './ChildTimelineSelector'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface QuickAddConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: string
  familyId: string
  userId: string
  onSuccess?: () => void
}

export default function QuickAddConfirm({
  open,
  onOpenChange,
  contentType,
  familyId,
  userId,
  onSuccess,
}: QuickAddConfirmProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date>()
  const [location, setLocation] = useState('')
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [isPublishing, setIsPublishing] = useState(false)

  const handleFinishLater = () => {
    // Save as draft
    toast({
      title: "Saved to drafts",
      description: "Continue editing from your drafts",
    })
    onOpenChange(false)
    navigate('/drafts')
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title before publishing",
        variant: "destructive",
      })
      return
    }

    setIsPublishing(true)
    try {
      // Create story with family_id
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert([{
          family_id: familyId,
          profile_id: userId,
          title: title.trim(),
          content: description.trim() || '',
          occurred_on: date ? format(date, 'yyyy-MM-dd') : null,
        }])
        .select()
        .single()

      if (storyError) throw storyError

      // Link to child timelines using entity_links
      if (selectedChildren.length > 0 && story && familyId) {
        const links = selectedChildren.map(childId => ({
          family_id: familyId,
          entity_type: 'person',
          entity_id: childId,
          source_type: 'story',
          source_id: story.id,
          created_by: userId,
        }))

        const { error: linkError } = await supabase
          .from('entity_links')
          .insert(links)

        if (linkError) {
          console.error('Failed to link timelines:', linkError)
        }
      }

      toast({
        title: "Published! 🎉",
        description: selectedChildren.length > 0
          ? `Added to ${selectedChildren.length} timeline${selectedChildren.length !== 1 ? 's' : ''}`
          : "Your content is now live",
      })

      onOpenChange(false)
      onSuccess?.()
      
      // Navigate to the story
      navigate(`/stories/${story.id}`)
      
    } catch (error) {
      console.error('Failed to publish:', error)
      toast({
        title: "Failed to publish",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-background">
        <SheetHeader>
          <SheetTitle className="text-2xl font-serif">Add Details</SheetTitle>
          <SheetDescription>
            Tag to timelines and add context before publishing
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 pb-20 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What happened?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Child Timeline Selector */}
          <ChildTimelineSelector
            familyId={familyId}
            onSelectedChange={setSelectedChildren}
          />

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Where did this happen?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="flex gap-2 w-full max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleFinishLater}
              className="flex-1"
              disabled={isPublishing}
            >
              Finish Later
            </Button>
            <Button
              onClick={handlePublish}
              className="flex-1"
              disabled={isPublishing || !title.trim()}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Now'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
