import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, MapPin, Cake, Utensils, Package, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PromptFilter = 'people' | 'places' | 'firsts' | 'food' | 'objects' | null

interface PromptFiltersProps {
  activeFilter: PromptFilter
  onFilterChange: (filter: PromptFilter) => void
  counts?: Record<string, number>
}

const filterConfig = [
  { id: 'people' as const, label: 'People', icon: User, color: 'text-blue-600' },
  { id: 'places' as const, label: 'Places', icon: MapPin, color: 'text-green-600' },
  { id: 'firsts' as const, label: 'Firsts', icon: Cake, color: 'text-purple-600' },
  { id: 'food' as const, label: 'Food', icon: Utensils, color: 'text-orange-600' },
  { id: 'objects' as const, label: 'Objects', icon: Package, color: 'text-pink-600' },
]

export function PromptFilters({ activeFilter, onFilterChange, counts = {} }: PromptFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
      {filterConfig.map(({ id, label, icon: Icon, color }) => {
        const isActive = activeFilter === id
        const count = counts[id] || 0

        return (
          <Button
            key={id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(isActive ? null : id)}
            className={cn(
              "gap-2 transition-all",
              !isActive && "hover:bg-muted"
            )}
          >
            <Icon className={cn("h-4 w-4", !isActive && color)} />
            {label}
            {count > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className="ml-1 h-5 min-w-[20px] px-1"
              >
                {count}
              </Badge>
            )}
            {isActive && <X className="h-3 w-3 ml-1" />}
          </Button>
        )
      })}
    </div>
  )
}
