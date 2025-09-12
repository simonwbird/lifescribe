import { useState } from 'react'
import ContentCard from './ContentCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ChefHat, Package, Home, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Content, ContentType } from '@/lib/collectionsTypes'

interface ContentGridProps {
  content: Content[]
  loading?: boolean
  showSelection?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  emptyStateType?: ContentType | 'all'
}

export default function ContentGrid({
  content,
  loading = false,
  showSelection = false,
  selectedIds = [],
  onSelectionChange,
  emptyStateType = 'all'
}: ContentGridProps) {
  const handleSelect = (id: string, selected: boolean) => {
    if (!onSelectionChange) return
    
    if (selected) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const getEmptyState = () => {
    const states = {
      all: {
        icon: <Plus className="h-12 w-12 text-muted-foreground" />,
        title: "Nothing here yet",
        description: "Start with a story or add a recipe, object, or property.",
        cta: { text: "Add Content", href: "/stories/new" }
      },
      story: {
        icon: <FileText className="h-12 w-12 text-muted-foreground" />,
        title: "No stories yet",
        description: "Share your first family memory.",
        cta: { text: "Write your first story", href: "/stories/new" }
      },
      recipe: {
        icon: <ChefHat className="h-12 w-12 text-muted-foreground" />,
        title: "No recipes yet",
        description: "Preserve your family's favorite recipes.",
        cta: { text: "Add your first recipe", href: "/recipes/new" }
      },
      object: {
        icon: <Package className="h-12 w-12 text-muted-foreground" />,
        title: "No objects yet",
        description: "Document your family's treasured items.",
        cta: { text: "Add your first object", href: "/objects/new" }
      },
      property: {
        icon: <Home className="h-12 w-12 text-muted-foreground" />,
        title: "No properties yet",
        description: "Record the places that hold your family's memories.",
        cta: { text: "Add your first property", href: "/archive?tab=properties&first-action=add-property" }
      }
    }

    return states[emptyStateType] || states.all
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-2xl h-64"></div>
          </div>
        ))}
      </div>
    )
  }

  if (content.length === 0) {
    const emptyState = getEmptyState()
    
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4">
          {emptyState.icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {emptyState.title}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {emptyState.description}
        </p>
        <Button asChild className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground">
          <Link to={emptyState.cta.href}>
            <Plus className="h-4 w-4 mr-2" />
            {emptyState.cta.text}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selection summary */}
      {showSelection && selectedIds.length > 0 && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-accent">
            {selectedIds.length} selected
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Move to...
            </Button>
            <Button variant="outline" size="sm">
              Change visibility
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {content.map((item) => (
          <ContentCard
            key={item.id}
            content={item}
            isSelected={selectedIds.includes(item.id)}
            onSelect={handleSelect}
            showSelection={showSelection}
          />
        ))}
      </div>
    </div>
  )
}