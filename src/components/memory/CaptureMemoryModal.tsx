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
import { useAnalytics } from '@/hooks/useAnalytics'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { tributeCopy } from '@/copy/tribute'

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
  const { track } = useAnalytics()
  const [mode, setMode] = useState<CaptureMode>('text')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [yearApprox, setYearApprox] = useState('')
  const [placeText, setPlaceText] = useState('')
  const [showYearField, setShowYearField] = useState(false)
  const [showPlaceField, setShowPlaceField] = useState(false)
  const [existingPlaces, setExistingPlaces] = useState<Array<{ id: string; name: string }>>([])
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<'only_me' | 'inner_circle' | 'family' | 'public'>('family')
  const [isFirstHand, setIsFirstHand] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const firstName = person.first_name || person.preferred_name || person.full_name?.split(' ')[0] || person.full_name || 'this person'
  const draftKey = `memory-draft-${person.id}-${viewer?.id || 'anon'}`

  // Load draft from localStorage and fetch existing places
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
          // Show fields if they have values
          if (draft.year_approx) setShowYearField(true)
          if (draft.place_text) setShowPlaceField(true)
        } catch (error) {
          console.error('Failed to load draft:', error)
        }
      }

      // Fetch existing places for this person's family
      const fetchPlaces = async () => {
        try {
          const { data: personData } = await supabase
            .from('people')
            .select('family_id')
            .eq('id', person.id)
            .single()

          if (personData?.family_id) {
            const { data: places } = await supabase
              .from('places')
              .select('id, name')
              .eq('family_id', personData.family_id)
              .order('name')

            if (places) {
              setExistingPlaces(places)
            }
          }
        } catch (error) {
          console.error('Failed to load places:', error)
        }
      }

      fetchPlaces()
    }
  }, [isOpen, draftKey, person.id])

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

      // Track memory creation
      track(`memory_created_${mode}` as any, {
        person_id: person.id,
        prompt_id: promptId,
        modality: mode,
        visibility,
        is_first_hand: isFirstHand,
        has_year: !!yearApprox,
        has_place: !!placeText
      })

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
          <DialogTitle>{tributeCopy.captureModal.title(firstName)}</DialogTitle>
          <DialogDescription className="text-base pt-2 font-medium">
            {prompt}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as CaptureMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              {tributeCopy.memoryCard.captureButtons.write}
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              {tributeCopy.memoryCard.captureButtons.voice}
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              {tributeCopy.memoryCard.captureButtons.photo}
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
                {tributeCopy.memoryCard.helper}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="rounded-lg bg-muted/50 p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                {tributeCopy.captureModal.voiceHelper}
              </p>
            </div>
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

        {/* Optional metadata enrichment chips */}
        <div className="pt-4 border-t">
          <div className="flex gap-2 mb-3">
            {!showYearField && !yearApprox && (
              <button
                type="button"
                onClick={() => setShowYearField(true)}
                className="text-sm px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
              >
                {tributeCopy.enrichment.addYear}
              </button>
            )}
            {!showPlaceField && !placeText && (
              <button
                type="button"
                onClick={() => setShowPlaceField(true)}
                className="text-sm px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
              >
                {tributeCopy.enrichment.addPlace}
              </button>
            )}
          </div>

          {(showYearField || yearApprox || showPlaceField || placeText) && (
            <div className="grid grid-cols-2 gap-4">
              {(showYearField || yearApprox) && (
                <div>
                  <Label htmlFor="year" className="text-xs">{tributeCopy.enrichment.yearLabel}</Label>
                  <Input
                    id="year"
                    type="text"
                    value={yearApprox}
                    onChange={(e) => setYearApprox(e.target.value)}
                    placeholder={tributeCopy.enrichment.yearPlaceholder}
                    className="mt-1"
                  />
                </div>
              )}
              {(showPlaceField || placeText) && (
                <div>
                  <Label htmlFor="place" className="text-xs">{tributeCopy.enrichment.placeLabel}</Label>
                  <div className="relative mt-1">
                    <Input
                      id="place"
                      type="text"
                      value={placeText}
                      onChange={(e) => setPlaceText(e.target.value)}
                      placeholder={tributeCopy.enrichment.placePlaceholder}
                      className="pr-2"
                      list="places-list"
                    />
                    {existingPlaces.length > 0 && (
                      <datalist id="places-list">
                        {existingPlaces.map((place) => (
                          <option key={place.id} value={place.name} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  {existingPlaces.length > 0 && !placeText && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {tributeCopy.enrichment.placeSuggestion}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visibility and consent */}
        <div className="pt-4 border-t space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visibility" className="text-sm font-medium">
              {tributeCopy.captureModal.visibilityLabel} <span className="text-destructive">*</span>
            </Label>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger id="visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="only_me">Only me</SelectItem>
                <SelectItem value="inner_circle">Close family</SelectItem>
                <SelectItem value="family">All family members (default)</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose who should be able to view this memory
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="first-hand"
              checked={isFirstHand}
              onCheckedChange={(checked) => setIsFirstHand(checked as boolean)}
              className="mt-1"
            />
            <div className="space-y-1">
              <Label
                htmlFor="first-hand"
                className="text-sm font-normal leading-tight cursor-pointer"
              >
                {tributeCopy.captureModal.firstHandLabel}
              </Label>
              <p className="text-xs text-muted-foreground">
                {tributeCopy.captureModal.firstHandHelper}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {tributeCopy.captureModal.saveDraftButton}
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
                {tributeCopy.captureModal.submitButton}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {tributeCopy.captureModal.draftSaved}
        </p>
      </DialogContent>
    </Dialog>
  )
}
