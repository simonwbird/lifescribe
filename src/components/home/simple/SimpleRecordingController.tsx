import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { 
  checkMicrophonePermission, 
  isOnline, 
  getPromptTitle 
} from '@/lib/recorder/startFromPrompt'
import { CountdownModal } from './CountdownModal'
import { PermissionDeniedCard } from './PermissionDeniedCard'
import { OfflineQueueCard } from './OfflineQueueCard'
import { useAnalytics } from '@/hooks/useAnalytics'

interface SimpleRecordingControllerProps {
  profileId: string
  spaceId: string
}

export function SimpleRecordingController({ 
  profileId, 
  spaceId 
}: SimpleRecordingControllerProps) {
  const [currentPrompt, setCurrentPrompt] = useState<ElderPrompt | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [showPermissionDenied, setShowPermissionDenied] = useState(false)
  const [showOfflineQueue, setShowOfflineQueue] = useState(false)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  const handlePromptSelected = async (prompt: ElderPrompt) => {
    setCurrentPrompt(prompt)
    
    // Check if online
    if (!isOnline()) {
      setShowOfflineQueue(true)
      track('recorder.offline_queue', {
        prompt_id: prompt.id,
        prompt_kind: prompt.kind
      })
      return
    }

    // Check microphone permission
    const permission = await checkMicrophonePermission()
    
    if (permission === 'denied') {
      setShowPermissionDenied(true)
      track('recorder.permission_denied', {
        prompt_id: prompt.id,
        prompt_kind: prompt.kind
      })
      return
    }

    // Start countdown if permission granted or will be prompted
    setShowCountdown(true)
  }

  const handleCountdownComplete = () => {
    if (!currentPrompt) return
    
    setShowCountdown(false)
    
    // Navigate to story creation with prompt data
    const title = getPromptTitle(currentPrompt)
    const searchParams = new URLSearchParams({
      mode: 'voice',
      title: title,
      prompt_id: currentPrompt.id,
      prompt_text: currentPrompt.text,
      ...(currentPrompt.context?.personId && { 
        person_id: currentPrompt.context.personId 
      })
    })
    
    navigate(`/new-story?${searchParams.toString()}`)
  }

  const handlePermissionRetry = async () => {
    if (!currentPrompt) return
    
    const permission = await checkMicrophonePermission()
    if (permission !== 'denied') {
      setShowPermissionDenied(false)
      setShowCountdown(true)
    }
  }

  const handleTypeInstead = () => {
    if (!currentPrompt) return
    
    setShowPermissionDenied(false)
    
    // Navigate to text story creation
    const title = getPromptTitle(currentPrompt)
    const searchParams = new URLSearchParams({
      mode: 'text',
      title: title,
      prompt_id: currentPrompt.id,
      prompt_text: currentPrompt.text,
      ...(currentPrompt.context?.personId && { 
        person_id: currentPrompt.context.personId 
      })
    })
    
    navigate(`/new-story?${searchParams.toString()}`)
  }

  const handleOfflineProceed = () => {
    if (!currentPrompt) return
    
    setShowOfflineQueue(false)
    setShowCountdown(true)
  }

  const handleCancel = () => {
    setShowCountdown(false)
    setShowPermissionDenied(false)
    setShowOfflineQueue(false)
    setCurrentPrompt(null)
  }

  return (
    <>
      {/* Countdown Modal */}
      {currentPrompt && (
        <CountdownModal
          isOpen={showCountdown}
          prompt={currentPrompt}
          onComplete={handleCountdownComplete}
          onCancel={handleCancel}
        />
      )}

      {/* Permission Denied Card */}
      {showPermissionDenied && currentPrompt && (
        <div className="mb-6">
          <PermissionDeniedCard
            prompt={currentPrompt}
            onTryAgain={handlePermissionRetry}
            onTypeInstead={handleTypeInstead}
            onDismiss={handleCancel}
          />
        </div>
      )}

      {/* Offline Queue Card */}
      {showOfflineQueue && (
        <div className="mb-6">
          <OfflineQueueCard
            onProceed={handleOfflineProceed}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* This component manages state but renders nothing visible by default */}
      {/* The actual inspiration bar is rendered by the parent component */}
      <div 
        style={{ display: 'none' }} 
        data-controller="simple-recording"
        data-profile-id={profileId}
        data-space-id={spaceId}
        data-on-prompt-selected={handlePromptSelected}
      />
    </>
  )
}

// Export the handler for use by SimpleInspirationBar
export default SimpleRecordingController
export type { SimpleRecordingControllerProps }