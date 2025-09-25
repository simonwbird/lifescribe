import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Video, Upload, Play, Pause, Trash2, RotateCcw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { type StoryFormData } from '../StoryWizardTypes'

interface StoryWizardStep6Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onNext: () => void
  onPrevious?: () => void
  isVideoFirst?: boolean
}

export default function StoryWizardStep6({ 
  formData, 
  onChange, 
  onNext, 
  onPrevious,
  isVideoFirst = false
}: StoryWizardStep6Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      })
      
      streamRef.current = stream
      chunksRef.current = []
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(videoBlob)
        setVideoUrl(url)
        onChange({ videoBlob })
        
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }
      
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting video recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      onChange({ videoBlob: file })
    }
  }

  const deleteRecording = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    onChange({ videoBlob: undefined })
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const canContinue = videoUrl || formData.videoBlob

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          {isVideoFirst ? 'Record Your Video Story' : 'Add a Video (Optional)'}
        </h2>
        <p className="text-muted-foreground">
          Record a video message or upload one from your device
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Video Recording</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {!videoUrl && !isRecording && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Video className="h-5 w-5" />
                  {isVideoFirst ? 'Tap to Start Recording' : 'Record Video'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={switchCamera}
                >
                  <RotateCcw className="h-4 w-4" />
                  {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
                </Button>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="video-upload"
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                  asChild
                >
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Upload Video File
                  </label>
                </Button>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <div className="w-16 h-16 mx-auto bg-red-600 rounded-full flex items-center justify-center">
                  <Video className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="text-lg font-medium">Recording...</p>
              <Button
                onClick={stopRecording}
                variant="outline"
                size="lg"
              >
                Stop Recording
              </Button>
            </div>
          )}

          {videoUrl && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-64 object-contain"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      setDuration(videoRef.current.duration)
                    }
                  }}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime)
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                  className="gap-2"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteRecording}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-4">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={isVideoFirst && !canContinue}
          className="ml-auto"
        >
          {isVideoFirst ? 'Continue' : 'Next'}
        </Button>
      </div>
    </div>
  )
}