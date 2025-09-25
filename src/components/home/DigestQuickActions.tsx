import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Send, 
  Settings, 
  Users, 
  Calendar,
  BarChart3,
  Zap
} from 'lucide-react'

interface DigestQuickActionsProps {
  onPreviewDigest: () => void
  onSendTest: () => void
  onCustomizeContent: () => void
  onManageRecipients: () => void
  onViewMetrics?: () => void
  sendingTest: boolean
  recipientCount: number | string
  nextDigestDate?: string
  className?: string
}

export default function DigestQuickActions({
  onPreviewDigest,
  onSendTest,
  onCustomizeContent,
  onManageRecipients,
  onViewMetrics,
  sendingTest,
  recipientCount,
  nextDigestDate,
  className
}: DigestQuickActionsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-xs h-9 font-medium"
          onClick={onPreviewDigest}
        >
          <Eye className="h-4 w-4" />
          <span>Preview Digest</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-xs h-9 font-medium"
          onClick={onSendTest}
          disabled={sendingTest}
        >
          <Send className="h-4 w-4" />
          <span>{sendingTest ? 'Sending...' : 'Send Test Copy'}</span>
        </Button>
      </div>
      
      {/* Secondary Actions */}
      <div className="space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-xs h-8"
          onClick={onCustomizeContent}
        >
          <Settings className="h-4 w-4" />
          <span>Customize content</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-xs h-8"
          onClick={onManageRecipients}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Manage recipients</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {recipientCount}
          </Badge>
        </Button>

        {onViewMetrics && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-xs h-8"
            onClick={onViewMetrics}
          >
            <BarChart3 className="h-4 w-4" />
            <span>View detailed metrics</span>
          </Button>
        )}
      </div>

      {/* Status Info */}
      <div className="pt-2 border-t space-y-1">
        {nextDigestDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Next digest: {nextDigestDate}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>
            All features are live and ready to use
          </span>
        </div>
      </div>
    </div>
  )
}