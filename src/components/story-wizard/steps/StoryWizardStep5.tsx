import { Button } from '@/components/ui/button'
import { Mic, Upload, Play, Pause, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { type StoryFormData } from '../StoryWizardTypes'

interface StoryWizardStep5Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onNext: () => void
  onPrevious?: () => void
  isVoiceFirst?: boolean
}

export default function StoryWizardStep5({ 
  formData, 
  onChange, 
  onNext, 
  onPrevious,
  isVoiceFirst = false
}: StoryWizardStep5Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2 flex items-center gap-2">
          <Mic className="h-6 w-6" />
          Voice Recording
        </h2>
        <p className="text-muted-foreground">
          Record your voice telling the story, or upload an existing audio recording. 
          Your voice adds personal touch that brings memories to life.
        </p>
      </div>

      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="bg-muted/30 rounded-lg p-6">
          {!audioUrl ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'border-red-500 bg-red-50 animate-pulse' 
                    : 'border-brand-green bg-brand-green/10'
                }`}>
                  <Mic className={`h-8 w-8 ${isRecording ? 'text-red-500' : 'text-brand-green'}`} />
                </div>
              </div>

              <div>
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Audio File
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isPlaying ? pauseAudio : playAudio}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteRecording}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration)
                  }
                }}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime)
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                className="w-full"
                controls
              />

              <div className="bg-brand-green/5 border border-brand-green/20 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 text-brand-green">
                  Recording ready!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your voice recording is captured. You can now continue to add the story details.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recording Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2 text-blue-800">
            Recording Tips
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Find a quiet space for clear audio</li>
            <li>• Speak clearly and at a natural pace</li>
            <li>• Share the story as if talking to family</li>
            <li>• Include details about who, what, when, and where</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {!isVoiceFirst && onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            Back to Media
          </Button>
        )}
        {isVoiceFirst && <div />} {/* Spacer for voice-first mode */}
        <Button 
          onClick={onNext}
          className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
          disabled={!audioUrl}
        >
          {isVoiceFirst ? 'Continue to Basics' : 'Continue to Review'}
        </Button>
      </div>
    </div>
  )
}