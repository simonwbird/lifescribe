import { useState } from 'react'
import { Flame, FileText, Images, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useAnalytics } from '@/hooks/useAnalytics'

// Mock data - would come from API
const mockStreak = {
  current: 7,
  weeklyProgress: 4,
  weeklyGoal: 7
}

const quickActions = [
  {
    icon: FileText,
    label: 'Story',
    href: '/stories/new'
  },
  {
    icon: Images,
    label: 'Photo',
    href: '/photos/new'
  },
  {
    icon: Mic,
    label: 'Voice note',
    href: '/audio/new'
  }
]

export default function CapturesStreak() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  const handleOpen = () => {
    track('streak_open')
    setOpen(true)
  }

  const handleActionClick = (action: typeof quickActions[0]) => {
    track('create_item_selected', { type: action.label.toLowerCase(), source: 'streak' })
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-2 hover:bg-accent hover:text-accent-foreground"
          onClick={handleOpen}
          aria-label={`${mockStreak.current} day streak, ${mockStreak.weeklyProgress} of ${mockStreak.weeklyGoal} this week`}
        >
          <Flame className="h-4 w-4 text-orange-500" />
          <Badge variant="secondary" className="text-xs">
            {mockStreak.weeklyProgress}/{mockStreak.weeklyGoal}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-4 bg-popover border border-border shadow-lg"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-lg">{mockStreak.current} day streak!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {mockStreak.weeklyProgress} of {mockStreak.weeklyGoal} captures this week
            </p>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${(mockStreak.weeklyProgress / mockStreak.weeklyGoal) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quick capture:</p>
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => handleActionClick(action)}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Turn off streaks
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}