import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, EyeOff, Lock, Globe, Search, ChevronDown } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface VisibilityChipsProps {
  personId: string
  currentVisibility: 'private' | 'unlisted' | 'public'
  currentIndexability: 'private' | 'unlisted' | 'public_indexable'
  canEdit: boolean
  onUpdate?: () => void
}

export function VisibilityChips({
  personId,
  currentVisibility,
  currentIndexability,
  canEdit,
  onUpdate
}: VisibilityChipsProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateVisibility = async (newVisibility: 'private' | 'unlisted' | 'public') => {
    if (!canEdit) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('people')
        .update({ 
          indexability: newVisibility === 'private' ? 'private' : 
                       newVisibility === 'unlisted' ? 'unlisted' : 'public_indexable'
        })
        .eq('id', personId)

      if (error) throw error

      toast({
        title: 'Visibility updated',
        description: `Page is now ${newVisibility}`,
      })

      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateIndexability = async (newIndexability: 'private' | 'unlisted' | 'public_indexable') => {
    if (!canEdit) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('people')
        .update({ indexability: newIndexability })
        .eq('id', personId)

      if (error) throw error

      toast({
        title: 'Search settings updated',
        description: `Page is now ${newIndexability === 'public_indexable' ? 'searchable' : 'not searchable'}`,
      })

      onUpdate?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update indexability',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const visibilityConfig = {
    private: { icon: Lock, label: 'Private', variant: 'destructive' as const },
    unlisted: { icon: EyeOff, label: 'Unlisted', variant: 'secondary' as const },
    public: { icon: Globe, label: 'Public', variant: 'default' as const },
  }

  const indexabilityConfig = {
    private: { label: 'No Index', description: 'Not searchable' },
    unlisted: { label: 'No Index', description: 'Not searchable' },
    public_indexable: { label: 'Indexed', description: 'Searchable' },
  }

  const VisibilityIcon = visibilityConfig[currentVisibility].icon

  return (
    <div className="flex items-center gap-2">
      {/* Visibility Dropdown */}
      {canEdit ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isUpdating}
              className="gap-2"
            >
              <VisibilityIcon className="h-4 w-4" />
              {visibilityConfig[currentVisibility].label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Page Visibility</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateVisibility('private')}>
              <Lock className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">Private</div>
                <div className="text-xs text-muted-foreground">Only you can see</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateVisibility('unlisted')}>
              <EyeOff className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">Unlisted</div>
                <div className="text-xs text-muted-foreground">Anyone with link</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateVisibility('public')}>
              <Globe className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">Public</div>
                <div className="text-xs text-muted-foreground">Anyone can find</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Badge variant={visibilityConfig[currentVisibility].variant}>
          <VisibilityIcon className="h-3 w-3 mr-1" />
          {visibilityConfig[currentVisibility].label}
        </Badge>
      )}

      {/* Indexability Dropdown (only for public pages) */}
      {currentVisibility === 'public' && canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isUpdating}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              {indexabilityConfig[currentIndexability].label}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Search Engine</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateIndexability('unlisted')}>
              <EyeOff className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">No Index</div>
                <div className="text-xs text-muted-foreground">Hidden from search</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateIndexability('public_indexable')}>
              <Search className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">Indexed</div>
                <div className="text-xs text-muted-foreground">Appears in search</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {currentVisibility === 'public' && !canEdit && (
        <Badge variant={currentIndexability === 'public_indexable' ? 'default' : 'secondary'}>
          <Search className="h-3 w-3 mr-1" />
          {indexabilityConfig[currentIndexability].label}
        </Badge>
      )}
    </div>
  )
}
