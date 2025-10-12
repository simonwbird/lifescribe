import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Play, 
  Pause, 
  Volume2, 
  FileText,
  ChevronDown,
  ChevronUp,
  UserCircle,
  Check
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

interface AudioCardProps {
  recording: any
  person?: any
  familyId: string
  canEdit: boolean
  onUpdate: () => void
}

export function AudioCard({ recording, person, familyId, canEdit, onUpdate }: AudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Fetch family members for person selector
  const { data: familyMembers } = useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname, avatar_url')
        .eq('family_id', familyId)
        .order('given_name')

      if (error) throw error
      return data || []
    },
    enabled: canEdit
  })

  const handleChangePerson = async (newPersonId: string) => {
    try {
      console.log('Attempting to update recording:', recording.id, 'to person:', newPersonId)
      
      const { data, error } = await supabase
        .from('audio_recordings')
        .update({ tribute_id: newPersonId })
        .eq('id', recording.id)
        .select()

      console.log('Update result:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      toast.success('Audio memory reassigned successfully')
      onUpdate()
    } catch (error) {
      console.error('Error changing person:', error)
      toast.error('Failed to reassign audio memory: ' + (error as Error).message)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Simple waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isPlaying) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      // Generate waveform bars
      const barCount = 50
      const barWidth = width / barCount
      const progress = currentTime / duration

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * height * 0.8
        const x = i * barWidth
        const y = (height - barHeight) / 2
        
        // Color based on progress
        const isPast = (i / barCount) < progress
        ctx.fillStyle = isPast 
          ? 'hsl(var(--primary))' 
          : 'hsl(var(--muted-foreground) / 0.3)'
        
        ctx.fillRect(x, y, barWidth - 2, barHeight)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, currentTime, duration])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds === 0) {
      return '--:--'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={person?.avatar_url} />
            <AvatarFallback>
              {person?.given_name?.[0] || person?.surname?.[0] || 'P'}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {recording.profiles?.full_name}
                  </p>
                  {canEdit && familyMembers && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 gap-1 text-xs"
                        >
                          <UserCircle className="h-3 w-3" />
                          Change Person
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Assign to Person</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {familyMembers.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            onClick={() => handleChangePerson(member.id)}
                            className="gap-2"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {member.given_name?.[0]}{member.surname?.[0] || ''}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1">
                              {member.given_name} {member.surname || ''}
                            </span>
                            {person?.id === member.id && (
                              <Check className="h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(recording.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {Math.floor(recording.duration_seconds / 60)}:{(recording.duration_seconds % 60).toString().padStart(2, '0')}
              </Badge>
            </div>

            {/* Waveform */}
            <div className="relative mb-3">
              <canvas
                ref={canvasRef}
                width={600}
                height={60}
                className="w-full h-16 rounded-lg bg-muted"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={togglePlayPause}
                    className="h-12 w-12 rounded-full bg-background/80 backdrop-blur hover:bg-background"
                  >
                    <Play className="h-6 w-6" fill="currentColor" />
                  </Button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlayPause}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
                <CollapsibleTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-xs"
                  >
                    <FileText className="h-3 w-3" />
                    Transcript
                    {showTranscript ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            {/* Transcript */}
            <Collapsible open={showTranscript}>
              <CollapsibleContent className="mt-4 pt-4 border-t">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {recording.transcript || 'Transcript not available'}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={recording.audio_url}
          preload="metadata"
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
