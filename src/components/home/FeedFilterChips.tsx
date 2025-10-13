import { Button } from '@/components/ui/button'
import { Camera, Mic, Video, FileText, Calendar, UserPlus, Package, Shield } from 'lucide-react'

export type FeedFilterType = 'all' | 'photos' | 'voice' | 'video' | 'stories' | 'events' | 'requests' | 'objects' | 'admin'

interface FeedFilterChipsProps {
  activeFilter: FeedFilterType
  onFilterChange: (filter: FeedFilterType) => void
  showAdmin?: boolean
}

export function FeedFilterChips({ activeFilter, onFilterChange, showAdmin = false }: FeedFilterChipsProps) {
  const baseFilters: Array<{ key: FeedFilterType; label: string; icon: React.ReactNode }> = [
    { key: 'all', label: 'All', icon: null },
    { key: 'photos', label: 'Photos', icon: <Camera className="h-3.5 w-3.5" /> },
    { key: 'voice', label: 'Voice', icon: <Mic className="h-3.5 w-3.5" /> },
    { key: 'video', label: 'Video', icon: <Video className="h-3.5 w-3.5" /> },
    { key: 'stories', label: 'Stories', icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'events', label: 'Events', icon: <Calendar className="h-3.5 w-3.5" /> },
    { key: 'requests', label: 'Requests', icon: <UserPlus className="h-3.5 w-3.5" /> },
    { key: 'objects', label: 'Objects/Recipes', icon: <Package className="h-3.5 w-3.5" /> },
  ]

  const filters = showAdmin 
    ? [...baseFilters, { key: 'admin' as FeedFilterType, label: 'Admin', icon: <Shield className="h-3.5 w-3.5" /> }]
    : baseFilters

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className="h-9 gap-2 text-xs whitespace-nowrap transition-all duration-200 hover:shadow-sm"
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
