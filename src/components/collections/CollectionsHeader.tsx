import { Search, Plus, ChevronDown, Grid3x3, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import type { ContentSort, ViewMode } from '@/lib/collectionsTypes'

interface CollectionsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: ContentSort
  onSortChange: (sort: ContentSort) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  selectedCount?: number
  onClearSelection?: () => void
}

export default function CollectionsHeader({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCount = 0,
  onClearSelection
}: CollectionsHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Title and description */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collections</h1>
          <p className="text-muted-foreground mt-1">
            Your family's recipes, objects, properties and stories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search titles, people, places, tags…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/stories/new">Story</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/recipes/new">Recipe</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/objects/new">Object</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/properties/new">Property</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/prompts">Answer Prompt</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: ContentSort) => onSortChange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title-asc">A → Z</SelectItem>
              <SelectItem value="title-desc">Z → A</SelectItem>
              <SelectItem value="occurred-desc">Date (New → Old)</SelectItem>
              <SelectItem value="occurred-asc">Date (Old → New)</SelectItem>
            </SelectContent>
          </Select>

          {/* Selection indicator */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-accent">
                {selectedCount} selected
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}