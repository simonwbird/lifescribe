import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import { Mic, Square, Upload } from 'lucide-react'

interface VoiceStoryFormProps {
  familyId: string
}

export default function VoiceStoryForm({ familyId }: VoiceStoryFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dateValue, setDateValue] = useState<DatePrecisionValue>({ date: null, yearOnly: false })
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error: any) {
      console.error('Mic access error:', error)
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access or upload an audio file instead.',
        variant: 'destructive'
      })
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid audio file (.webm, .mp3, .m4a, .wav)',
        variant: 'destructive'
      })
      return
    }

    // Convert file to blob
    const reader = new FileReader()
    reader.onload = () => {
      const blob = new Blob([reader.result as ArrayBuffer], { type: file.type })
      setAudioBlob(blob)
      setAudioUrl(URL.createObjectURL(blob))
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Required fields',
        description: 'Please fill in title and content.',
        variant: 'destructive'
      })
      return
    }

    if (!audioBlob) {
      toast({
        title: 'No audio',
        description: 'Please record or upload audio.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create story
      const occurredDate = dateValue.date ? dateValue.date.toISOString().split('T')[0] : null
      
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: title.trim(),
          content: content.trim(),
          occurred_on: occurredDate,
          is_approx: dateValue.yearOnly
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Upload audio file
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: audioBlob.type })
      const { path, error: uploadError } = await uploadMediaFile(audioFile, familyId, user.id)

      if (uploadError || !path) throw new Error(uploadError || 'Failed to upload audio')

      // Create media record with optional transcript
      const { error: mediaError } = await supabase
        .from('media')
        .insert({
          story_id: story.id,
          profile_id: user.id,
          family_id: familyId,
          file_path: path,
          file_name: audioFile.name,
          file_size: audioFile.size,
          mime_type: audioFile.type,
          transcript: transcript.trim() || null
        })

      if (mediaError) throw mediaError

      toast({
        title: 'Story created!',
        description: 'Your voice story has been published.'
      })

      navigate('/feed')
    } catch (error: any) {
      console.error('Error creating voice story:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create story. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Voice Story</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Audio Recording/Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Audio <span className="text-destructive">*</span>
            </label>
            
            {!audioUrl ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant={isRecording ? 'destructive' : 'default'}
                  onClick={isRecording ? stopRecording : startRecording}
                  className="w-full"
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <label className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">
                      Upload audio file
                    </span>
                    <span className="text-xs text-muted-foreground">
                      .webm, .mp3, .m4a, .wav
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="audio/webm,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <audio controls src={audioUrl} className="w-full" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAudioBlob(null)
                    setAudioUrl(null)
                  }}
                  className="w-full"
                >
                  Remove Audio
                </Button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="Give your story a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Story <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="content"
              placeholder="Describe what's in the recording..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
              required
            />
          </div>

          <div>
            <label htmlFor="transcript" className="block text-sm font-medium mb-2">
              Transcript (Optional)
            </label>
            <Textarea
              id="transcript"
              placeholder="Type or paste a transcript of the audio..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              When was this recorded? (Optional)
            </label>
            <DatePrecisionPicker value={dateValue} onChange={setDateValue} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
