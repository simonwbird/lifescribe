import { Play, Pause, Volume2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface StoryAsset {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'divider'
  url: string
  thumbnail_url?: string | null
  transcoded_url?: string | null
  position: number
  processing_state?: string | null
  metadata?: any
}

interface StoryAssetRendererProps {
  asset: StoryAsset
  compact?: boolean
}

export function StoryAssetRenderer({ asset, compact = false }: StoryAssetRendererProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const getMimeFromUrl = (u?: string | null) => {
    if (!u) return undefined
    const l = u.toLowerCase()
    if (l.endsWith('.mp4')) return 'video/mp4'
    if (l.endsWith('.webm')) return 'video/webm'
    if (l.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl'
    return undefined
  }

  useEffect(() => {
    if (asset.type !== 'video') return
    try {
      const tester = document.createElement('video')
      const type = (asset as any).metadata?.mime_type || getMimeFromUrl(asset.transcoded_url || asset.url)
      if (type && tester.canPlayType) {
        const res = tester.canPlayType(type)
        setUnsupported(res === '')
      }
    } catch (_) {
      // ignore
    }
  }, [asset])

  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [showVideo])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  if (asset.processing_state === 'processing') {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Processing media...</p>
      </div>
    )
  }

  if (asset.processing_state === 'failed') {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
        <p className="text-sm text-destructive">Failed to process media</p>
      </div>
    )
  }

  switch (asset.type) {
    case 'text':
      return (
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{asset.metadata?.content || ''}</p>
        </div>
      )

    case 'image':
      return (
        <img
          src={asset.url}
          alt={asset.metadata?.file_name || 'Story image'}
          className="rounded-lg w-full object-cover max-h-[600px]"
          loading="lazy"
        />
      )

    case 'video':
      if (compact) {
        return (
          <div className="relative rounded-lg overflow-hidden cursor-pointer group">
            {asset.thumbnail_url ? (
              <img
                src={asset.thumbnail_url}
                alt="Video thumbnail"
                className="w-full h-48 object-cover"
              />
            ) : (
              <video
                src={asset.transcoded_url || asset.url}
                className="w-full h-48 object-cover"
                preload="metadata"
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
              <div className="bg-white rounded-full p-4">
                <Play className="h-8 w-8 text-primary" fill="currentColor" />
              </div>
            </div>
          </div>
        )
      }

      if (unsupported) {
        return (
          <div className="relative rounded-lg overflow-hidden">
            {asset.thumbnail_url ? (
              <img
                src={asset.thumbnail_url}
                alt="Video thumbnail"
                className="w-full rounded-lg max-h-[600px] object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-video w-full rounded-lg bg-muted" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="secondary"
                onClick={() => window.open(asset.transcoded_url || asset.url, '_blank')}
              >
                Open video
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This video format isn’t supported by your browser.
            </p>
          </div>
        )
      }

      if (!showVideo && asset.thumbnail_url) {
        return (
          <div
            className="relative rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setShowVideo(true)}
            role="button"
            aria-label="Play video"
          >
            <img
              src={asset.thumbnail_url}
              alt="Video thumbnail"
              className="w-full rounded-lg max-h-[600px] object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-background rounded-full p-4 shadow-sm">
                <Play className="h-8 w-8 text-primary" fill="currentColor" />
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="relative rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            poster={asset.thumbnail_url || undefined}
            controls
            preload="metadata"
            playsInline
            className="w-full rounded-lg max-h-[600px]"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => console.error('Video playback error', e)}
          >
            {asset.transcoded_url && (
              <source src={asset.transcoded_url} type={getMimeFromUrl(asset.transcoded_url)} />
            )}
            <source
              src={asset.url}
              type={asset.metadata?.mime_type || getMimeFromUrl(asset.url)}
            />
            Your browser does not support the video tag.
          </video>
        </div>
      )

    case 'audio':
      if (compact) {
        return (
          <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Audio Recording</span>
              </div>
              <audio
                ref={audioRef}
                src={asset.url}
                className="hidden"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          </div>
        )
      }

      return (
        <div className="bg-secondary/50 rounded-lg p-6">
          <audio
            ref={audioRef}
            src={asset.url}
            controls
            className="w-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {asset.metadata?.transcript && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Transcript</p>
              <p className="text-sm text-muted-foreground italic">
                {asset.metadata.transcript}
              </p>
            </div>
          )}
        </div>
      )

    case 'divider':
      return <hr className="border-t-2 border-border my-6" />

    default:
      return null
  }
}