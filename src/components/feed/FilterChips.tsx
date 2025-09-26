import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Eye, User, Camera, Mic } from 'lucide-react'

type FilterType = 'all' | 'recent' | 'unread' | 'yours' | 'photos' | 'audio'

interface FilterChipsProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  const filters = [
    { 
      key: 'all' as const, 
      label: 'All', 
      icon: null 
    },
    { 
      key: 'recent' as const, 
      label: 'Recent', 
      icon: <Clock className="h-3 w-3" /> 
    },
    { 
      key: 'unread' as const, 
      label: 'Unread', 
      icon: <Eye className="h-3 w-3" /> 
    },
    { 
      key: 'yours' as const, 
      label: 'Yours', 
      icon: <User className="h-3 w-3" /> 
    },
    { 
      key: 'photos' as const, 
      label: 'Photos', 
      icon: <Camera className="h-3 w-3" /> 
    },
    { 
      key: 'audio' as const, 
      label: 'Audio', 
      icon: <Mic className="h-3 w-3" /> 
    }
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
        Filter:
      </span>
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className="h-8 gap-1.5 text-xs transition-all duration-200 hover:shadow-sm"
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  )
}