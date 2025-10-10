import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, PenLine, Shuffle, Volume2, Loader2, Check, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { ListenButton } from './ListenButton'
import { cn } from '@/lib/utils'
import { PersonaType, getPersonaConfig, interpolateHeadline } from '@/config/personaConfig'
import { useUserPersona } from '@/hooks/useUserPersona'

interface Prompt {
  id: string
  text: string
  category?: string
  duration?: string
}

interface FirstLoginPromptCardProps {
  prompt: Prompt
  onShuffle: () => void
  profileId: string
  familyId: string
  persona?: PersonaType
}

type RecordingState = 'idle' | 'preflight' | 'countdown' | 'recording' | 'saving' | 'saved'

export function FirstLoginPromptCard({
  prompt,
  onShuffle,
  profileId,
  familyId,
  persona = 'elder'
}: FirstLoginPromptCardProps) {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [recordingDuration, setRecordingDuration] = useState(0)

  // Fetch user profile for first name and persona
  const { data: userProfile } = useUserPersona(profileId)
  
  // Get persona config
  const personaConfig = getPersonaConfig(persona)
  const firstName = userProfile?.first_name
  const headline = interpolateHeadline(personaConfig.headline, firstName)
  const fontSizeClass = personaConfig.fontScale === 'lg' ? 'text-2xl sm:text-3xl' : 
                       personaConfig.fontScale === 'xl' ? 'text-3xl sm:text-4xl' : 
                       'text-xl sm:text-2xl'

  // Track impression on mount
  useEffect(() => {
    track({
      event_name: 'first_prompt_impression',
      properties: {
        prompt_id: prompt.id,
        persona
      }
    } as any)
  }, [prompt.id, persona])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (e.key === 'r' || e.key === 'R') {
        if (recordingState === 'idle') {
          handleStartRecording()
        } else if (recordingState === 'recording') {
          handleStopRecording()
        }
      } else if (e.key === 'l' || e.key === 'L') {
        // Listen handled by ListenButton
      } else if (e.key === 's' || e.key === 'S') {
        if (recordingState === 'recording') {
          handleStopRecording()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [recordingState])

  // Countdown timer
  useEffect(() => {
    if (recordingState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (recordingState === 'countdown' && countdown === 0) {
      setRecordingState('recording')
      track({
        event_name: 'first_prompt_record_start',
        properties: {
          prompt_id: prompt.id,
          persona
        }
      } as any)
    }
  }, [recordingState, countdown])

  // Recording duration timer
  useEffect(() => {
    if (recordingState === 'recording') {
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [recordingState])

  const handleStartRecording = async () => {
    setRecordingState('preflight')
    
    try {
      // Check microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setRecordingState('countdown')
      setCountdown(3)
    } catch (error) {
      console.error('Microphone access denied:', error)
      // Fallback to text mode
      handleWriteInstead()
    }
  }

  const handleStopRecording = () => {
    setRecordingState('saving')
    
    // Navigate to new story page with recording data
    setTimeout(() => {
      track({
        event_name: 'first_prompt_record_complete',
        properties: {
          prompt_id: prompt.id,
          duration: recordingDuration,
          persona
        }
      } as any)
      
      navigate(`/new-story?familyId=${familyId}&mode=voice&promptId=${prompt.id}&promptText=${encodeURIComponent(prompt.text)}`)
    }, 500)
  }

  const handleWriteInstead = () => {
    track({
      event_name: 'first_prompt_write_instead',
      properties: {
        prompt_id: prompt.id,
        persona
      }
    } as any)
    
    navigate(`/new-story?familyId=${familyId}&mode=text&promptId=${prompt.id}&promptText=${encodeURIComponent(prompt.text)}`)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isRecordingActive = recordingState === 'countdown' || recordingState === 'recording'

  return (
    <Card className="w-full border-2 hover:border-primary/20 transition-all">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Today's Prompt</h2>
            
            <div className="flex items-center gap-2">
              {personaConfig.chips?.map((chip, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {chip}
                </Badge>
              ))}
              
              {recordingState === 'saved' && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              )}
            </div>
          </div>
          
          <h3 className={cn("font-semibold leading-tight", fontSizeClass)}>
            {headline}
          </h3>
          
          {personaConfig.subtext && !isRecordingActive && recordingState === 'idle' && (
            <p className="text-sm text-muted-foreground">
              {personaConfig.subtext}
            </p>
          )}
        </div>

        {/* Prompt Text */}
        <div className="space-y-3">
          <p className={cn("leading-relaxed text-foreground", fontSizeClass)}>
            {prompt.text}
          </p>
          
          {/* Template chips for archivist */}
          {personaConfig.templateChips && recordingState === 'idle' && (
            <div className="flex flex-wrap gap-2">
              {personaConfig.templateChips.map((template, idx) => (
                <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-accent">
                  {template}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Recording States */}
        {recordingState === 'countdown' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-6xl font-bold text-primary animate-pulse">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Get ready...</p>
          </div>
        )}

        {recordingState === 'recording' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-2xl font-mono font-semibold">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            
            {/* Simple waveform visualization */}
            <div className="flex items-center gap-1 h-12">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            
            {/* Live transcript if enabled */}
            {personaConfig.liveTranscript && (
              <div className="w-full p-3 bg-accent/50 rounded-lg">
                <p className="text-sm text-muted-foreground italic">
                  Live transcript coming soon...
                </p>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Press R or click Stop when done
            </p>
          </div>
        )}

        {recordingState === 'saving' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Saving your story...</p>
          </div>
        )}

        {/* Controls */}
        {!isRecordingActive && recordingState !== 'saving' && recordingState !== 'saved' && (
          <div className="space-y-3">
            {/* Primary Action - adapts to persona */}
            {personaConfig.defaultMode === 'choice' ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="h-14 text-lg font-semibold"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Voice
                </Button>
                <Button
                  onClick={handleWriteInstead}
                  size="lg"
                  variant="outline"
                  className="h-14 text-lg font-semibold"
                >
                  <PenLine className="w-5 h-5 mr-2" />
                  Text
                </Button>
              </div>
            ) : personaConfig.defaultMode === 'text' ? (
              <Button
                onClick={handleWriteInstead}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
              >
                <PenLine className="w-5 h-5 mr-2" />
                {personaConfig.ctaText || 'Start Typing'}
              </Button>
            ) : (
              <Button
                onClick={handleStartRecording}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                disabled={recordingState === 'preflight'}
              >
                {recordingState === 'preflight' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Checking microphone...
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    {personaConfig.ctaText || 'Start Recording'} (R)
                  </>
                )}
              </Button>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-2">
              {personaConfig.defaultMode !== 'choice' && (
                <Button
                  onClick={personaConfig.defaultMode === 'text' ? handleStartRecording : handleWriteInstead}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12"
                >
                  {personaConfig.defaultMode === 'text' ? (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      {personaConfig.secondaryCtaText || 'Record Voice'}
                    </>
                  ) : (
                    <>
                      <PenLine className="w-4 h-4 mr-2" />
                      {personaConfig.secondaryCtaText || 'Write Instead'}
                    </>
                  )}
                </Button>
              )}

              <ListenButton
                text={prompt.text}
                promptId={prompt.id}
                size="lg"
                className="h-12 px-4"
                showLabel
              />

              <Button
                onClick={onShuffle}
                variant="outline"
                size="lg"
                className="h-12 w-12 p-0"
                aria-label="Shuffle prompt"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {recordingState === 'recording' && (
          <Button
            onClick={handleStopRecording}
            size="lg"
            variant="destructive"
            className="w-full h-14 text-lg font-semibold"
          >
            Stop & Save (S)
          </Button>
        )}

        {/* Privacy Cue - prominent for teen persona */}
        <div className={cn(
          "flex items-center justify-center gap-2 text-sm pt-2 border-t",
          personaConfig.privacyToggle === 'prominent' 
            ? "text-foreground font-medium" 
            : "text-muted-foreground"
        )}>
          <Lock className={cn(
            "w-3 h-3",
            personaConfig.privacyToggle === 'prominent' && "text-primary"
          )} />
          <span>Private by default. You choose who sees it.</span>
        </div>
      </CardContent>
    </Card>
  )
}
