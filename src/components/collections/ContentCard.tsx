import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageViewer } from '@/components/ui/image-viewer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  ChefHat, 
  Package, 
  Home, 
  Heart,
  MoreHorizontal, 
  Eye, 
  Edit, 
  Share2,
  Calendar,
  MapPin,
  Users,
  Play,
  Pause,
  Mic,
  Video,
  Trash2
} from 'lucide-react'

import { getSignedMediaUrl } from '@/lib/media'
import { supabase } from '@/lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import type { Content } from '@/lib/collectionsTypes'

interface ContentCardProps {
  content: Content
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  showSelection?: boolean
  onDelete?: (id: string, type: Content['type']) => void
}

interface VideoPlayerProps {
  content: Content
}

function VideoPlayer({ content }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const loadVideo = async () => {
    if (videoUrl || isLoading) return
    
    setIsLoading(true)
    try {
      // Fetch video media for this story
      const { data: media, error } = await supabase
        .from('media')
        .select('file_path')
        .eq('story_id', content.id)
        .like('mime_type', 'video%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !media) {
        console.error('No video media found for story:', content.id)
        return
      }

      // Get signed URL for the video file
      const url = await getSignedMediaUrl(media.file_path, content.familyId)
      if (url) setVideoUrl(url)
    } catch (error) {
      console.error('Error fetching video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  React.useEffect(() => {
    loadVideo()
  }, [content.id])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Video className="h-8 w-8 text-muted-foreground animate-pulse" />
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Video className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group/video">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement
          video.currentTime = Math.min(2, video.duration || 0)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handleVideoClick}
      />
      
      {/* Play/Pause overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/video:opacity-100 transition-opacity cursor-pointer"
        onClick={handleVideoClick}
      >
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="h-6 w-6" fill="currentColor" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default function ContentCard({ 
  content, 
  isSelected = false, 
  onSelect, 
  showSelection = false,
  onDelete 
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(getDetailUrl())
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!onDelete) return
    
    const confirmMessage = `Are you sure you want to delete this ${content.type}? This action cannot be undone.`
    
    if (window.confirm(confirmMessage)) {
      onDelete(content.id, content.type)
    }
  }

  const getTypeIcon = () => {
    switch (content.type) {
      case 'story':
        return <FileText className="h-4 w-4" />
      case 'recipe':
        return <ChefHat className="h-4 w-4" />
      case 'pet':
        return <Heart className="h-4 w-4" />
      case 'object':
        return <Package className="h-4 w-4" />
      case 'property':
        return <Home className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (content.type) {
      case 'story':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'recipe':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'pet':
        return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'object':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'property':
        return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getEditUrl = () => {
    switch (content.type) {
      case 'story':
        return `/stories/${content.id}/edit`
      case 'recipe':
        return `/recipes/${content.id}/edit`
      case 'pet':
        return `/pets/${content.id}/edit`
      case 'object':
        return `/things/${content.id}/edit`
      case 'property':
        return `/properties/${content.id}/edit`
      default:
        return null
    }
  }

  const getDetailUrl = () => {
    switch (content.type) {
      case 'story':
        return `/stories/${content.id}`
      case 'recipe':
        return `/recipes/${content.id}`
      case 'pet':
        return `/pets/${content.id}`
      case 'object':
        return `/things/${content.id}`
      case 'property':
        return `/properties/${content.id}`
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  // Check if this is a voice recording
  const isVoiceRecording = content.type === 'story' && 
    content.tags.some(tag => tag.includes('voice') || tag.includes('audio'))

  // Check if this is a video recording
  const isVideoRecording = content.type === 'story' && 
    content.tags.some(tag => tag.includes('video'))

  // Fetch current user's avatar for voice recordings without cover image
  React.useEffect(() => {
    const fetchMyAvatar = async () => {
      if (!isVoiceRecording || content.coverUrl) return
      try {
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData?.user?.id
        if (!userId) return

        // 1) Try profiles.avatar_url
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single()
        
        let avatar = profile?.avatar_url as string | null

        // 2) If not set, try linked person avatar
        if (!avatar) {
          const { data: link } = await supabase
            .from('person_user_links')
            .select('person_id, family_id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()
          if (link?.person_id && link.family_id) {
            const { data: person } = await supabase
              .from('people')
              .select('avatar_url')
              .eq('id', link.person_id)
              .eq('family_id', link.family_id)
              .single()
            avatar = (person?.avatar_url as string | null) ?? null
          }
        }

        // Refresh Supabase signed URLs so they aren't expired
        if (avatar) {
          const match = avatar.match(/object\/sign\/([^/]+)\/([^?]+)/)
          if (match) {
            const bucket = match[1]
            const objectPath = decodeURIComponent(match[2])
            const { data: signed } = await supabase.storage
              .from(bucket)
              .createSignedUrl(objectPath, 3600)
            if (signed?.signedUrl) avatar = signed.signedUrl
          }
          setAuthorAvatar(avatar)
        }
      } catch (error) {
        console.error('Error fetching current user avatar:', error)
      }
    }

    fetchMyAvatar()
  }, [isVoiceRecording, content.coverUrl])

  const handlePlayVoice = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // If already playing, pause it
    if (isPlaying && currentAudio) {
      currentAudio.pause()
      setIsPlaying(false)
      return
    }

    // If paused, resume
    if (currentAudio && currentAudio.paused) {
      currentAudio.play()
      setIsPlaying(true)
      return
    }

    // Start new playback
    try {
      setIsPlaying(true)
      const audioUrl = await getVoiceRecordingUrl(content.id)
      if (!audioUrl) {
        setIsPlaying(false)
        setCurrentAudio(null)
        return
      }
      const audio = new Audio(audioUrl)
      setCurrentAudio(audio)
      audio.play()
      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
      }
    } catch (error) {
      console.error('Error playing voice recording:', error)
      setIsPlaying(false)
      setCurrentAudio(null)
    }
  }

  const getVoiceRecordingUrl = async (storyId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('file_path')
        .eq('story_id', storyId)
        .like('mime_type', 'audio%')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        console.error('No audio media found for story:', storyId)
        return null
      }

      const audioUrl = await getSignedMediaUrl(data[0].file_path, content.familyId)
      return audioUrl
    } catch (error) {
      console.error('Error fetching voice recording:', error)
      return null
    }
  }

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 relative overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(content.id, checked === true)}
            className={`bg-background border-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
          />
        </div>
      )}

      {/* Cover image/video placeholder */}
      <div 
        className="h-32 bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center cursor-pointer group/image relative overflow-hidden"
        onClick={() => content.coverUrl && !isVideoRecording && setShowImageViewer(true)}
      >
        {isVideoRecording ? (
          <VideoPlayer content={content} />
        ) : content.coverUrl ? (
          <img 
            src={content.coverUrl} 
            alt={`${content.title} ${content.type} cover image`}
            className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = '/placeholder.svg'
            }}
          />
        ) : (
          <div className="text-muted-foreground flex items-center justify-center relative">
            {isVoiceRecording && authorAvatar ? (
              <img 
                src={authorAvatar}
                alt={`${content.authorName} profile`}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  // Fallback to microphone icon if profile image fails
                  setAuthorAvatar(null)
                }}
              />
            ) : isVoiceRecording ? (
              <Mic className="h-8 w-8" />
            ) : isVideoRecording ? (
              <Video className="h-8 w-8" />
            ) : (
              getTypeIcon()
            )}
          </div>
        )}
        
        {/* Play button for voice recordings */}
        {isVoiceRecording && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePlayVoice}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-12 w-12 rounded-full shadow-lg"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" fill="currentColor" />
              ) : (
                <Play className="h-6 w-6" fill="currentColor" />
              )}
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate" title={content.title}>
              {content.title}
            </h3>
            <Badge variant="outline" className={`mt-1 ${getTypeColor()}`}>
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                {content.type}
              </span>
            </Badge>
          </div>

          {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border z-50">
                <DropdownMenuItem asChild>
                  <Link to={getDetailUrl()} onClick={(e) => e.stopPropagation()}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                {getEditUrl() ? (
                  <DropdownMenuItem asChild>
                    <Link to={getEditUrl()!} onClick={(e) => e.stopPropagation()}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit (Coming Soon)
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {content.occurredAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(content.occurredAt)}</span>
            </div>
          )}
          
          {content.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{content.location}</span>
            </div>
          )}
          
          {content.peopleIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>{content.peopleIds.length} people</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {content.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{content.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>by {content.authorName}</span>
            <span>{formatDate(content.addedAt)}</span>
          </div>
        </div>
      </CardContent>

      {/* Image Viewer Modal */}
      {content.coverUrl && (
        <ImageViewer
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={content.coverUrl}
          imageAlt={`${content.title} cover image`}
          title={content.title}
        />
      )}
    </Card>
  )
}