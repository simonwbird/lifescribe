import { useState } from 'react'
import { Users, Lock, Globe, Eye, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type VisibilityOption = 'family' | 'private' | 'public' | 'circle'

interface PrivacyChipProps {
  currentVisibility: VisibilityOption
  isOwner: boolean
  onVisibilityChange?: (newVisibility: VisibilityOption) => Promise<void>
  className?: string
  size?: 'sm' | 'md'
}

const visibilityConfig = {
  family: {
    icon: Users,
    label: 'Family',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    hoverColor: 'hover:bg-blue-100'
  },
  private: {
    icon: Lock,
    label: 'Only me',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    hoverColor: 'hover:bg-orange-100'
  },
  public: {
    icon: Globe,
    label: 'Public',
    color: 'text-green-600 bg-green-50 border-green-200',
    hoverColor: 'hover:bg-green-100'
  },
  circle: {
    icon: Eye,
    label: 'Circle',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    hoverColor: 'hover:bg-purple-100'
  }
}

export function PrivacyChip({ 
  currentVisibility, 
  isOwner, 
  onVisibilityChange,
  className,
  size = 'sm'
}: PrivacyChipProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const config = visibilityConfig[currentVisibility]
  const Icon = config.icon

  const handleVisibilityChange = async (newVisibility: VisibilityOption) => {
    if (!onVisibilityChange || newVisibility === currentVisibility) return
    
    setIsUpdating(true)
    try {
      await onVisibilityChange(newVisibility)
      toast({
        title: "Visibility updated",
        description: `Now visible to: ${visibilityConfig[newVisibility].label}`,
      })
    } catch (error) {
      toast({
        title: "Failed to update visibility",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Non-owner or no change handler: read-only chip
  if (!isOwner || !onVisibilityChange) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
          config.color,
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          className
        )}
      >
        <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        <span className="font-medium">{config.label}</span>
      </div>
    )
  }

  // Owner: interactive dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isUpdating}
          className={cn(
            'h-auto rounded-full border px-2.5 py-1 gap-1.5',
            config.color,
            config.hoverColor,
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            className
          )}
        >
          <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          <span className="font-medium">{config.label}</span>
          <ChevronDown className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {(Object.keys(visibilityConfig) as VisibilityOption[]).map((option) => {
          const optionConfig = visibilityConfig[option]
          const OptionIcon = optionConfig.icon
          const isCurrent = option === currentVisibility
          
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => handleVisibilityChange(option)}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                isCurrent && 'bg-accent'
              )}
            >
              <OptionIcon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{optionConfig.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option === 'family' && 'Visible to all family members'}
                  {option === 'private' && 'Only visible to you'}
                  {option === 'public' && 'Visible to everyone'}
                  {option === 'circle' && 'Visible to selected circle'}
                </div>
              </div>
              {isCurrent && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
