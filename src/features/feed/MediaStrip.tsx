import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/integrations/supabase/client'

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video' | 'audio' | 'other'
  signedUrl?: string
  thumbnailUrl?: string
  // Optional duration metadata (seconds)
  duration?: number
  durationSeconds?: number
}

interface MediaStripProps {
  media: MediaItem[]
  onPause?: () => void
}

// Convert relative storage file paths to public URLs
const toPublicUrl = (src?: string | null): string | undefined => {
  if (!src) return undefined
  if (src.startsWith('http')) return src
  const clean = src.replace(/^\/+/, '')
  const { data } = supabase.storage.from('media').getPublicUrl(clean)
  return data.publicUrl
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
        <div className="grid grid-cols-4 gap-1 w-full">
          {images.slice(0, images.length > 4 ? 3 : images.length).map((image) => (
            <LazyImage 
              key={image.id} 
              media={image}
              className="w-full aspect-square object-cover rounded-sm"
            />
          ))}
          {images.length > 4 && (
            <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-sm">
              <span className="text-sm font-medium text-muted-foreground">+{images.length - 3}</span>
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
  const [videoSrc, setVideoSrc] = useState<string>('')
  const [posterSrc, setPosterSrc] = useState<string>('')
  const quartileTracked = useRef({ q25: false, q50: false, q75: false, q100: false })

  // Resolve URLs on mount
  useEffect(() => {
    const video = toPublicUrl(media.signedUrl || media.url)
    const poster = toPublicUrl(media.thumbnailUrl)
    
    if (video) setVideoSrc(video)
    if (poster) setPosterSrc(poster)
  }, [media.signedUrl, media.url, media.thumbnailUrl])

  // Generate a poster thumbnail from the first video frame when no thumbnail is provided
  useEffect(() => {
    if (!isVisible || !videoSrc || posterSrc) return

    let cancelled = false

    const generatePoster = async () => {
      try {
        const v = document.createElement('video')
        v.crossOrigin = 'anonymous'
        v.preload = 'metadata'
        v.src = videoSrc

        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => {
            try {
              // Seek a tiny bit in to avoid black frames
              const t = 0.1
              v.currentTime = t
            } catch {}
          }
          const onSeeked = () => {
            v.removeEventListener('seeked', onSeeked)
            resolve()
          }
          const onError = () => reject(new Error('Failed to load video for poster'))

          v.addEventListener('loadeddata', onLoaded, { once: true })
          v.addEventListener('seeked', onSeeked, { once: true })
          v.addEventListener('error', onError, { once: true })
        })

        if (cancelled) return

        const canvas = document.createElement('canvas')
        const width = v.videoWidth || 1280
        const height = v.videoHeight || 720
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(v, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        if (!cancelled && dataUrl) setPosterSrc(dataUrl)
      } catch (e) {
        console.warn('Poster generation failed', e)
      }
    }

    generatePoster()

    return () => {
      cancelled = true
    }
  }, [isVisible, videoSrc, posterSrc])

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
      {!isVisible || !videoSrc ? (
        <div className="w-full aspect-video relative bg-muted">
          {posterSrc && (
            <img 
              src={posterSrc} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover"
            />
          )}
          {!videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster={posterSrc || undefined}
          className="w-full max-h-[200px] rounded-lg"
          src={videoSrc}
          onError={(e) => console.error('Video error:', videoSrc, e)}
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
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const quartileTracked = useRef({ q25: false, q50: false, q75: false, q100: false })

  // Format duration in MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Construct proper audio URL and seed duration from metadata if available
  useEffect(() => {
    const src = media.signedUrl || media.url
    const full = toPublicUrl(src)
    setAudioSrc(full || null)

    // Seed from known metadata if present
    const seed = (media as any).duration ?? (media as any).durationSeconds ?? null
    if (seed && typeof seed === 'number' && isFinite(seed) && seed > 0) {
      setDuration(seed)
    }
  }, [media.url, media.signedUrl])

  // Load duration when audio metadata is available (add robust listeners)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setFromEl = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener('loadedmetadata', setFromEl)
    audio.addEventListener('canplay', setFromEl)
    audio.addEventListener('durationchange', setFromEl)
    
    // If metadata already loaded
    setFromEl()

    return () => {
      audio.removeEventListener('loadedmetadata', setFromEl)
      audio.removeEventListener('canplay', setFromEl)
      audio.removeEventListener('durationchange', setFromEl)
    }
  }, [audioSrc])

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
    <div ref={containerRef} className="w-full bg-muted/50 p-4 rounded-lg space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Audio Recording</span>
        <span className="font-medium">{duration ? formatDuration(duration) : '…'}</span>
      </div>
      {!isVisible ? (
        <Skeleton className="w-full h-12" />
      ) : (
        <audio
          key={audioSrc || undefined}
          ref={audioRef}
          controls
          preload="metadata"
          crossOrigin="anonymous"
          className="w-full"
          src={audioSrc || undefined}
          onLoadedMetadata={() => {
            const a = audioRef.current
            if (a && a.duration && isFinite(a.duration)) setDuration(a.duration)
          }}
        />
      )}
    </div>
  )
}
