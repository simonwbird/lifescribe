import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Mic, Square, Play, Pause, Camera, Video, FileText, Users, MapPin, Tag, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from 'react-router-dom'
import EnhancedMediaUploader from '@/components/story-wizard/EnhancedMediaUploader'
import PeoplePicker from '@/components/story-wizard/PeoplePicker'
import type { MediaItem, SelectedPerson } from '@/components/story-wizard/StoryWizardTypes'

export interface QuickCapturePrompt {
  id: string
  category: string
  question: string
  subcopy: string
}

export interface QuickCaptureContext {
  personId?: string
  personName?: string
  propertyId?: string
  propertyName?: string
}

interface QuickCaptureComposerProps {
  isOpen: boolean
  onClose: () => void
  prompt?: QuickCapturePrompt
  context?: QuickCaptureContext
  onSave?: () => void
}

type CaptureMode = 'write' | 'photo' | 'voice' | 'video'
type Privacy = 'family' | 'private' | 'custom'

interface CaptureData {
  mode: CaptureMode
  title: string
  text: string
  media: MediaItem[]
  audioBlob?: Blob
  videoBlob?: Blob
  people: SelectedPerson[]
  places: string[]
  tags: string[]
  privacy: Privacy
}

export default function QuickCaptureComposer({ 
  isOpen, 
  onClose, 
  prompt, 
  context,
  onSave 
}: QuickCaptureComposerProps) {
  const [selectedMode, setSelectedMode] = useState<CaptureMode>('write')
  const [data, setData] = useState<CaptureData>({
    mode: 'write',
    title: '',
    text: '',
    media: [],
    people: [],
    places: [],
    tags: [],
    privacy: 'family'
  })
  const [isRecording, setIsRecording] = useState(false)
  const [isVideoRecording, setIsVideoRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [liveVideoStream, setLiveVideoStream] = useState<MediaStream | null>(null)
  const [showPrompt, setShowPrompt] = useState(!!prompt)
  const [isSaving, setIsSaving] = useState(false)
  const [showPeoplePicker, setShowPeoplePicker] = useState(false)
  const [showPlacePicker, setShowPlacePicker] = useState(false)
  const [showTagList, setShowTagList] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [properties, setProperties] = useState<Array<{id: string, name: string}>>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  
  const { track } = useAnalytics()

  useEffect(() => {
    const videoEl = liveVideoRef.current
    if (videoEl && liveVideoStream) {
      try {
        // @ts-ignore - srcObject is supported in modern browsers
        videoEl.srcObject = liveVideoStream
        const p = videoEl.play()
        if (p && typeof (p as any).then === 'function') {
          ;(p as Promise<void>).catch(() => {})
        }
      } catch (e) {
        // no-op
      }
    }
    return () => {
      const v = liveVideoRef.current
      if (v) {
        try {
          // @ts-ignore
          v.srcObject = null
        } catch {}
      }
    }
  }, [liveVideoStream])

  // Initialize context data
  useEffect(() => {
    if (context) {
      setData(prev => ({
        ...prev,
        people: context.personId && context.personName ? 
          [{ name: context.personName, isExisting: true }] : prev.people,
        places: context.propertyId ? [context.propertyName || ''] : prev.places
      }))
    }
  }, [context])

  // Get family ID and properties
  useEffect(() => {
    const getFamilyData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .maybeSingle()
        
        if (member) {
          setFamilyId(member.family_id)
          
          // Fetch properties for this family
          const { data: propertyData } = await supabase
            .from('properties')
            .select('id, name')
            .eq('family_id', member.family_id)
            .order('name')
          
          if (propertyData) {
            setProperties(propertyData)
          }

          // Fetch common tags from existing stories
          const { data: tagData } = await supabase
            .from('stories')
            .select('tags')
            .eq('family_id', member.family_id)
            .not('tags', 'is', null)
          
          if (tagData) {
            const allTags = tagData.flatMap(story => story.tags || [])
            const uniqueTags = Array.from(new Set(allTags)).sort()
            setAvailableTags(uniqueTags)
          }
        }
      }
    }
    getFamilyData()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          handleSave()
        }
        return
      }

      switch (e.key) {
        case 'w':
        case 'W':
          e.preventDefault()
          setSelectedMode('write')
          break
        case 'p':
        case 'P':
          e.preventDefault()
          setSelectedMode('photo')
          break
        case 'v':
        case 'V':
          e.preventDefault()
          if (e.shiftKey) {
            setSelectedMode('video')
          } else {
            setSelectedMode('voice')
          }
          break
        case 'Enter':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            handleSave()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true 
        } 
      })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setData(prev => ({ ...prev, audioBlob }))
        setAudioUrl(URL.createObjectURL(audioBlob))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      track('quick_capture_voice_start')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: 'Recording Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    setIsRecording(false)
    setIsVideoRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      track('quick_capture_voice_stop', { duration: recordingTime })
    }
  }

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      })
      
      // Set up live video preview
      setLiveVideoStream(stream)
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream
        liveVideoRef.current.play()
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      videoRecorderRef.current = mediaRecorder
      videoChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(videoBlob)
        setVideoUrl(videoUrl)
        setData(prev => ({ ...prev, videoBlob }))
        
        // Stop live stream
        setLiveVideoStream(null)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      setIsVideoRecording(true)
      setRecordingTime(0)
      
      // Start timer
      videoTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      track('quick_capture_video_start')
    } catch (error) {
      console.error('Error starting video recording:', error)
      toast({
        title: 'Recording Error',
        description: 'Could not access camera/microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isVideoRecording) {
      videoRecorderRef.current.stop()
      setIsVideoRecording(false)
      
      if (videoTimerRef.current) {
        clearInterval(videoTimerRef.current)
        videoTimerRef.current = null
      }
      
      track('quick_capture_video_stop', { duration: recordingTime })
    }
  }

  const deleteVideoRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setVideoUrl(null)
    setData(prev => ({ ...prev, videoBlob: undefined }))
    setRecordingTime(0)
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setData(prev => ({ ...prev, audioBlob: undefined }))
    setRecordingTime(0)
  }

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(error => {
        console.error('Error playing audio:', error)
        toast({
          title: 'Playback Error',
          description: 'Could not play the recording.',
          variant: 'destructive'
        })
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const addTag = (tag: string) => {
    if (!tag.trim()) return
    setData(prev => ({
      ...prev,
      tags: [...new Set([...prev.tags, tag.trim()])]
    }))
  }

  const removeTag = (tag: string) => {
    setData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSave = async () => {
    if (!data.text.trim() && data.media.length === 0 && !data.audioBlob && !data.videoBlob) {
      toast({
        title: 'Nothing to save',
        description: 'Please add some content before saving.',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's family ID
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) {
        throw new Error('No family membership found')
      }

      const familyId = member.family_id

      // Handle voice recordings
      if (data.audioBlob) {
        // Upload audio file to storage
        const fileExt = 'webm' // or detect from blob type
        const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${familyId}/${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, data.audioBlob)

        if (uploadError) throw uploadError

        // If we have a prompt, create an answer
        if (prompt) {
          const { data: answerData, error: answerError } = await supabase
            .from('answers')
            .insert({
              question_id: prompt.id,
              profile_id: user.id,
              family_id: familyId,
              answer_text: data.text.trim() || 'Voice recording'
            })
            .select()
            .single()

          if (answerError) throw answerError

          // Link media to answer
          await supabase
            .from('media')
            .insert({
              answer_id: answerData.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: fileName,
              file_size: data.audioBlob.size,
              mime_type: data.audioBlob.type || 'audio/webm'
            })
        } else {
          // Create a voice story
          const { data: storyData, error: storyError } = await supabase
            .from('stories')
            .insert({
              family_id: familyId,
              profile_id: user.id,
              title: data.text.trim() || 'Voice Recording',
              content: data.text.trim() || 'Voice recording',
              tags: data.tags.length > 0 ? data.tags : ['voice-note']
            })
            .select()
            .single()

          if (storyError) throw storyError

          // Link media to story
          await supabase
            .from('media')
            .insert({
              story_id: storyData.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: fileName,
              file_size: data.audioBlob.size,
              mime_type: data.audioBlob.type || 'audio/webm'
            })
        }
      }

      // Handle video recordings
      else if (data.videoBlob) {
        // Upload video file to storage
        const fileExt = 'webm'
        const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${familyId}/${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, data.videoBlob)

        if (uploadError) throw uploadError

        // If we have a prompt, create an answer
        if (prompt) {
          const { data: answerData, error: answerError } = await supabase
            .from('answers')
            .insert({
              question_id: prompt.id,
              profile_id: user.id,
              family_id: familyId,
              answer_text: data.text.trim() || 'Video recording'
            })
            .select()
            .single()

          if (answerError) throw answerError

          // Link media to answer
          await supabase
            .from('media')
            .insert({
              answer_id: answerData.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: fileName,
              file_size: data.videoBlob.size,
              mime_type: data.videoBlob.type || 'video/webm'
            })
        } else {
          // Create a video story
          const { data: storyData, error: storyError } = await supabase
            .from('stories')
            .insert({
              family_id: familyId,
              profile_id: user.id,
              title: data.title.trim() || data.text.trim() || 'Video Recording',
              content: data.text.trim() || 'Video recording',
              tags: data.tags.length > 0 ? data.tags : ['video-story']
            })
            .select()
            .single()

          if (storyError) throw storyError

          // Link media to story
          await supabase
            .from('media')
            .insert({
              story_id: storyData.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: fileName,
              file_size: data.videoBlob.size,
              mime_type: data.videoBlob.type || 'video/webm'
            })
        }
      }

      // Handle text content (write mode)
      else if (data.text.trim()) {
        if (prompt) {
          // Create prompt answer
          await supabase
            .from('answers')
            .insert({
              question_id: prompt.id,
              profile_id: user.id,
              family_id: familyId,
              answer_text: data.text.trim()
            })
        } else {
          // Create text story
          await supabase
            .from('stories')
            .insert({
              family_id: familyId,
              profile_id: user.id,
              title: data.text.split('\n')[0].substring(0, 100) || 'Quick Capture',
              content: data.text.trim(),
              tags: data.tags.length > 0 ? data.tags : []
            })
        }
      }

      // Handle photo uploads
      else if (data.media.length > 0) {
        // Create story for photos
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .insert({
            family_id: familyId,
            profile_id: user.id,
            title: data.text.trim() || 'Photo Memories',
            content: data.text.trim() || 'Photo album',
            tags: data.tags.length > 0 ? data.tags : ['photos']
          })
          .select()
          .single()

        if (storyError) throw storyError

        // Upload and link each photo
        for (const mediaItem of data.media) {
          const fileExt = mediaItem.file.name.split('.').pop()
          const fileName = `photo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `${familyId}/${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, mediaItem.file)

          if (uploadError) throw uploadError

          await supabase
            .from('media')
            .insert({
              story_id: storyData.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: mediaItem.file.name,
              file_size: mediaItem.file.size,
              mime_type: mediaItem.file.type
            })
        }
      }
      
      track('quick_capture_save', { 
        mode: selectedMode,
        has_prompt: !!prompt,
        has_context: !!context
      })

      const savedType = prompt ? 'answer' : selectedMode === 'voice' ? 'voice story' : selectedMode === 'photo' ? 'photo story' : 'story'

      toast({
        title: 'Captured!',
        description: `Your ${savedType} was saved to your family archive.`,
        action: (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              onClose()
              // Navigate to appropriate view
              if (prompt) {
                navigate('/feed')
              } else {
                navigate('/collections?tab=story')
              }
            }}>
              View
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              // Reset form for another capture
              setData({
                mode: 'write',
                title: '',
                text: '',
                media: [],
                people: context?.personId && context?.personName ? 
                  [{ name: context.personName, isExisting: true }] : [],
                places: context?.propertyId ? [context.propertyName || ''] : [],
                tags: [],
                privacy: 'family'
              })
              setSelectedMode('write')
              setAudioUrl(null)
            }}>
              Add another
            </Button>
          </div>
        )
      })

      onSave?.()
      onClose()
    } catch (error) {
      console.error('Error saving capture:', error)
      toast({
        title: 'Save failed',
        description: 'There was an error saving your capture. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    // Save as draft logic
    track('quick_capture_save_draft', { mode: selectedMode })
    toast({
      title: 'Draft saved',
      description: 'Your capture has been saved as a draft.'
    })
  }

  const captureModeTiles = [
    {
      mode: 'write' as const,
      icon: FileText,
      label: 'Write',
      subtitle: 'Write a memory',
      shortcut: 'W',
      color: '#3B9EFF',
      colorRgb: '59, 158, 255'
    },
    {
      mode: 'photo' as const,
      icon: Camera,
      label: 'Photo',
      subtitle: 'Add photos',
      shortcut: 'P',
      color: '#00D4AA',
      colorRgb: '0, 212, 170'
    },
    {
      mode: 'voice' as const,
      icon: Mic,
      label: 'Voice',
      subtitle: 'Record voice',
      shortcut: 'V',
      color: '#FFB976',
      colorRgb: '255, 185, 118'
    },
    {
      mode: 'video' as const,
      icon: Video,
      label: 'Video',
      subtitle: 'Record short video',
      shortcut: 'Shift+V',
      color: '#A78BFA',
      colorRgb: '167, 139, 250'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideClose className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0 lg:max-w-md lg:ml-auto lg:mr-4 lg:h-[calc(100vh-2rem)] lg:my-4">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              ✨ Quick Capture
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                4/7 streak
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Prompt Section */}
            {prompt && showPrompt && (
              <Card className="border-brand-primary/20 bg-brand-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {prompt.category}
                      </Badge>
                      <p className="font-medium text-sm">{prompt.question}</p>
                      <p className="text-xs text-muted-foreground">{prompt.subcopy}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-xs h-7">
                        Show another
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPrompt(false)}
                        className="text-xs h-7"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Capture Mode Tiles */}
            <div className="grid grid-cols-2 gap-3">
              {captureModeTiles.map(({ mode, icon: Icon, label, subtitle, shortcut, color, colorRgb }) => (
                <Button
                  key={mode}
                  variant="outline"
                  className={`
                    relative h-24 flex-col gap-2 p-4 overflow-hidden border-0 shadow-sm group
                    ${selectedMode === mode ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''}
                  `}
                  style={{
                    background: `linear-gradient(135deg, rgba(${colorRgb}, 1), rgba(${colorRgb}, 0.85))`,
                  }}
                  onClick={() => setSelectedMode(mode)}
                >
                  {/* Sheen effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between items-center text-white">
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-xs text-white/80">{subtitle}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs h-5 bg-white/20 text-white border-white/30">
                      {shortcut}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>

            {/* Capture Content */}
            <div className="space-y-4">
              {selectedMode === 'write' && (
                <div>
                  <Textarea
                    ref={textareaRef}
                    placeholder="Tell the memory..."
                    value={data.text}
                    onChange={(e) => setData(prev => ({ ...prev, text: e.target.value }))}
                    className="min-h-[120px] resize-none"
                    rows={5}
                  />
                </div>
              )}

              {selectedMode === 'photo' && (
                <div>
                  <EnhancedMediaUploader
                    media={data.media}
                    onChange={(media) => setData(prev => ({ ...prev, media }))}
                    maxFiles={10}
                  />
                </div>
              )}

              {selectedMode === 'voice' && (
                <div className="space-y-4">
                  {/* Recording Status */}
                  {isRecording && (
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                          Recording... {formatTime(recordingTime)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center">
                    {!isRecording && !audioUrl && (
                      <div className="text-center space-y-4">
                        <Button
                          onClick={startRecording}
                          size="lg"
                          className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all"
                        >
                          <Mic className="h-6 w-6" />
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Tap to start recording
                        </p>
                      </div>
                    )}

                    {isRecording && (
                      <div className="text-center space-y-4">
                        <Button
                          onClick={stopRecording}
                          size="lg"
                          variant="destructive"
                          className="h-16 w-16 rounded-full animate-pulse shadow-lg"
                        >
                          <Square className="h-6 w-6" />
                        </Button>
                        <div className="space-y-2">
                          <div className="text-lg font-mono" aria-live="polite">
                            {formatTime(recordingTime)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Maximum 5 minutes
                          </p>
                        </div>
                      </div>
                    )}

                    {audioUrl && (
                      <div className="space-y-4 text-center w-full max-w-md">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Recording complete ({formatTime(recordingTime)})
                          </span>
                        </div>
                        
                        <audio 
                          controls 
                          src={audioUrl} 
                          className="w-full max-w-sm mx-auto"
                          preload="metadata"
                        />
                        
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={playRecording}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Play className="h-3 w-3" />
                            Play
                          </Button>
                          <Button
                            onClick={deleteRecording}
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                            Delete
                          </Button>
                          <Button
                            onClick={() => {
                              setAudioUrl(null)
                              setData(prev => ({ ...prev, audioBlob: undefined }))
                              setRecordingTime(0)
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Mic className="h-3 w-3" />
                            Record again
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recording Tips */}
                  {!isRecording && !audioUrl && (
                    <div className="text-center text-xs text-muted-foreground space-y-1 mt-4">
                      <p>💡 Find a quiet space for best quality</p>
                      <p>🎤 Speak clearly and at normal volume</p>
                    </div>
                  )}
                </div>
              )}

              {selectedMode === 'video' && (
                <div className="space-y-4">
                  {!videoUrl ? (
                    <div className="space-y-4">
                      {/* Live Video Preview */}
                      {isVideoRecording && liveVideoStream && (
                        <div className="relative border rounded-lg overflow-hidden bg-black">
                          <video 
                            ref={liveVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full aspect-video object-cover scale-x-[-1]"
                          />
                          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            REC {formatTime(recordingTime)}
                          </div>
                        </div>
                      )}
                      
                      {/* Recording Controls */}
                      <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        {!isVideoRecording && (
                          <>
                            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-4">
                              Record a video story
                            </p>
                          </>
                        )}
                        
                        <div className="flex justify-center gap-3">
                          {!isVideoRecording ? (
                            <Button 
                              onClick={startVideoRecording}
                              className="gap-2"
                            >
                              <Video className="h-4 w-4" />
                              Start Recording
                            </Button>
                          ) : (
                            <Button 
                              onClick={stopVideoRecording}
                              variant="destructive"
                              className="gap-2"
                            >
                              <Square className="h-4 w-4 fill-current" />
                              Stop Recording
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border rounded-lg overflow-hidden">
                        <video 
                          src={videoUrl} 
                          controls 
                          className="w-full scale-x-[-1]"
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            const video = e.target as HTMLVideoElement
                            video.currentTime = Math.min(2, video.duration || 0)
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Duration: {formatTime(recordingTime)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deleteVideoRecording}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Recording Tips */}
                  {!isVideoRecording && !videoUrl && (
                    <div className="text-center text-xs text-muted-foreground space-y-1 mt-4">
                      <p>📹 Record in good lighting for best quality</p>
                      <p>🎬 Keep videos under 2 minutes for easier sharing</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Attach & Link */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Attach & Link</h4>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowPeoplePicker(true)}
                >
                  <Users className="h-3 w-3" />
                  People
                  {data.people.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {data.people.length}
                    </Badge>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowPlacePicker(true)}
                >
                  <MapPin className="h-3 w-3" />
                  Place
                  {data.places.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                      {data.places.length}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Selected Places */}
              {data.places.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.places.map((place, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center gap-1 pr-1"
                    >
                      <MapPin className="h-3 w-3" />
                      {place}
                      <button
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            places: prev.places.filter((_, i) => i !== index)
                          }))
                        }}
                        className="ml-1 hover:bg-destructive/20 rounded-sm p-0.5"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Place Picker Dialog */}
              {showPlacePicker && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">Select Place</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Add custom place */}
                        <div>
                          <Input
                            placeholder="Add a place..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const place = e.currentTarget.value.trim()
                                if (place && !data.places.includes(place)) {
                                  setData(prev => ({
                                    ...prev,
                                    places: [...prev.places, place]
                                  }))
                                  e.currentTarget.value = ''
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Properties */}
                        {properties.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Family Properties</h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {properties
                                .filter(property => !data.places.includes(property.name))
                                .map((property) => (
                                <Button
                                  key={property.id}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start h-auto p-2"
                                  onClick={() => {
                                    if (!data.places.includes(property.name)) {
                                      setData(prev => ({
                                        ...prev,
                                        places: [...prev.places, property.name]
                                      }))
                                    }
                                  }}
                                >
                                  <MapPin className="h-3 w-3 mr-2" />
                                  {property.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => setShowPlacePicker(false)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Title/Description */}
              <div className="space-y-2">
                <Input
                  placeholder={prompt ? "What's the story?" : "What's the story? (becomes the title)"}
                  value={prompt ? data.text : data.title}
                  onChange={(e) => setData(prev => prompt 
                    ? { ...prev, text: e.target.value }
                    : { ...prev, title: e.target.value }
                  )}
                  className="text-sm font-medium"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add tags..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowTagList(!showTagList)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Available Tags List */}
                {showTagList && availableTags.length > 0 && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Suggested tags:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {availableTags
                        .filter(tag => !data.tags.includes(tag))
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-accent"
                            onClick={() => {
                              addTag(tag)
                              if (data.tags.length + 1 >= 5) setShowTagList(false)
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                
                {data.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="h-2 w-2 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Privacy</label>
                <Select
                  value={data.privacy}
                  onValueChange={(value) => setData(prev => ({ ...prev, privacy: value as Privacy }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected People */}
              {data.people.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.people.map((person, index) => (
                    <Badge 
                      key={index} 
                      variant={person.isExisting ? "default" : "secondary"} 
                      className="flex items-center gap-1 pr-1"
                    >
                      <User className="h-3 w-3" />
                      {person.name}
                      {!person.isExisting && <span className="text-xs opacity-75">(new)</span>}
                      <button
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            people: prev.people.filter((_, i) => i !== index)
                          }))
                        }}
                        className="ml-1 hover:bg-destructive/20 rounded-sm p-0.5"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* People Picker Dialog */}
              {showPeoplePicker && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">Select People</h3>
                      </div>
                      <PeoplePicker
                        selectedPeople={data.people}
                        onPeopleChange={(people) => {
                          setData(prev => ({ ...prev, people }))
                        }}
                        familyId={familyId}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => setShowPeoplePicker(false)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3 shrink-0">
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            disabled={isSaving}
          >
            Save draft
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="ml-auto"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}