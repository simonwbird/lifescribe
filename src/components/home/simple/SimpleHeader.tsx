import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import TodaysPromptCard from '@/components/prompts/TodaysPromptCard'
import ContinueSection from '@/components/prompts/ContinueSection'
import { useTodaysPrompt, useInProgressPrompts } from '@/hooks/useTodaysPrompt'
import { useUserStreak } from '@/hooks/useUserStreak'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { AudioConfirmDialog } from '@/components/audio/AudioConfirmDialog'
import { Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { markCompleted } from '@/services/promptStatusService'

interface SimpleHeaderProps {
  profileId: string
  spaceId: string
  onRecordPrompt: (prompt: ElderPrompt) => void
  persona?: string
}

export function SimpleHeader({ 
  profileId, 
  spaceId, 
  onRecordPrompt,
  persona = 'general'
}: SimpleHeaderProps) {
  const { data: todaysPrompt, isLoading: todaysLoading, refetch } = useTodaysPrompt(spaceId)
  const { data: inProgressPrompts = [], isLoading: inProgressLoading } = useInProgressPrompts(spaceId)
  const { data: streakData } = useUserStreak(profileId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const loading = todaysLoading || inProgressLoading

  const handleRespondToPrompt = (instanceId: string) => {
    const instance = todaysPrompt
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        family_id: spaceId
      })
      navigate(`/capture/story-wizard?${searchParams.toString()}`)
    }
  }

  const handleRecordPrompt = (instanceId: string) => {
    const instance = todaysPrompt
    if (instance?.prompt && onRecordPrompt) {
      onRecordPrompt({
        id: instance.prompt.id,
        text: instance.prompt.body,
        kind: 'general' as const
      })
    }
  }

  const handleBrowseAll = () => {
    navigate('/prompts/hub')
  }

  const handleContinuePrompt = (instanceId: string) => {
    const instance = inProgressPrompts.find(p => p.id === instanceId)
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        family_id: spaceId
      })
      navigate(`/capture/story-wizard?${searchParams.toString()}`)
    }
  }

  const handlePromptClick = (promptInstance: any) => {
    const searchParams = new URLSearchParams({
      type: 'audio',
      promptTitle: promptInstance.prompt?.title || '',
      prompt_id: promptInstance.id,
      prompt_text: promptInstance.prompt?.body || ''
    })
    
    navigate(`/stories/new?${searchParams.toString()}`)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        setRecordedBlob(blob)
        setShowConfirmDialog(true)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)

      toast({
        title: "Recording started",
        description: "Speak clearly. Tap 'Stop' when done.",
      })
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast({
        title: 'Recording Failed',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleKeepRecording = async () => {
    setShowConfirmDialog(false)
    // Store audio in session storage for the form to pick up
    if (recordedBlob) {
      try {
        // Convert blob to base64
        const reader = new FileReader()
        reader.readAsDataURL(recordedBlob)
        reader.onloadend = () => {
          sessionStorage.setItem('pendingAudioRecording', reader.result as string)
          sessionStorage.setItem('pendingAudioDuration', '0') // Duration tracking can be added later
          navigate('/stories/new?type=voice&hasRecording=true')
        }
      } catch (error) {
        console.error('Error storing audio:', error)
        navigate('/stories/new?type=voice')
      }
    } else {
      navigate('/stories/new?type=voice')
    }
  }

  const handleDiscardRecording = () => {
    setRecordedBlob(null)
    setShowConfirmDialog(false)
    toast({
      title: "Recording discarded",
      description: "Try again when you're ready.",
    })
  }

  const handleShuffle = async () => {
    try {
      // If a prompt is showing, mark it completed so the next one becomes default
      if (todaysPrompt?.id) {
        await markCompleted(todaysPrompt.id)
      }

      // Refetch to get the latest available prompts
      await refetch()
      
      // Get all open prompts for shuffling
      const { data: openPrompts, error } = await supabase
        .from('prompt_instances')
        .select(`
          id,
          status,
          person_ids,
          due_at,
          created_at,
          updated_at,
          prompt:prompts(
            id,
            title,
            body,
            category
          )
        `)
        .eq('family_id', spaceId)
        .eq('status', 'open')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (openPrompts && openPrompts.length === 0) {
        toast({
          title: "Marked as completed",
          description: "All prompts done for now. 🎉",
        })
        return
      }
      
      if (openPrompts && openPrompts.length > 0) {
        // Pick the first open (oldest) as the new default
        const next = openPrompts[0]
        queryClient.setQueryData(['todays-prompt', spaceId], next)
        toast({
          title: "Marked as completed",
          description: "Loaded your next prompt.",
        })
      }
    } catch (error) {
      console.error('Error shuffling prompt:', error)
      toast({
        title: "Couldn't shuffle",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const showStreak = persona !== 'guest' && streakData && streakData.current_streak > 0

  return (
    <>
      <div className="w-full mb-8 space-y-6">
        {/* Streak Chip - shown under headline */}
        {showStreak && (
          <div className="flex justify-center -mt-2 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <span className="text-sm font-medium">
                Day {streakData.current_streak} • Keep your streak 🔥
              </span>
            </div>
          </div>
        )}

        <TodaysPromptCard 
          promptInstance={todaysPrompt}
          onRespond={handleRespondToPrompt}
          onBrowseAll={handleBrowseAll}
          onShuffle={handleShuffle}
          loading={loading}
          persona={persona}
        />
        
        <ContinueSection 
          instances={inProgressPrompts}
          onContinue={handleContinuePrompt}
        />

        {/* Large Quick Record Button - Elder-friendly */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "h-20 w-full max-w-md text-xl font-bold shadow-lg transition-all",
              isRecording 
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isRecording ? (
              <>
                <Square className="h-8 w-8 mr-3" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-8 w-8 mr-3" />
                Quick Record
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Audio Confirmation Dialog */}
      <AudioConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        audioBlob={recordedBlob}
        onKeep={handleKeepRecording}
        onDiscard={handleDiscardRecording}
      />

      {/* Persistent Recording Bar (shows when recording) */}
      {isRecording && (
        <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-6 shadow-2xl z-50 border-t-4 border-destructive-foreground/20">
          <div className="container mx-auto flex items-center justify-between max-w-4xl">
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 bg-destructive-foreground rounded-full animate-pulse" />
              <span className="text-xl font-semibold">Recording in progress...</span>
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={stopRecording}
              className="h-14 px-8 text-lg font-semibold bg-background text-foreground hover:bg-background/90"
            >
              <Square className="h-6 w-6 mr-2" />
              Stop & Save
            </Button>
          </div>
        </div>
      )}
    </>
  )
}