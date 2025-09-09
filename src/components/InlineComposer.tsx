import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DatePrecisionPicker, DatePrecisionValue } from './DatePrecisionPicker'
import MediaUploader from './MediaUploader'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { uploadMediaFile } from '@/lib/media'

interface InlineComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  familyId: string
  defaultDate?: Date
  onSuccess: () => void
}

export function InlineComposer({
  open,
  onOpenChange,
  personId,
  familyId,
  defaultDate,
  onSuccess
}: InlineComposerProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [when, setWhen] = useState<DatePrecisionValue>({
    date: defaultDate ?? null,
    precision: 'day',
    approx: false
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Please add a title", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Insert story
      const occurred_on = when.date ? format(when.date, 'yyyy-MM-dd') : null
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title,
          content,
          occurred_on,
          occurred_precision: when.precision,
          is_approx: when.approx,
          family_id: familyId,
          profile_id: user.id
        })
        .select()
        .single()

      if (storyError || !story) {
        throw new Error(storyError?.message || 'Failed to save story')
      }

      // Link to person
      const { error: linkError } = await supabase
        .from('person_story_links')
        .insert({
          person_id: personId,
          story_id: story.id,
          family_id: familyId
        })

      if (linkError) {
        throw new Error(linkError.message)
      }

      // Upload media files
      for (const file of selectedFiles) {
        const { path, error: uploadError } = await uploadMediaFile(file, familyId, user.id)
        if (uploadError) {
          console.error('Failed to upload file:', uploadError)
          continue
        }

        // Create media record
        await supabase.from('media').insert({
          family_id: familyId,
          profile_id: user.id,
          story_id: story.id,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        })
      }

      toast({ title: "Memory saved successfully!" })
      
      // Reset form
      setTitle('')
      setContent('')
      setWhen({ date: null, precision: 'day', approx: false })
      setSelectedFiles([])
      onOpenChange(false)
      onSuccess()

    } catch (error) {
      console.error('Error saving memory:', error)
      toast({
        title: "Failed to save memory",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Memory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Memory title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Textarea
              placeholder="Tell the story..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">When did this happen?</label>
            <DatePrecisionPicker value={when} onChange={setWhen} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Add Photos/Videos</label>
            <MediaUploader
              onFilesSelected={setSelectedFiles}
              maxFiles={5}
              acceptedTypes={['image/*', 'video/*']}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Memory'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}