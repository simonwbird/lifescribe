import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Send, 
  Trash2, 
  Volume2,
  Sparkles,
  Clock,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useActionFeedback } from './ActionFeedback'
import GuidedHelpOverlay from './GuidedHelpOverlay'
import { useConfetti } from '@/hooks/useConfetti'

interface EnhancedVoiceRecordingProps {
  open: boolean
  onClose: () => void
  onRecordingCreated?: (recordingId: string) => void
}

export default function EnhancedVoiceRecording({ 
  open, 
  onClose, 
  onRecordingCreated 
}: EnhancedVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const { toast } = useToast()
  const { showSending, showSuccess, FeedbackComponent } = useActionFeedback()
  const { celebrateSuccess } = useConfetti()

  useEffect(() => {
    if (open && !hasRecorded) {
      // Show guide for first-time users
      const hasSeenGuide = localStorage.getItem('voice-recording-guide-seen')
      if (!hasSeenGuide) {
        setShowGuide(true)
      }
    }
  }, [open, hasRecorded])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType 
        })
        setRecordedBlob(blob)
        setHasRecorded(true)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        toast({
          title: "Recording complete! 🎤",
          description: "Tap play to listen or record again if needed.",
        })
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { // Max 2 minutes
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      
      toast({
        title: "Recording started! 🔴",
        description: "Speak clearly. Tap stop when finished.",
      })
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording failed 😔",
        description: "Please allow microphone access and try again.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (!recordedBlob) return
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    const audio = new Audio(URL.createObjectURL(recordedBlob))
    audioRef.current = audio
    
    audio.onended = () => {
      setIsPlaying(false)
    }
    
    audio.play()
    setIsPlaying(true)
    
    toast({
      title: "Playing recording 🔊",
      description: "Listen to your voice message!",
      duration: 2000
    })
  }

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    toast({
      title: "Recording deleted 🗑️",
      description: "Ready to record a new message!",
    })
  }

  const sendRecording = async () => {
    if (!recordedBlob) return
    
    setIsProcessing(true)
    showSending("Sending your voice message...")
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      celebrateSuccess()
      showSuccess("Voice message sent! 🎉", true)
      
      if (onRecordingCreated) {
        onRecordingCreated('voice-recording-' + Date.now())
      }
      
      setTimeout(() => {
        onClose()
        setRecordedBlob(null)
        setRecordingTime(0)
        setHasRecorded(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error sending recording:', error)
      toast({
        title: "Sending failed 😔",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleGuideComplete = () => {
    setShowGuide(false)
    localStorage.setItem('voice-recording-guide-seen', 'true')
  }

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <Mic className="w-5 h-5 text-white" />
              </div>
              Voice Message 🎤
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Recording Status */}
            <div className="text-center space-y-3">
              {isRecording && (
                <div className="animate-pulse">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-3 animate-bounce">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="destructive" className="animate-pulse text-lg px-4 py-2">
                    🔴 RECORDING
                  </Badge>
                </div>
              )}
              
              {!isRecording && !recordedBlob && (
                <div className="space-y-3">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center hover-scale">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 font-medium">Ready to record your voice message!</p>
                </div>
              )}
              
              {recordedBlob && (
                <div className="space-y-3">
                  <div className={cn(
                    "w-20 h-20 mx-auto rounded-full flex items-center justify-center hover-scale transition-all duration-300",
                    isPlaying 
                      ? "bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" 
                      : "bg-gradient-to-r from-gray-500 to-gray-600"
                  )}>
                    <Volume2 className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 px-4 py-2">
                    ✅ Recording ready!
                  </Badge>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/60 rounded-full px-4 py-2 border">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className={cn(
                  "font-bold text-lg",
                  isRecording ? "text-red-600 animate-pulse" : "text-gray-700"
                )}>
                  {formatTime(recordingTime)}
                </span>
                <span className="text-xs text-gray-500">/ 2:00</span>
              </div>
              
              {isRecording && (
                <Progress 
                  value={(recordingTime / 120) * 100} 
                  className="mt-3 h-2 bg-red-100" 
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              {!isRecording && !recordedBlob && (
                <>
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-xl hover-scale font-bold"
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowGuide(true)}
                    className="hover-scale border-2"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </>
              )}
              
              {isRecording && (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-xl hover-scale font-bold animate-pulse"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              {recordedBlob && (
                <div className="flex gap-2">
                  <Button
                    onClick={isPlaying ? pausePlayback : playRecording}
                    variant="outline"
                    className="hover-scale border-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  
                  <Button
                    onClick={deleteRecording}
                    variant="outline"
                    className="hover-scale border-2 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  
                  <Button
                    onClick={sendRecording}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-xl hover-scale font-bold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Sending...' : 'Send Message! 🚀'}
                  </Button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5 animate-pulse" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800 mb-1">💡 Pro Tips:</p>
                  <ul className="text-yellow-700 space-y-1 text-xs">
                    <li>• Find a quiet spot for best quality</li>
                    <li>• Speak clearly and close to your device</li>
                    <li>• You can re-record if you're not happy!</li>
                    <li>• Max recording time is 2 minutes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guided Help Overlay */}
      <GuidedHelpOverlay
        type="voice"
        isVisible={showGuide}
        onDismiss={handleGuideComplete}
      />

      {/* Action Feedback */}
      {FeedbackComponent}
    </>
  )
}