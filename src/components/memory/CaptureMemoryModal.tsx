import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Pencil, Mic, Camera, Save, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import VoiceRecorderPanel from '@/components/story-create/VoiceRecorderPanel'

interface CaptureMemoryModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  person: {
    id: string
    first_name?: string
    preferred_name?: string
    full_name?: string
  }
  prompt: string
  promptId?: string
  viewer?: {
    id: string
    relationship_to_person?: string
  }
}

type CaptureMode = 'text' | 'voice' | 'photo'

interface MemoryDraft {
  person_id: string
  modality: CaptureMode
  prompt_id?: string
  prompt_text: string
  title: string
  body: string
  audio_url?: string
  audio_blob?: Blob
  audio_duration?: number
  photo_url?: string
  photo_file?: File
  year_approx?: string
  place_text?: string
  status: 'draft' | 'pending'
  created_at: string
  updated_at: string
}

export function CaptureMemoryModal({
  isOpen,
  onOpenChange,
  person,
  prompt,
  promptId,
  viewer
}: CaptureMemoryModalProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<CaptureMode>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [yearApprox, setYearApprox] = useState('')
  const [placeText, setPlaceText] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const firstName = person.first_name || person.preferred_name || person.full_name?.split(' ')[0] || 'them'
  const draftKey = `memory-draft-${person.id}-${viewer?.id || 'anon'}`

  // Load draft from localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        try {
          const draft: MemoryDraft = JSON.parse(stored)
          setTitle(draft.title || '')
          setBody(draft.body || '')
          setYearApprox(draft.year_approx || '')
          setPlaceText(draft.place_text || '')
          setMode(draft.modality || 'text')
        } catch (error) {
          console.error('Failed to load draft:', error)
        }
      }
    }
  }, [isOpen, draftKey])

  // Auto-save draft
  useEffect(() => {
    if (!isOpen) return

    const draft: MemoryDraft = {
      person_id: person.id,
      modality: mode,
      prompt_id: promptId,
      prompt_text: prompt,
      title,
      body,
      year_approx: yearApprox,
      place_text: placeText,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const timeoutId = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }, 1000) // Debounce 1 second

    return () => clearTimeout(timeoutId)
  }, [isOpen, mode, title, body, yearApprox, placeText, person.id, prompt, promptId, draftKey])

  const handleTranscriptReady = (transcript: string, blob: Blob, duration: number) => {
    setBody(transcript)
    setAudioBlob(blob)
    setAudioDuration(duration)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      })
      return
    }

    setPhotoFile(file)
    const preview = URL.createObjectURL(file)
    setPhotoPreview(preview)
  }

  const handleSave = async () => {
    // Validation
    if (mode === 'text' && !body.trim()) {
      toast({
        title: 'Memory text required',
        description: 'Please write your memory before saving',
        variant: 'destructive'
      })
      return
    }

    if (mode === 'voice' && !audioBlob) {
      toast({
        title: 'Audio recording required',
        description: 'Please record your memory before saving',
        variant: 'destructive'
      })
      return
    }

    if (mode === 'photo' && !photoFile) {
      toast({
        title: 'Photo required',
        description: 'Please add a photo before saving',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      let audioUrl: string | undefined
      let photoUrl: string | undefined

      // Upload audio if present
      if (audioBlob) {
        const audioFileName = `memory-audio-${Date.now()}.webm`
        const { data: audioData, error: audioError } = await supabase.storage
          .from('media')
          .upload(`memories/${person.id}/${audioFileName}`, audioBlob, {
            contentType: 'audio/webm'
          })

        if (audioError) throw audioError
        
        const { data: audioUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(audioData.path)
        
        audioUrl = audioUrlData.publicUrl
      }

      // Upload photo if present
      if (photoFile) {
        const photoFileName = `memory-photo-${Date.now()}.${photoFile.name.split('.').pop()}`
        const { data: photoData, error: photoError } = await supabase.storage
          .from('media')
          .upload(`memories/${person.id}/${photoFileName}`, photoFile, {
            contentType: photoFile.type
          })

        if (photoError) throw photoError
        
        const { data: photoUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(photoData.path)
        
        photoUrl = photoUrlData.publicUrl
      }

      // Get family_id for the person
      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('family_id')
        .eq('id', person.id)
        .single()

      if (personError || !personData) {
        throw new Error('Could not find person')
      }

      // Insert memory record
      const { error: insertError } = await supabase
        .from('memories')
        .insert({
          person_id: person.id,
          family_id: personData.family_id,
          contributor_user: viewer?.id || null,
          contributor_name: viewer?.id ? null : 'Anonymous',
          relationship_to_person: viewer?.relationship_to_person || null,
          modality: mode,
          prompt_id: promptId || null,
          title: title.trim() || null,
          body: body.trim() || null,
          audio_url: audioUrl,
          photo_url: photoUrl,
          year_approx: yearApprox ? parseInt(yearApprox) : null,
          place_id: null, // TODO: Connect to places table if needed
          tags: [],
          visibility: 'family',
          status: 'pending'
        })

      if (insertError) throw insertError

      // Clear draft
      localStorage.removeItem(draftKey)

      onOpenChange(false)

      toast({
        title: 'Memory saved!',
        description: 'Your memory has been submitted and is pending review.'
      })
    } catch (error) {
      console.error('Error saving memory:', error)
      toast({
        title: 'Failed to save memory',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    // Draft is auto-saved
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a memory of {firstName}</DialogTitle>
          <DialogDescription className="text-base pt-2 font-medium">
            {prompt}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as CaptureMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="memory-body">Your Memory</Label>
              <Textarea
                id="memory-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="A few sentences is perfect. Share what comes to mind..."
                rows={6}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add a year or place if you remember
              </p>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <VoiceRecorderPanel
              onTranscriptReady={handleTranscriptReady}
              className="border-0 p-0"
            />
            {body && (
              <div>
                <Label>Transcript (you can edit this)</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="photo" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="photo-upload">Add Photo</Label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Memory photo"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className="absolute top-2 right-2"
                    >
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to add a photo</span>
                  </label>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="photo-caption">Caption (optional)</Label>
              <Textarea
                id="photo-caption"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add context to your photo..."
                rows={3}
                className="mt-2"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Context fields - shown for all modes */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <Label htmlFor="year">Year (optional)</Label>
            <Input
              id="year"
              type="text"
              value={yearApprox}
              onChange={(e) => setYearApprox(e.target.value)}
              placeholder="e.g., 1995 or early 2000s"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="place">Place (optional)</Label>
            <Input
              id="place"
              type="text"
              value={placeText}
              onChange={(e) => setPlaceText(e.target.value)}
              placeholder="e.g., grandma's kitchen"
              className="mt-1"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Save Draft & Close
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Memory
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Your draft is automatically saved as you type
        </p>
      </DialogContent>
    </Dialog>
  )
}
