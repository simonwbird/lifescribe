import { Plus, ImageIcon, Mic, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface QuickAddBarProps {
  onAddStory: () => void
  onAddPhoto: () => void
  onAddVoice: () => void
  onAddMilestone: () => void
}

export function QuickAddBar({
  onAddStory,
  onAddPhoto,
  onAddVoice,
  onAddMilestone
}: QuickAddBarProps) {
  const actions = [
    { label: 'Story', icon: Plus, onClick: onAddStory },
    { label: 'Photo', icon: ImageIcon, onClick: onAddPhoto },
    { label: 'Voice', icon: Mic, onClick: onAddVoice },
    { label: 'Milestone', icon: Calendar, onClick: onAddMilestone }
  ]

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            onClick={onClick}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </Card>
  )
}
