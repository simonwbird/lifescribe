import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChevronRight, 
  ArrowUpDown, 
  Grid3x3, 
  List, 
  Clock,
  Camera,
  Video,
  Mic
} from 'lucide-react'
import { GroupByOption, SortOption, ViewOption, MediaTabOption } from '@/lib/mediaTypes'
import { cn } from '@/lib/utils'

interface MediaFiltersProps {
  groupBy: GroupByOption
  sort: SortOption
  view: ViewOption
  activeTab: MediaTabOption
  onGroupByChange: (groupBy: GroupByOption) => void
  onSortChange: (sort: SortOption) => void
  onViewChange: (view: ViewOption) => void
  onQuickAction: (action: 'upload-photo' | 'record-video' | 'record-voice') => void
}

export function MediaFilters({
  groupBy,
  sort,
  view,
  activeTab,
  onGroupByChange,
  onSortChange,
  onViewChange,
  onQuickAction
}: MediaFiltersProps) {
  const groupByOptions = [
    { id: 'day' as const, label: 'Day' },
    { id: 'month' as const, label: 'Month' },
    { id: 'event' as const, label: 'Event' },
    { id: 'people' as const, label: 'People' },
    { id: 'places' as const, label: 'Places' },
    { id: 'albums' as const, label: 'Albums' },
    { id: 'favorites' as const, label: 'Favorites' }
  ]

  const sortOptions = [
    { id: 'newest' as const, label: 'Newest First' },
    { id: 'oldest' as const, label: 'Oldest First' },
    { id: 'most-liked' as const, label: 'Most Liked' }
  ]

  const viewOptions = [
    { id: 'grid' as const, label: 'Grid', icon: Grid3x3 },
    { id: 'strip' as const, label: 'Strip', icon: List },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock }
  ]

  const getQuickActions = () => {
    switch (activeTab) {
      case 'photos':
        return [{ id: 'upload-photo' as const, label: 'Upload Photo', icon: Camera }]
      case 'videos':
        return [{ id: 'record-video' as const, label: 'Record Video', icon: Video }]
      case 'voice':
        return [{ id: 'record-voice' as const, label: 'Record Voice', icon: Mic }]
      default:
        return [
          { id: 'upload-photo' as const, label: 'Upload Photo', icon: Camera },
          { id: 'record-video' as const, label: 'Record Video', icon: Video },
          { id: 'record-voice' as const, label: 'Record Voice', icon: Mic }
        ]
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 border-b bg-background/50 backdrop-blur">
      {/* Group By Chips - Horizontally Scrollable */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          Group by
          <ChevronRight className="h-3 w-3" />
        </span>
        <ScrollArea className="flex-1">
          <div className="flex gap-2 pb-2">
            {groupByOptions.map((option) => (
              <Button
                key={option.id}
                variant={groupBy === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => onGroupByChange(option.id)}
                className="whitespace-nowrap"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort: {sortOptions.find(s => s.id === sort)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className={cn(sort === option.id && "bg-accent")}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          {viewOptions.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.id}
                variant={view === option.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(option.id)}
                className="h-8 w-8 p-0"
                aria-label={option.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {getQuickActions().map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => onQuickAction(action.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}