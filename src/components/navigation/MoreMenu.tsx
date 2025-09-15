import { ChevronDown, Archive, GitBranch, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLabs } from '@/hooks/useLabs'
import { useMode } from '@/contexts/ModeContext'

export default function MoreMenu() {
  const { track } = useAnalytics()
  const { labsEnabled, flags } = useLabs()
  const { mode } = useMode()

  const handleMenuClick = () => {
    track('more_menu_click')
  }

  // Only show if Labs is on and mode is Studio
  if (!labsEnabled || mode !== 'studio') {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1" onClick={handleMenuClick}>
          More
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {flags.collections && (
          <DropdownMenuItem asChild>
            <Link to="/collections">
              <Archive className="mr-2 h-4 w-4" />
              Collections
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/family/tree/views">
            <GitBranch className="mr-2 h-4 w-4" />
            Tree Views
          </Link>
        </DropdownMenuItem>
        {flags.analytics && (
        <DropdownMenuItem asChild>
          <Link to="/labs">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Link>
        </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}