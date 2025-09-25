import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  User, 
  FileText, 
  Mic, 
  Camera, 
  Video,
  Search,
  Zap,
  ZapOff
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { FeedFilterOptions } from './FeedFilters'

interface PersistentFeedFiltersProps {
  filters: FeedFilterOptions & { 
    search?: string
    isLiveEnabled?: boolean
  }
  onFiltersChange: (filters: any) => void
  onToggleLive: () => void
  familyMembers: Array<{ id: string; name: string }>
  totalCount: number
  filteredCount: number
  className?: string
}

export default function PersistentFeedFilters({ 
  filters, 
  onFiltersChange, 
  onToggleLive,
  familyMembers,
  totalCount,
  filteredCount,
  className 
}: PersistentFeedFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchQuery })
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleMemberChange = (memberId: string) => {
    onFiltersChange({
      ...filters,
      member: memberId === 'all' ? undefined : memberId
    })
  }

  const handleContentTypeChange = (type: string) => {
    onFiltersChange({
      ...filters,
      contentType: type === 'all' ? 'all' : type as 'text' | 'photo' | 'audio' | 'video'
    })
  }

  const handleDateRangeChange = (dateRange: { from: Date; to?: Date } | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({ isLiveEnabled: filters.isLiveEnabled })
    setSearchQuery('')
  }

  const hasActiveFilters = Boolean(
    filters.member || 
    filters.dateRange || 
    (filters.contentType && filters.contentType !== 'all') || 
    filters.search
  )
  
  const activeFilterCount = [
    filters.member, 
    filters.dateRange, 
    filters.contentType && filters.contentType !== 'all',
    filters.search
  ].filter(Boolean).length

  const contentTypeIcons = {
    text: FileText,
    photo: Camera,
    audio: Mic,
    video: Video
  }

  return (
    <Card className={cn("sticky top-4 z-10 shadow-md", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Top row - Always visible */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Live toggle */}
          <Button
            variant={filters.isLiveEnabled ? "default" : "outline"}
            size="sm"
            onClick={onToggleLive}
            className="flex items-center gap-2"
          >
            {filters.isLiveEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {filters.isLiveEnabled ? 'Live' : 'Static'}
            </span>
          </Button>

          {/* Filter toggle */}
          <Button
            variant={isExpanded ? "default" : "outline"}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* Results counter */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredCount === totalCount 
              ? `${totalCount} stories`
              : `${filteredCount} of ${totalCount} stories`
            }
          </span>
          {filters.isLiveEnabled && (
            <div className="flex items-center gap-1 text-primary">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Live updates active</span>
            </div>
          )}
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Family Member Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Family Member
              </label>
              <Select value={filters.member || 'all'} onValueChange={handleMemberChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All family members</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Type
              </label>
              <Select value={filters.contentType || 'all'} onValueChange={handleContentTypeChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All content types</SelectItem>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Text Stories
                    </div>
                  </SelectItem>
                  <SelectItem value="photo">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photos
                    </div>
                  </SelectItem>
                  <SelectItem value="audio">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Recordings
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Videos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd")} -{" "}
                          {format(filters.dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.from}
                    selected={filters.dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="w-3 h-3" />
                "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {filters.member && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {familyMembers.find(m => m.id === filters.member)?.name || 'Unknown'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleMemberChange('all')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            
            {filters.contentType && filters.contentType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {contentTypeIcons[filters.contentType] && 
                  React.createElement(contentTypeIcons[filters.contentType], { className: "w-3 h-3" })
                }
                {filters.contentType.charAt(0).toUpperCase() + filters.contentType.slice(1)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleContentTypeChange('all')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            
            {filters.dateRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(filters.dateRange.from, "MMM dd")}
                {filters.dateRange.to && ` - ${format(filters.dateRange.to, "MMM dd")}`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleDateRangeChange(undefined)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}