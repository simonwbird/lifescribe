import { Check, Save, AlertCircle, Clock } from 'lucide-react'
import { AutosaveStatus } from '@/hooks/useDraftManager'
import { format } from 'date-fns'

interface AutosaveIndicatorProps {
  status: AutosaveStatus
  className?: string
}

export function AutosaveIndicator({ status, className = "" }: AutosaveIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <Save className="w-4 h-4 animate-pulse" />,
          text: 'Saving draft...',
          className: 'text-blue-600 bg-blue-50 border-blue-200'
        }
      
      case 'saved':
        return {
          icon: <Check className="w-4 h-4" />,
          text: status.lastSaved 
            ? `Saved ${format(status.lastSaved, 'h:mm a')}`
            : 'Draft saved',
          className: 'text-green-600 bg-green-50 border-green-200'
        }
      
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Save failed',
          className: 'text-red-600 bg-red-50 border-red-200'
        }
      
      case 'idle':
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Auto-saving enabled',
          className: 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }
  }

  const { icon, text, className: statusClassName } = getStatusDisplay()

  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
      transition-all duration-300 ease-in-out
      ${statusClassName}
      ${className}
    `}>
      {icon}
      <span>{text}</span>
    </div>
  )
}