import { ChevronDown, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function FamilySwitcher() {
  const { track } = useAnalytics()

  const handleFamilySwitch = (familyId: string) => {
    track('family_switch', { familyId })
    // TODO: Implement family context switching
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Smith Family</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => handleFamilySwitch('main')}>
          <Users className="mr-2 h-4 w-4" />
          Smith Family
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFamilySwitch('extended')}>
          <Users className="mr-2 h-4 w-4" />
          Extended Family
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}