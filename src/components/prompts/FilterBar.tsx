import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export interface FilterOptions {
  categories: string[];
  people: Array<{ id: string; name: string }>;
  mediaTypes: string[];
  timeRanges: string[];
  statuses: string[];
}

export interface ActiveFilters {
  category?: string;
  person_id?: string;
  media?: string;
  time_range?: string;
  status?: string;
}

interface FilterBarProps {
  options: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  onClearAll: () => void;
}

export function FilterBar({ options, activeFilters, onFilterChange, onClearAll }: FilterBarProps) {
  const hasActiveFilters = Object.keys(activeFilters).some(key => activeFilters[key as keyof ActiveFilters]);

  const updateFilter = (key: keyof ActiveFilters, value: string | undefined) => {
    const newFilters = { ...activeFilters };
    if (value && value !== 'all') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFilterChange(newFilters);
  };

  const removeFilter = (key: keyof ActiveFilters) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Category Filter */}
        <Select
          value={activeFilters.category || 'all'}
          onValueChange={(value) => updateFilter('category', value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {options.categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Person Filter */}
        <Select
          value={activeFilters.person_id || 'all'}
          onValueChange={(value) => updateFilter('person_id', value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All People</SelectItem>
            <SelectItem value="no-person">No Person</SelectItem>
            {options.people.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Media Type Filter */}
        <Select
          value={activeFilters.media || 'all'}
          onValueChange={(value) => updateFilter('media', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Media" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {options.mediaTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Range Filter */}
        <Select
          value={activeFilters.time_range || 'all'}
          onValueChange={(value) => updateFilter('time_range', value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            {options.timeRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.category && (
            <Badge variant="secondary" className="gap-1">
              {activeFilters.category}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => removeFilter('category')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {activeFilters.person_id && (
            <Badge variant="secondary" className="gap-1">
              {activeFilters.person_id === 'no-person' 
                ? 'No Person'
                : options.people.find(p => p.id === activeFilters.person_id)?.name || 'Unknown'
              }
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => removeFilter('person_id')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {activeFilters.media && (
            <Badge variant="secondary" className="gap-1">
              {activeFilters.media}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => removeFilter('media')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {activeFilters.time_range && (
            <Badge variant="secondary" className="gap-1">
              {activeFilters.time_range}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => removeFilter('time_range')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}