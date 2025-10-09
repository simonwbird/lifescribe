import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Lock, Eye } from 'lucide-react'
import { EventRole } from '@/lib/eventAclService'

interface EventPermissionBannerProps {
  role: EventRole | null
  action: 'contribute' | 'comment' | 'upload'
}

export const EventPermissionBanner: React.FC<EventPermissionBannerProps> = ({ role, action }) => {
  if (role === 'contributor') {
    // Contributors have all permissions
    return null
  }

  const getActionLabel = () => {
    switch (action) {
      case 'contribute':
        return 'contribute to this event'
      case 'comment':
        return 'add comments'
      case 'upload':
        return 'upload photos or videos'
      default:
        return 'perform this action'
    }
  }

  const getMessage = () => {
    if (role === 'guest' || role === null) {
      return {
        title: 'Approval Required',
        description: `You need contributor approval to ${getActionLabel()}. Contact an event organizer to request access.`,
        icon: Lock
      }
    }
    
    if (role === 'viewer' && (action === 'contribute' || action === 'upload')) {
      return {
        title: 'View-Only Access',
        description: `You have view-only permissions and cannot ${getActionLabel()}. You can still add comments.`,
        icon: Eye
      }
    }

    return null
  }

  const message = getMessage()
  
  if (!message) return null

  const Icon = message.icon

  return (
    <Alert variant="default" className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
      <Icon className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        {message.title}
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        {message.description}
      </AlertDescription>
    </Alert>
  )
}
