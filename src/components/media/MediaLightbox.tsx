import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share, 
  Download,
  Edit3,
  Tag,
  MapPin,
  Calendar,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search
} from 'lucide-react'
import { LightboxItem } from '@/lib/mediaTypes'
import { cn } from '@/lib/utils'

interface PhotoTag {
  id: string
  person_name: string
  position_x: number
  position_y: number
  position_width?: number
  position_height?: number
}

interface MediaLightboxProps {
  isOpen: boolean
  onClose: () => void
  item: LightboxItem | null
  onPrevious: () => void
  onNext: () => void
  onFavorite: (id: string) => void
  onAddToAlbum: (id: string) => void
  onTagPeople: (id: string, peopleIds: string[]) => void
  onEditCaption: (id: string, caption: string) => void
}

export function MediaLightbox({
  isOpen,
  onClose,
  item,
  onPrevious,
  onNext,
  onFavorite,
  onAddToAlbum,
  onTagPeople,
  onEditCaption
}: MediaLightboxProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionValue, setCaptionValue] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const [tags, setTags] = useState<PhotoTag[]>([])

  useEffect(() => {
    if (item) {
      setCaptionValue(item.caption || '')
      setIsEditingCaption(false)
      setCurrentTime(0)
      setIsPlaying(false)
      fetchTags()
    }
  }, [item])

  const fetchTags = async () => {
    if (!item || item.type !== 'photo') return
    
    try {
      const { data, error } = await supabase
        .from('entity_links')
        .select(`
          id,
          entity_id,
          position_x,
          position_y,
          position_width,
          position_height
        `)
        .eq('source_type', 'media')
        .eq('source_id', item.id)
        .eq('entity_type', 'person')

      if (error) throw error

      if (data && data.length > 0) {
        const personIds = data.map(link => link.entity_id)
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('id, full_name')
          .in('id', personIds)

        if (peopleError) throw peopleError

        const peopleMap = new Map(peopleData?.map(p => [p.id, p.full_name]))

        setTags(data.map(link => ({
          id: link.id,
          person_name: peopleMap.get(link.entity_id) || 'Unknown',
          position_x: link.position_x || 0,
          position_y: link.position_y || 0,
          position_width: link.position_width,
          position_height: link.position_height
        })).filter(tag => tag.position_x !== null && tag.position_y !== null))
      } else {
        setTags([])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !item) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onPrevious()
          break
        case 'ArrowRight':
          onNext()
          break
        case ' ':
          e.preventDefault()
          if (item.type === 'video' || item.type === 'voice') {
            setIsPlaying(!isPlaying)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, item, isPlaying, onClose, onPrevious, onNext])

  const handleSaveCaption = () => {
    if (item) {
      onEditCaption(item.id, captionValue)
      setIsEditingCaption(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const highlightSearchText = (text: string, search: string) => {
    if (!search) return text
    
    const regex = new RegExp(`(${search})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
      ) : part
    )
  }

  if (!item) return null

  const renderMedia = () => {
    switch (item.type) {
      case 'photo':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative inline-block">
              <img 
                src={item.srcUrl} 
                alt={item.caption || 'Photo'}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Visual Tags Overlay */}
              {tags.length > 0 && (
                <>
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="absolute transition-opacity"
                      style={{
                        left: `${tag.position_x}%`,
                        top: `${tag.position_y}%`,
                        width: tag.position_width ? `${tag.position_width}%` : 'auto',
                        height: tag.position_height ? `${tag.position_height}%` : 'auto',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none'
                      }}
                    >
                      {/* Tag box */}
                      <div 
                        className="absolute inset-0 border-2 border-white rounded shadow-lg"
                        style={{
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)',
                        }}
                      />
                      
                      {/* Tag label */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-10">
                        <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                          {tag.person_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )
      
      case 'video':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              src={item.srcUrl}
              poster={item.posterUrl}
              className="max-w-full max-h-full"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
          </div>
        )
      
      case 'voice':
        return (
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">Voice Recording</h3>
                <p className="text-sm text-muted-foreground">
                  {formatTime(duration || item.duration || 0)}
                </p>
              </div>
              
              <div className="space-y-4">
                <audio
                  src={item.srcUrl}
                  className="w-full"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                />
                
                {item.transcriptText && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTranscript(!showTranscript)}
                      >
                        {showTranscript ? 'Hide' : 'Show'} Transcript
                      </Button>
                      {showTranscript && (
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search transcript..."
                            value={transcriptSearch}
                            onChange={(e) => setTranscriptSearch(e.target.value)}
                            className="pl-8 w-48"
                          />
                        </div>
                      )}
                    </div>
                    
                    {showTranscript && (
                      <div className="max-h-40 overflow-y-auto p-3 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed">
                          {highlightSearchText(item.transcriptText, transcriptSearch)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Media Content */}
          <div className="flex-1 relative bg-black">
            {renderMedia()}
            
            {/* Navigation */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              onClick={onPrevious}
              disabled={item.index === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
              onClick={onNext}
              disabled={item.index === item.total - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Counter */}
            <div className="absolute top-4 left-4 text-white">
              <Badge variant="secondary">
                {item.index + 1} of {item.total}
              </Badge>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-80 bg-background border-l flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFavorite(item.id)}
                  className="flex items-center gap-2"
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    item.favoriteCount > 0 ? "fill-red-500 text-red-500" : ""
                  )} />
                  {item.favoriteCount}
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Share className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onAddToAlbum(item.id)}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Caption */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Caption</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingCaption(!isEditingCaption)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
                
                {isEditingCaption ? (
                  <div className="space-y-2">
                    <Textarea
                      value={captionValue}
                      onChange={(e) => setCaptionValue(e.target.value)}
                      placeholder="Add a caption..."
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveCaption}>
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingCaption(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {item.caption || 'No caption'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Metadata */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Details</h4>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.takenAt).toLocaleDateString()}
                  </div>
                  
                  {item.duration && (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      {formatTime(item.duration)}
                    </div>
                  )}
                  
                  {item.exifData?.camera && (
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      {item.exifData.camera}
                    </div>
                  )}
                  
                  {item.exifData?.location?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {item.exifData.location.address}
                    </div>
                  )}
                </div>
              </div>
              
              {/* People Tags */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">People</h4>
                <div className="flex flex-wrap gap-1">
                  {item.peopleIds.length > 0 ? (
                    item.peopleIds.map((personId) => (
                      <Badge key={personId} variant="secondary">
                        Person {personId.slice(0, 8)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No people tagged</p>
                  )}
                </div>
              </div>
              
              {/* Place Tags */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Places</h4>
                <div className="flex flex-wrap gap-1">
                  {item.placeIds.length > 0 ? (
                    item.placeIds.map((placeId) => (
                      <Badge key={placeId} variant="secondary">
                        Place {placeId.slice(0, 8)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No places tagged</p>
                  )}
                </div>
              </div>
              
              {/* Albums */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Albums</h4>
                <div className="flex flex-wrap gap-1">
                  {item.albumIds.length > 0 ? (
                    item.albumIds.map((albumId) => (
                      <Badge key={albumId} variant="secondary">
                        Album {albumId.slice(0, 8)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Not in any albums</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}