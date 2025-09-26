import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Mic, Square, Pause, Play, Camera, MicOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RecordingGuidanceProps {
  isRecording: boolean
  recordingType: 'audio' | 'video'
  duration: number // in seconds
  isPaused?: boolean
  onStop: () => void
  onPause?: () => void
  onResume?: () => void
  maxDuration?: number // in seconds, default 300 (5 minutes)
}

export function RecordingGuidance({
  isRecording,
  recordingType,
  duration,
  isPaused = false,
  onStop,
  onPause,
  onResume,
  maxDuration = 300
}: RecordingGuidanceProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false)

  useEffect(() => {
    if (isRecording && !isPaused) {
      setPulseAnimation(true)
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setPulseAnimation(false)
    }
  }, [isRecording, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = (duration / maxDuration) * 100

  if (!isRecording) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          {/* Recording Status */}
          <div className="space-y-4">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
              isPaused 
                ? 'bg-yellow-100 border-4 border-yellow-400' 
                : 'bg-red-100 border-4 border-red-400'
            } ${pulseAnimation && !isPaused ? 'animate-pulse' : ''}`}>
              {isPaused ? (
                <Pause className="w-8 h-8 text-yellow-600" />
              ) : recordingType === 'video' ? (
                <Camera className="w-8 h-8 text-red-600" />
              ) : (
                <Mic className="w-8 h-8 text-red-600" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {isPaused 
                  ? 'Recording Paused' 
                  : `Recording ${recordingType === 'video' ? 'Video' : 'Audio'}`
                }
              </h2>
              <p className="text-lg text-muted-foreground">
                {isPaused 
                  ? 'Tap Resume when ready to continue'
                  : 'Tell your story naturally - no need to be perfect'
                }
              </p>
            </div>
          </div>

          {/* Progress and Time */}
          <div className="space-y-4">
            <div className="text-3xl font-mono font-bold">
              {formatTime(duration)}
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={progressPercentage} 
                className="h-3"
                aria-label={`Recording progress: ${formatTime(duration)} of ${formatTime(maxDuration)}`}
              />
              <p className="text-sm text-muted-foreground">
                {formatTime(maxDuration - duration)} remaining
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            {isPaused ? (
              <Button
                onClick={onResume}
                size="lg"
                className="h-14 px-8 text-lg font-bold bg-green-600 hover:bg-green-700"
              >
                <Play className="w-6 h-6 mr-3" />
                Resume Recording
              </Button>
            ) : (
              onPause && (
                <Button
                  onClick={onPause}
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg font-bold border-2"
                >
                  <Pause className="w-6 h-6 mr-3" />
                  Pause
                </Button>
              )
            )}

            <Button
              onClick={onStop}
              variant="destructive"
              size="lg"
              className="h-14 px-8 text-lg font-bold"
            >
              <Square className="w-6 h-6 mr-3" />
              Stop & Save
            </Button>
          </div>

          {/* Helpful Tips */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Speak clearly and take your time. You can always pause if you need a moment to think.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}