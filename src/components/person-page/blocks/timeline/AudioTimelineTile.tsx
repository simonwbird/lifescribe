import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Volume2, Play, Pause } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AudioTimelineTileProps {
  recording: {
    id: string
    audio_url: string
    duration_seconds: number
    transcript?: string
    created_at: string
    creator?: {
      full_name: string
      avatar_url?: string
    }
  }
  onClick?: () => void
}

export function AudioTimelineTile({ recording, onClick }: AudioTimelineTileProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all hover:shadow-md",
          "bg-gradient-to-br from-background to-muted/30"
        )}
        onClick={onClick}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Audio Icon */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              isPlaying ? "bg-primary/20 animate-pulse" : "bg-primary/10"
            )}>
              <Volume2 className={cn(
                "h-6 w-6",
                isPlaying ? "text-primary" : "text-primary/70"
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    Audio Memory
                  </p>
                  {recording.creator && (
                    <p className="text-xs text-muted-foreground truncate">
                      by {recording.creator.full_name}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {formatDuration(recording.duration_seconds)}
                </Badge>
              </div>

              {recording.transcript && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {recording.transcript}
                </p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 gap-1.5"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {isPlaying ? 'Pause' : 'Play'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={recording.audio_url}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </>
  )
}
