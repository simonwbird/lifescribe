import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { getSignedMediaUrl } from '@/lib/media'

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
  const [expanded, setExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState<number>(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const hlsInstanceRef = useRef<any | null>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [signedSrc, setSignedSrc] = useState<string | null>(null)
  const [signedThumb, setSignedThumb] = useState<string | null>(null)

  // Extract bucket file path and familyId from a Supabase storage URL
  const toStoragePath = (u?: string | null): { filePath: string | null; familyId: string | null } => {
    if (!u) return { filePath: null, familyId: null }
    try {
      const url = new URL(u)
      const parts = url.pathname.split('/').filter(Boolean)
      const mediaIdx = parts.indexOf('media')
      if (mediaIdx === -1) return { filePath: null, familyId: null }
      const rest = parts.slice(mediaIdx + 1)
      const filePath = rest.join('/') || null
      const familyId = rest[0] || null
      return { filePath, familyId }
    } catch {
      const path = u.split('?')[0].split('#')[0]
      const marker = '/media/'
      const idx = path.indexOf(marker)
      if (idx === -1) return { filePath: null, familyId: null }
      const rest = path.substring(idx + marker.length)
      const segs = rest.split('/').filter(Boolean)
      return { filePath: segs.join('/'), familyId: segs[0] || null }
    }
  }

  const getMimeFromUrl = (u?: string | null) => {
    if (!u) return undefined
    // Use pathname without query/hash for extension detection
    let p = ''
    try {
      p = new URL(u).pathname.toLowerCase()
    } catch {
      p = u.split('?')[0].split('#')[0].toLowerCase()
    }
    if (p.endsWith('.mp4')) return 'video/mp4'
    if (p.endsWith('.webm')) return 'video/webm'
    if (p.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl'
    return undefined
  }

  // Decide the actual playback source once and reuse everywhere
  const playback = useMemo(() => {
    if (asset.type !== 'video') return null as null | { url: string; type?: string; isHls: boolean }
    const candidates = [
      signedSrc ? { url: signedSrc, type: getMimeFromUrl(signedSrc) } : null,
      asset.transcoded_url ? { url: asset.transcoded_url, type: getMimeFromUrl(asset.transcoded_url) } : null,
      { url: asset.url, type: asset.metadata?.mime_type || getMimeFromUrl(asset.url) }
    ].filter(Boolean) as { url: string; type?: string }[]

    const tester = document.createElement('video')
    const playable = candidates.find((c) => (c.type ? tester.canPlayType(c.type) !== '' : true)) || candidates[0]
    const url = playable.url
    let path = ''
    try { path = new URL(url).pathname.toLowerCase() } catch { path = url.split('?')[0].split('#')[0].toLowerCase() }
    const isHls = (playable.type === 'application/vnd.apple.mpegurl') || path.endsWith('.m3u8')
    return { url, type: playable.type, isHls }
  }, [asset.type, asset.url, asset.transcoded_url, asset.metadata?.mime_type, signedSrc])

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

  // Resolve signed URLs for private media (video/image/audio + thumbnail)
  useEffect(() => {
    let cancelled = false
    const resolve = async () => {
      const primary = asset.transcoded_url || asset.url
      const { filePath, familyId } = toStoragePath(primary)
      if (filePath && familyId) {
        try {
          const signed = await getSignedMediaUrl(filePath, familyId)
          if (!cancelled) setSignedSrc(signed || primary)
        } catch {
          if (!cancelled) setSignedSrc(primary)
        }
      } else {
        setSignedSrc(primary)
      }

      if (asset.thumbnail_url) {
        const { filePath: tPath, familyId: tFam } = toStoragePath(asset.thumbnail_url)
        if (tPath && tFam) {
          try {
            const signedT = await getSignedMediaUrl(tPath, tFam)
            if (!cancelled) setSignedThumb(signedT || asset.thumbnail_url)
          } catch {
            if (!cancelled) setSignedThumb(asset.thumbnail_url)
          }
        } else {
          setSignedThumb(asset.thumbnail_url)
        }
      } else {
        setSignedThumb(null)
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [asset.url, asset.transcoded_url, asset.thumbnail_url])

  // HLS setup for m3u8 playback
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || asset.type !== 'video' || !playback) return

    // Clean up any existing hls instance
    if (hlsInstanceRef.current) {
      try { hlsInstanceRef.current.destroy() } catch {}
      hlsInstanceRef.current = null
    }

    setCanPlay(false)

    if (!playback.isHls) {
      // For MP4/WEBM (non-HLS), assign the source directly
      videoEl.src = playback.url
      return
    }

    // Safari (native HLS)
    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = playback.url
      videoEl.load()
      return
    }

    // Other browsers: use hls.js
    let cancelled = false
    ;(async () => {
      try {
        const Hls = (await import('hls.js')).default as any
        if (Hls?.isSupported && Hls.isSupported()) {
          if (cancelled) return
          const hls = new Hls()
          hlsInstanceRef.current = hls
          hls.loadSource(playback.url)
          hls.attachMedia(videoEl)
          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            console.warn('HLS error', data?.type, data?.details)
          })
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setCanPlay(true)
          })
        } else {
          setUnsupported(true)
        }
      } catch (err) {
        console.error('Failed to initialize HLS', err)
        setUnsupported(true)
      }
    })()

    return () => {
      cancelled = true
      if (hlsInstanceRef.current) {
        try { hlsInstanceRef.current.destroy() } catch {}
        hlsInstanceRef.current = null
      }
    }
  }, [asset.type, playback])

  // Handle audio duration (metadata + DB seed) and ensure metadata loads
  useEffect(() => {
    if (asset.type !== 'audio') return
    const a = audioRef.current

    const setDur = () => {
      if (a && a.duration && isFinite(a.duration) && a.duration > 0) {
        setDuration(a.duration)
      }
    }

    // Seed from metadata if available
    const seed = asset.metadata?.duration_seconds || asset.metadata?.duration || 0
    if (seed && seed > 0) setDuration(seed)

    // Force metadata load so duration is available without playback
    try {
      if (a) {
        a.preload = 'metadata'
        a.load()
      }
    } catch {}

    a?.addEventListener('loadedmetadata', setDur)
    a?.addEventListener('canplay', setDur)
    a?.addEventListener('durationchange', setDur)

    // Poll as a final fallback (handles delayed metadata in some browsers)
    let tries = 0
    const poll = setInterval(() => {
      setDur()
      if (++tries > 20 || (a && a.duration && isFinite(a.duration) && a.duration > 0)) {
        clearInterval(poll)
      }
    }, 200)

    return () => {
      clearInterval(poll)
      a?.removeEventListener('loadedmetadata', setDur)
      a?.removeEventListener('canplay', setDur)
      a?.removeEventListener('durationchange', setDur)
    }
  }, [asset.type, signedSrc])

  const handlePlayPause = () => {
    if (asset.type === 'video') {
      const v = videoRef.current
      if (!v) return
      const ready = v.readyState >= 2 || canPlay || !!v.src
      if (!ready) {
        console.warn('Video not ready to play yet')
        return
      }
      try {
        if (v.paused) {
          v.play()
        } else {
          v.pause()
        }
        setIsPlaying(!isPlaying)
      } catch (e) {
        console.error('Video play/pause failed', e)
      }
      return
    }

    if (asset.type === 'audio') {
      const a = audioRef.current
      if (!a) return
      if (a.paused) {
        a.play()
      } else {
        a.pause()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setCanPlay(true)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      videoRef.current.muted = newMuted
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
          src={signedSrc || asset.url}
          alt={asset.metadata?.file_name || 'Story image'}
          className="rounded-lg w-full object-cover max-h-[600px]"
          loading="lazy"
        />
      )

    case 'video':
      if (compact && !expanded) {
        return (
          <div 
            className="relative rounded-lg overflow-hidden cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(true)
            }}
          >
            {signedThumb ? (
              <img
                src={signedThumb}
                alt="Video thumbnail"
                className="w-full h-48 object-cover"
              />
            ) : (
              <video
                src={(signedSrc || asset.transcoded_url || asset.url)}
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
            {signedThumb ? (
              <img
                src={signedThumb}
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
                onClick={() => window.open((signedSrc || asset.transcoded_url || asset.url), '_blank')}
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

      // Custom video player
      const playable = playback
      const playableUrl = playable?.url || (asset.transcoded_url || asset.url)
      const isHls = playable?.isHls || false

      return (
        <div className="bg-secondary/50 rounded-lg overflow-hidden">
          <div className="relative aspect-video bg-black">
            <video
              key={isHls ? 'hls' : playableUrl}
               ref={videoRef}
               src={isHls ? undefined : playableUrl}
               crossOrigin="anonymous"
               poster={signedThumb || undefined}
              preload="metadata"
              playsInline
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={() => setCanPlay(true)}
              onLoadedData={() => setCanPlay(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => console.error('Video playback error', e)}
            />

            {!isPlaying && asset.thumbnail_url && (
              <button
                type="button"
                className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors"
                onClick={handlePlayPause}
                aria-label="Play video"
              >
                <div className="bg-background rounded-full p-4 shadow-lg">
                  <Play className="h-8 w-8 text-primary" fill="currentColor" />
                </div>
              </button>
            )}
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
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
              
              <div className="flex-1 space-y-1">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )


    case 'audio':
      if (compact) {
        return (
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Audio Recording</span>
              <span className="font-medium">{duration ? formatTime(duration) : '…'}</span>
            </div>
            <audio
              key={signedSrc || asset.url}
              ref={audioRef}
              src={signedSrc || asset.url}
              controls
              preload="metadata"
              crossOrigin="anonymous"
              className="w-full"
              onLoadedMetadata={() => {
                const a = audioRef.current
                if (a && a.duration && isFinite(a.duration) && a.duration > 0) {
                  setDuration(a.duration)
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )
      }

      return (
        <div className="bg-secondary/50 rounded-lg p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Audio Recording</span>
            <span className="font-medium">{duration ? formatTime(duration) : '…'}</span>
          </div>
          <audio
            key={signedSrc || asset.url}
            ref={audioRef}
            src={signedSrc || asset.url}
            controls
            preload="metadata"
            crossOrigin="anonymous"
            className="w-full"
            onLoadedMetadata={() => {
              const a = audioRef.current
              if (a && a.duration && isFinite(a.duration) && a.duration > 0) {
                setDuration(a.duration)
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {asset.metadata?.transcript && (
            <div className="mt-2 pt-2 border-t border-border">
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