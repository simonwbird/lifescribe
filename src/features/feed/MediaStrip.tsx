import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video' | 'audio' | 'other'
  signedUrl?: string
  thumbnailUrl?: string
}

interface MediaStripProps {
  media: MediaItem[]
  onPause?: () => void
}

export function MediaStrip({ media, onPause }: MediaStripProps) {
  if (!media || media.length === 0) return null

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')
  const audios = media.filter(m => m.type === 'audio')

  return (
    <div className="space-y-3">
      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden">
          {images.slice(0, images.length > 5 ? 4 : 5).map((image) => (
            <LazyImage 
              key={image.id} 
              media={image}
              className="w-full aspect-square object-cover rounded-md"
            />
          ))}
          {images.length > 5 && (
            <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-md">
              <span className="text-sm font-medium text-muted-foreground">+{images.length - 4} more</span>
            </div>
          )}
        </div>
      )}

      {/* Videos */}
      {videos.map(video => (
        <LazyVideo key={video.id} media={video} onPause={onPause} />
      ))}

      {/* Audio */}
      {audios.map(audio => (
        <LazyAudio key={audio.id} media={audio} onPause={onPause} />
      ))}
    </div>
  )
}

// Lazy Image Component
function LazyImage({ media, className }: { media: MediaItem; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {!isVisible ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <>
          {!isLoaded && (
            media.thumbnailUrl ? (
              <img
                src={media.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-md scale-105 rounded-md"
                aria-hidden
              />
            ) : (
              <Skeleton className="absolute inset-0 rounded-md" />
            )
          )}
          <img
            src={media.signedUrl || media.url}
            alt=""
            className={cn("w-full h-full object-cover rounded-md transition-opacity duration-300", !isLoaded && 'opacity-0')}
            onLoad={() => setIsLoaded(true)}
            loading="lazy"
          />
        </>
      )}
    </div>
  )
}

// Lazy Video Component
function LazyVideo({ media, onPause }: { media: MediaItem; onPause?: () => void }) {
  const { track } = useAnalytics()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const quartileTracked = useRef({ q25: false, q50: false, q75: false, q100: false })

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          // Pause when scrolled out of view
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause()
            onPause?.()
          }
        }
      },
      { rootMargin: '50px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
      // Pause on unmount
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
        onPause?.()
      }
    }
  }, [onPause])

  // Track video playback analytics
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      track('media_play', { media_id: media.id, media_type: 'video' })
    }

    const handleTimeUpdate = () => {
      if (!video.duration) return
      const progress = (video.currentTime / video.duration) * 100

      if (progress >= 25 && !quartileTracked.current.q25) {
        quartileTracked.current.q25 = true
        track('video_quartile', { media_id: media.id, quartile: 25 })
      } else if (progress >= 50 && !quartileTracked.current.q50) {
        quartileTracked.current.q50 = true
        track('video_quartile', { media_id: media.id, quartile: 50 })
      } else if (progress >= 75 && !quartileTracked.current.q75) {
        quartileTracked.current.q75 = true
        track('video_quartile', { media_id: media.id, quartile: 75 })
      } else if (progress >= 100 && !quartileTracked.current.q100) {
        quartileTracked.current.q100 = true
        track('video_quartile', { media_id: media.id, quartile: 100 })
      }
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [media.id, track])

  return (
    <div ref={containerRef} className="w-full bg-black/5 rounded-lg overflow-hidden">
      {!isVisible ? (
        <Skeleton className="w-full aspect-video" />
      ) : (
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster={media.thumbnailUrl}
          className="w-full max-h-[500px] rounded-lg"
          src={isVisible ? media.signedUrl || media.url : undefined}
        />
      )}
    </div>
  )
}

// Lazy Audio Component
function LazyAudio({ media, onPause }: { media: MediaItem; onPause?: () => void }) {
  const { track } = useAnalytics()
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const quartileTracked = useRef({ q25: false, q50: false, q75: false, q100: false })

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        } else {
          // Pause when scrolled out of view
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause()
            onPause?.()
          }
        }
      },
      { rootMargin: '50px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
      // Pause on unmount
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
        onPause?.()
      }
    }
  }, [onPause])

  // Track audio playback analytics
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      track('media_play', { media_id: media.id, media_type: 'audio' })
    }

    const handleTimeUpdate = () => {
      if (!audio.duration) return
      const progress = (audio.currentTime / audio.duration) * 100

      if (progress >= 25 && !quartileTracked.current.q25) {
        quartileTracked.current.q25 = true
        track('audio_quartile', { media_id: media.id, quartile: 25 })
      } else if (progress >= 50 && !quartileTracked.current.q50) {
        quartileTracked.current.q50 = true
        track('audio_quartile', { media_id: media.id, quartile: 50 })
      } else if (progress >= 75 && !quartileTracked.current.q75) {
        quartileTracked.current.q75 = true
        track('audio_quartile', { media_id: media.id, quartile: 75 })
      } else if (progress >= 100 && !quartileTracked.current.q100) {
        quartileTracked.current.q100 = true
        track('audio_quartile', { media_id: media.id, quartile: 100 })
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [media.id, track])

  return (
    <div ref={containerRef} className="w-full bg-muted/50 p-4 rounded-lg">
      {!isVisible ? (
        <Skeleton className="w-full h-12" />
      ) : (
        <audio
          ref={audioRef}
          controls
          preload="none"
          className="w-full"
          src={isVisible ? media.signedUrl || media.url : undefined}
        />
      )}
    </div>
  )
}
