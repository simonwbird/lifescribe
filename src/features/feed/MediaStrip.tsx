import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
        <div className={cn(
          "grid gap-2 rounded-lg overflow-hidden",
          images.length === 1 && "grid-cols-1",
          images.length === 2 && "grid-cols-2",
          images.length === 3 && "grid-cols-2",
          images.length >= 4 && "grid-cols-2"
        )}>
          {images.slice(0, 4).map((image, idx) => (
            <LazyImage 
              key={image.id} 
              media={image}
              className={cn(
                "w-full object-cover rounded-md",
                images.length === 3 && idx === 0 && "col-span-2",
                images.length === 1 ? "max-h-[500px]" : "max-h-[300px] aspect-square"
              )}
            />
          ))}
          {images.length > 4 && (
            <div className="col-span-1 flex items-center justify-center bg-muted rounded-md aspect-square">
              <span className="text-sm text-muted-foreground">+{images.length - 4} more</span>
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
  const imgRef = useRef<HTMLImageElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  if (!isVisible) {
    return <Skeleton className={cn("w-full", className)} />
  }

  return (
    <div className="relative">
      {!isLoaded && <Skeleton className={cn("absolute inset-0", className)} />}
      <img
        ref={imgRef}
        src={media.signedUrl || media.url}
        alt=""
        className={cn(className, !isLoaded && 'opacity-0')}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  )
}

// Lazy Video Component
function LazyVideo({ media, onPause }: { media: MediaItem; onPause?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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
