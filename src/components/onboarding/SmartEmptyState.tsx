import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Mic, Image, Pin, Users, MessageCircle, Camera } from 'lucide-react'

interface SmartEmptyStateProps {
  type: 'bio' | 'photos' | 'pinned' | 'stories' | 'memories' | 'family'
  personName?: string
  onAction?: () => void
  actionLabel?: string
  className?: string
}

const emptyStateConfig = {
  bio: {
    icon: MessageCircle,
    title: 'No bio yet',
    description: 'Introduce yourself in one line',
    actionLabel: 'Add Bio',
    gradient: 'from-blue-50 to-indigo-50',
    iconColor: 'text-blue-600',
    priority: false,
    showProgress: false
  },
  photos: {
    icon: Camera,
    title: 'No photos yet',
    description: 'Drop a photo and we\'ll help tag faces',
    actionLabel: 'Add Photo',
    gradient: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-600',
    priority: false,
    showProgress: false
  },
  pinned: {
    icon: Pin,
    title: 'Pin your first highlight',
    description: 'Choose important stories to feature here',
    actionLabel: 'Browse Timeline', 
    gradient: 'from-amber-50 to-yellow-50',
    iconColor: 'text-amber-600',
    priority: false,
    showProgress: true
  },
  stories: {
    icon: Mic,
    title: 'No stories yet',
    description: 'Record your first memory in 60 seconds',
    actionLabel: 'Start Recording',
    gradient: 'from-purple-50 to-violet-50',
    iconColor: 'text-purple-600',
    priority: true,
    showProgress: false
  },
  memories: {
    icon: Image,
    title: 'Create your first memory',
    description: 'Share a photo, record a voice note, or write a story',
    actionLabel: 'Add Memory',
    gradient: 'from-rose-50 to-pink-50',
    iconColor: 'text-rose-600',
    priority: false,
    showProgress: false
  },
  family: {
    icon: Users,
    title: 'Invite your family',
    description: 'Share memories with the people who matter most',
    actionLabel: 'Send Invite',
    gradient: 'from-brand-50 to-brand-100',
    iconColor: 'text-brand-600',
    priority: false,
    showProgress: false
  }
}

export default function SmartEmptyState({ 
  type, 
  personName, 
  onAction, 
  actionLabel,
  className = '' 
}: SmartEmptyStateProps) {
  const config = emptyStateConfig[type]
  const IconComponent = config.icon

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardContent className={`p-8 text-center bg-gradient-to-br ${config.gradient}`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="relative">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 mb-4 ${config.iconColor}`}>
            <IconComponent className="h-8 w-8" />
          </div>
          
          {config.priority && (
            <Badge className="mb-3 bg-brand-600 text-white animate-pulse">
              Start Here
            </Badge>
          )}
          
          <h3 className="font-semibold text-lg mb-2">
            {personName ? config.title.replace('your', `${personName}'s`) : config.title}
          </h3>
          
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            {config.description}
          </p>
          
          {config.showProgress && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= 1 ? 'bg-brand-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-2">1/5 highlights</span>
            </div>
          )}
          
          {onAction && (
            <Button
              onClick={onAction}
              className={`bg-white hover:bg-gray-50 ${config.iconColor} border shadow-sm`}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel || config.actionLabel}
            </Button>
          )}
          
          {type === 'stories' && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Voice recordings are often the most treasured memories
              </p>
            </div>
          )}
          
          {type === 'family' && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-brand-700 font-medium">
                🎁 Unlock Weekly Digest with 2+ family members
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}