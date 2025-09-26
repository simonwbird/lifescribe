import { Shield, Lock, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface PrivacyBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'minimal'
  showInfo?: boolean
  className?: string
}

export function PrivacyBadge({ 
  size = 'sm', 
  variant = 'default',
  showInfo = true,
  className 
}: PrivacyBadgeProps) {
  const content = (
    <div className="flex items-center gap-1.5">
      <Shield className={cn(
        "text-green-600",
        size === 'sm' && "h-3 w-3",
        size === 'md' && "h-4 w-4", 
        size === 'lg' && "h-5 w-5"
      )} />
      <span className="font-medium">Private by default</span>
      {showInfo && (
        <Info className={cn(
          "text-muted-foreground",
          size === 'sm' && "h-3 w-3",
          size === 'md' && "h-4 w-4",
          size === 'lg' && "h-5 w-5"
        )} />
      )}
    </div>
  )

  if (!showInfo) {
    return (
      <Badge 
        variant={variant === 'minimal' ? 'outline' : variant}
        className={cn(
          "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
          size === 'sm' && "text-xs px-2 py-0.5",
          size === 'md' && "text-sm px-3 py-1",
          size === 'lg' && "text-base px-4 py-2",
          className
        )}
      >
        {content}
      </Badge>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto p-0 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-full",
            size === 'sm' && "text-xs px-2 py-0.5",
            size === 'md' && "text-sm px-3 py-1", 
            size === 'lg' && "text-base px-4 py-2",
            className
          )}
        >
          {content}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold">Your privacy matters</h4>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Your family memories are encrypted and only visible to people you invite.
            </p>
            <ul className="space-y-1 ml-4">
              <li>• End-to-end encryption for all content</li>
              <li>• No third-party access or data sharing</li>
              <li>• Export your data anytime</li>
              <li>• Delete your account and all data instantly</li>
            </ul>
          </div>
          <div className="pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full">
              Learn more about privacy
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}