import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SaveStatusBadge } from './SaveStatusBadge'
import { useSaveStatus } from '@/hooks/useSaveStatus'
import { Video, VideoOff, Camera, Upload, Loader2, RefreshCw, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VideoPanelProps {
  title: string
  content: string
  videoBlob: Blob | null
  videoUrl: string | null
  thumbnailUrl: string | null
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onVideoReady: (blob: Blob, url: string, thumbnail: string) => void
  autoStart?: boolean
}

type RecordState = 'idle' | 'countdown' | 'recording' | 'preview' | 'processing'

export function VideoPanel({
  title,
  content,
  videoBlob,
  videoUrl,
  thumbnailUrl,
  onTitleChange,
  onContentChange,
  onVideoReady,
  autoStart = false
}: VideoPanelProps) {
  const { toast } = useToast()
  const saveStatus = useSaveStatus([title, content, videoBlob !== null], 500)
  
  const [state, setState] = useState<RecordState>('idle')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [recordingTime, setRecordingTime] = useState(0)
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(videoUrl)
  const [localThumbnail, setLocalThumbnail] = useState<string | null>(thumbnailUrl)
  const [duration, setDuration] = useState(0)
  const [countdown, setCountdown] = useState(3)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const hasAutoStartedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (localVideoUrl) {
        URL.revokeObjectURL(localVideoUrl)
      }
    }
  }, [])

  // Auto-start recording when coming from a prompt
  useEffect(() => {
    if (autoStart && !hasAutoStartedRef.current && state === 'idle') {
      hasAutoStartedRef.current = true
      startRecording()
    }
  }, [autoStart])

  const generateThumbnail = async (videoElement: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth || 1280
      canvas.height = videoElement.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) resolve(URL.createObjectURL(blob))
        }, 'image/jpeg', 0.9)
      }
    })
  }

  // Load a video URL off-DOM and capture a frame (avoids relying on UI refs)
  const generateThumbnailFromUrl = async (url: string, seekSeconds = 1): Promise<{ thumb: string; duration: number }> => {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video')
      v.src = url
      v.muted = true
      v.playsInline = true
      v.preload = 'metadata'
      v.onloadedmetadata = () => {
        const targetTime = isFinite(v.duration) && v.duration > 0 ? Math.min(seekSeconds, Math.max(0, v.duration - 0.1)) : seekSeconds
        v.currentTime = targetTime
      }
      v.onseeked = async () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = v.videoWidth || 1280
          canvas.height = v.videoHeight || 720
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Canvas unsupported'))
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Thumbnail blob failed'))
            resolve({ thumb: URL.createObjectURL(blob), duration: isFinite(v.duration) ? v.duration : 0 })
          }, 'image/jpeg', 0.9)
        } catch (e) {
          reject(e as Error)
        }
      }
      v.onerror = () => reject(new Error('Video load error'))
    })
  }

  const getSupportedMimeType = (): string | undefined => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ]
    for (const t of types) {
      // @ts-ignore
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t
    }
    return undefined
  }

  const startCamera = async () => {
    try {
      console.log('Starting camera with facingMode:', facingMode)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      })
      
      console.log('Camera stream obtained:', stream.getVideoTracks())
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('Video srcObject set, playing...')
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Camera access error:', error)
      toast({
        title: 'Camera access denied',
        description: 'Please check your browser settings or upload a video file.',
        variant: 'destructive'
      })
    }
  }

  const toggleCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode },
        audio: true
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch (error) {
      console.error('Camera toggle error:', error)
    }
  }

  // Countdown timer
  useEffect(() => {
    if (state === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (state === 'countdown' && countdown === 0) {
      // Start recording when countdown reaches 0
      actuallyStartRecording()
    }
  }, [state, countdown])

  // Ensure the stream attaches when the recording view renders
  useEffect(() => {
    if ((state === 'recording' || state === 'countdown') && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [state])

  const startRecording = async () => {
    // Start countdown first
    setState('countdown')
    setCountdown(3)
    setRecordingTime(0)

    // Start camera so user sees themselves during countdown
    await startCamera()
  }

  const actuallyStartRecording = async () => {
    if (!streamRef.current) return

    setState('recording')
    chunksRef.current = []

    const mimeType = getSupportedMimeType()
    let mediaRecorder: MediaRecorder
    try {
      mediaRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    } catch (e) {
      // Fallback to default
      // @ts-ignore
      mediaRecorder = new MediaRecorder(streamRef.current)
    }

    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      setState('processing')

      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      setLocalVideoUrl(url)

      try {
        const { thumb, duration } = await generateThumbnailFromUrl(url, 1)
        setDuration(duration)
        setLocalThumbnail(thumb)
        setState('preview')
        onVideoReady(blob, url, thumb)
      } catch (e) {
        console.error('Thumbnail generation failed', e)
        setState('preview')
        onVideoReady(blob, url, '')
      }

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }

    mediaRecorder.start()

    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload .mp4, .mov, or .webm',
        variant: 'destructive'
      })
      return
    }
    
    setState('processing')
    
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })
    const url = URL.createObjectURL(blob)
    setLocalVideoUrl(url)
    
    try {
      const { thumb, duration } = await generateThumbnailFromUrl(url, 1)
      setDuration(duration)
      setLocalThumbnail(thumb)
      setState('preview')
      onVideoReady(blob, url, thumb)
    } catch (e) {
      console.error('Thumbnail generation failed', e)
      setState('preview')
      onVideoReady(blob, url, '')
    }
  }

  const changeThumbnail = async () => {
    if (previewVideoRef.current && localVideoUrl) {
      const thumb = await generateThumbnail(previewVideoRef.current)
      setLocalThumbnail(thumb)
      
      if (videoBlob) {
        onVideoReady(videoBlob, localVideoUrl, thumb)
      }
      
      toast({
        title: 'Thumbnail updated',
        description: 'Thumbnail captured from current frame'
      })
    }
  }

  const reset = () => {
    setState('idle')
    setLocalVideoUrl(null)
    setLocalThumbnail(null)
    setRecordingTime(0)
    setDuration(0)
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Video Story</h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Video Recording <span className="text-destructive">*</span>
        </label>

        {state === 'idle' && (
          <div className="space-y-4">
            <Button
              type="button"
              size="lg"
              onClick={startRecording}
              className="w-full h-20"
            >
              <Video className="h-6 w-6 mr-2" />
              Start Recording
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <label className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Upload Video File</span>
                <span className="text-xs text-muted-foreground">.mp4, .mov, .webm</span>
              </div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {state === 'countdown' && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-9xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={toggleCamera}
                className="absolute top-4 right-4"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">Get ready...</p>
          </div>
        )}

        {state === 'recording' && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={toggleCamera}
                className="absolute top-4 right-4"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="w-full"
            >
              <VideoOff className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          </div>
        )}

        {state === 'processing' && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <p className="text-sm text-muted-foreground">Processing video and generating thumbnail...</p>
          </div>
        )}

        {state === 'preview' && localVideoUrl && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Video ready</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {formatTime(duration)} • Thumbnail generated
                </p>
              </div>
            </div>

            <video
              ref={previewVideoRef}
              controls
              src={localVideoUrl}
              className="w-full rounded-lg"
            />

            {localThumbnail && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail Preview</label>
                <div className="relative">
                  <img
                    src={localThumbnail}
                    alt="Video thumbnail"
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={changeThumbnail}
                    className="absolute bottom-2 right-2"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Change Thumbnail
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seek to desired frame and click "Change Thumbnail"
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="w-full"
            >
              Record New Video
            </Button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          placeholder="Give your video story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Description
        </label>
        <Textarea
          id="content"
          placeholder="Add a description or caption..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          className="resize-none"
        />
      </div>
    </div>
  )
}
