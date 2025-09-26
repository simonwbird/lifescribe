import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AutosaveStatus } from '@/hooks/useDraftManager'

interface DraftProgressBannerProps {
  autosaveStatus: AutosaveStatus
  onDismiss?: () => void
  className?: string
}

export function DraftProgressBanner({ autosaveStatus, onDismiss, className }: DraftProgressBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldAutoHide, setShouldAutoHide] = useState(false)

  useEffect(() => {
    if (autosaveStatus.status === 'saved') {
      setIsVisible(true)
      setShouldAutoHide(true)
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setShouldAutoHide(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    } else if (autosaveStatus.status === 'saving') {
      setIsVisible(true)
      setShouldAutoHide(false)
    } else if (autosaveStatus.status === 'error') {
      setIsVisible(true)
      setShouldAutoHide(false)
    } else {
      setIsVisible(false)
      setShouldAutoHide(false)
    }
  }, [autosaveStatus])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const getStatusIcon = () => {
    switch (autosaveStatus.status) {
      case 'saving':
        return <Save className="h-4 w-4 animate-pulse text-blue-600" />
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (autosaveStatus.status) {
      case 'saving':
        return 'Saving your progress...'
      case 'saved':
        return 'Your progress is saved'
      case 'error':
        return 'Failed to save - please try again'
      default:
        return autosaveStatus.message
    }
  }

  const getBannerColor = () => {
    switch (autosaveStatus.status) {
      case 'saving':
        return 'border-blue-200 bg-blue-50 text-blue-900'
      case 'saved':
        return 'border-green-200 bg-green-50 text-green-900'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-900'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-900'
    }
  }

  return (
    <Card className={`fixed top-4 right-4 z-50 p-3 transition-all duration-300 ${getBannerColor()} ${className || ''}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {getStatusMessage()}
          </p>
          {autosaveStatus.lastSaved && (
            <p className="text-xs opacity-75">
              Last saved: {autosaveStatus.lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        {!shouldAutoHide && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}