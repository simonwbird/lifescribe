import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Filter, X, Calendar as CalendarIcon, User, FileText, Mic, Camera, Video } from 'lucide-react'
import { format } from 'date-fns'

export interface FeedFilterOptions {
  member?: string
  dateRange?: { from: Date; to?: Date }
  contentType?: 'text' | 'photo' | 'audio' | 'video' | 'all'
}

interface FeedFiltersProps {
  filters: FeedFilterOptions
  onFiltersChange: (filters: FeedFilterOptions) => void
  familyMembers: Array<{ id: string; name: string }>
  className?: string
}

export function FeedFilters({ 
  filters, 
  onFiltersChange, 
  familyMembers,
  className 
}: FeedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

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

  const clearFilters = () => {
    onFiltersChange({})
    setIsOpen(false)
  }

  const hasActiveFilters = filters.member || filters.dateRange || (filters.contentType && filters.contentType !== 'all')
  const activeFilterCount = [filters.member, filters.dateRange, filters.contentType && filters.contentType !== 'all'].filter(Boolean).length

  const contentTypeIcons = {
    text: FileText,
    photo: Camera,
    audio: Mic,
    video: Video
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filter Updates</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Family Member Filter */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Family Member
              </label>
              <Select value={filters.member || 'all'} onValueChange={handleMemberChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All family members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All family members</SelectItem>
          {familyMembers && familyMembers.length > 0 ? (
            familyMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-members" disabled>No family members found</SelectItem>
          )}
                </SelectContent>
              </Select>
            </div>

            {/* Content Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Type
              </label>
              <Select value={filters.contentType || 'all'} onValueChange={handleContentTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All content types" />
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
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
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
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
              {filters.member && familyMembers && (
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
    </div>
  )
}