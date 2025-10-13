import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, User, Undo } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Child {
  id: string
  given_name: string
  surname?: string
  avatar_url?: string
}

interface ChildTimelineSelectorProps {
  familyId: string
  onSelectedChange?: (selectedIds: string[]) => void
}

const RECENT_CHILDREN_KEY = 'recent_timeline_children'
const MAX_RECENT = 5

export default function ChildTimelineSelector({ 
  familyId, 
  onSelectedChange 
}: ChildTimelineSelectorProps) {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadChildren()
    loadRecentChildren()
  }, [familyId])

  useEffect(() => {
    if (onSelectedChange) {
      onSelectedChange(selectedIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])

  const loadChildren = async () => {
    try {
      // @ts-ignore - Avoiding deep type inference issue
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname, avatar_url')
        .eq('family_id', familyId)
        .eq('status', 'living')
        .order('birth_date', { ascending: false })
        .limit(20)

      if (error) throw error
      setChildren((data || []) as Child[])
    } catch (error) {
      console.error('Failed to load children:', error)
    }
  }

  const loadRecentChildren = () => {
    try {
      const stored = localStorage.getItem(RECENT_CHILDREN_KEY)
      if (stored) {
        const recent = JSON.parse(stored) as string[]
        setRecentIds(recent.slice(0, MAX_RECENT))
      }
    } catch (error) {
      console.error('Failed to load recent children:', error)
    }
  }

  const saveRecentChildren = (childIds: string[]) => {
    try {
      // Add new selections to front of list, remove duplicates
      const updated = [
        ...childIds,
        ...recentIds.filter(id => !childIds.includes(id))
      ].slice(0, MAX_RECENT)
      
      localStorage.setItem(RECENT_CHILDREN_KEY, JSON.stringify(updated))
      setRecentIds(updated)
    } catch (error) {
      console.error('Failed to save recent children:', error)
    }
  }

  const toggleChild = (childId: string) => {
    const newSelected = selectedIds.includes(childId)
      ? selectedIds.filter(id => id !== childId)
      : [...selectedIds, childId]
    
    setSelectedIds(newSelected)

    if (newSelected.length > 0) {
      saveRecentChildren(newSelected)
    }
  }

  const clearSelection = () => {
    const prevSelected = [...selectedIds]
    setSelectedIds([])
    
    toast({
      title: "Selection cleared",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedIds(prevSelected)}
        >
          <Undo className="h-3 w-3 mr-1" />
          Undo
        </Button>
      ),
    })
  }

  const getChildName = (child: Child) => {
    return child.surname 
      ? `${child.given_name} ${child.surname}` 
      : child.given_name
  }

  // Show recently used children first
  const recentChildren = children.filter(c => recentIds.includes(c.id))
  const otherChildren = children.filter(c => !recentIds.includes(c.id))
  const displayChildren = [...recentChildren, ...otherChildren]

  if (children.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tag to timeline</label>
        {selectedIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayChildren.map((child) => {
          const isSelected = selectedIds.includes(child.id)
          const isRecent = recentIds.includes(child.id)
          
          return (
            <Badge
              key={child.id}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer px-3 py-2 transition-all ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              } ${isRecent ? 'ring-1 ring-primary/30' : ''}`}
              onClick={() => toggleChild(child.id)}
            >
              <User className="h-3 w-3 mr-1.5" />
              {getChildName(child)}
              {isRecent && (
                <span className="ml-1 text-xs opacity-60">★</span>
              )}
            </Badge>
          )
        })}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          This will appear on {selectedIds.length} timeline
          {selectedIds.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
