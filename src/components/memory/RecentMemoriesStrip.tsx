import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Pause, Volume2, Image as ImageIcon, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Memory {
  id: string
  modality: 'text' | 'voice' | 'photo'
  title: string | null
  body: string | null
  audio_url: string | null
  photo_url: string | null
  created_at: string
  profiles?: {
    full_name: string
  }
  contributor_name: string | null
}

interface RecentMemoriesStripProps {
  memories: Memory[]
}

export function RecentMemoriesStrip({ memories }: RecentMemoriesStripProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  const handlePlayPause = (memoryId: string, audioUrl: string) => {
    // Stop all other audio
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== memoryId) {
        audio.pause()
      }
    })

    // Toggle play/pause for this audio
    if (!audioRefs.current[memoryId]) {
      const audio = new Audio(audioUrl)
      audioRefs.current[memoryId] = audio
      
      audio.onended = () => {
        setPlayingId(null)
      }
      
      audio.onerror = () => {
        setPlayingId(null)
        console.error('Error playing audio')
      }
    }

    const audio = audioRefs.current[memoryId]
    
    if (playingId === memoryId) {
      audio.pause()
      setPlayingId(null)
    } else {
      audio.play()
      setPlayingId(memoryId)
    }
  }

  if (memories.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Recent Memories
      </h4>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {memories.map((memory) => {
          const contributorName = memory.profiles?.full_name || memory.contributor_name || 'Someone'
          const displayText = memory.title || memory.body || 'Untitled memory'
          const truncatedText = displayText.length > 80 
            ? displayText.substring(0, 77) + '...' 
            : displayText

          return (
            <Card key={memory.id} className="p-3 hover:bg-accent/50 transition-colors">
              <div className="space-y-2">
                {/* Modality indicator & content */}
                {memory.modality === 'voice' && memory.audio_url ? (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayPause(memory.id, memory.audio_url!)}
                      className="w-full justify-start gap-2 h-auto py-2"
                    >
                      {playingId === memory.id ? (
                        <Pause className="h-4 w-4 shrink-0" />
                      ) : (
                        <Play className="h-4 w-4 shrink-0" />
                      )}
                      <div className="flex items-center gap-1 min-w-0">
                        <Volume2 className="h-3 w-3 shrink-0" />
                        <span className="text-xs truncate">
                          {memory.title || 'Voice memory'}
                        </span>
                      </div>
                    </Button>
                  </div>
                ) : memory.modality === 'photo' && memory.photo_url ? (
                  <div className="space-y-1">
                    <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                      <img
                        src={memory.photo_url}
                        alt={memory.title || 'Memory photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {memory.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {memory.body}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm flex-1 line-clamp-3">
                      {truncatedText}
                    </p>
                  </div>
                )}

                {/* Attribution */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{contributorName}</span>
                  <span className="shrink-0">
                    {formatDistanceToNow(new Date(memory.created_at), { 
                      addSuffix: true 
                    }).replace('about ', '')}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
