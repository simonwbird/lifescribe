import { useState } from 'react'
import ContentCard from './ContentCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, ChefHat, Package, Home, Plus, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Content, ContentType, ViewMode } from '@/lib/collectionsTypes'

interface ContentGridProps {
  content: Content[]
  loading?: boolean
  showSelection?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  emptyStateType?: ContentType | 'all'
  viewMode?: ViewMode
}

export default function ContentGrid({
  content,
  loading = false,
  showSelection = false,
  selectedIds = [],
  onSelectionChange,
  emptyStateType = 'all',
  viewMode = 'grid'
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
        description: "Start with a story or add a recipe, pet, object, or property.",
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
      pet: {
        icon: <Heart className="h-12 w-12 text-muted-foreground" />,
        title: "No pets yet",
        description: "Add your beloved family companions.",
        cta: { text: "Add your first pet", href: "/pets/new" }
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

      {/* Content */}
      {viewMode === 'grid' ? (
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
      ) : (
        <div className="rounded-lg border divide-y">
          {content.map((item) => {
            const getDetailUrl = () => {
              switch (item.type) {
                case 'story':
                  return `/stories/${item.id}`
                case 'recipe':
                  return `/recipes/${item.id}`
                case 'pet':
                  return `/pets/${item.id}`
                case 'object':
                  return `/things/${item.id}`
                case 'property':
                  return `/properties/${item.id}`
              }
            }

            const renderTypeIcon = () => {
              switch (item.type) {
                case 'story':
                  return <FileText className="h-5 w-5 text-muted-foreground" />
                case 'recipe':
                  return <ChefHat className="h-5 w-5 text-muted-foreground" />
                case 'pet':
                  return <Heart className="h-5 w-5 text-muted-foreground" />
                case 'object':
                  return <Package className="h-5 w-5 text-muted-foreground" />
                case 'property':
                  return <Home className="h-5 w-5 text-muted-foreground" />
              }
            }

            return (
              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-accent/50">
                {showSelection && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) => handleSelect(item.id, checked === true)}
                      aria-label={`Select ${item.title}`}
                    />
                  </div>
                )}

                <Link to={getDetailUrl()} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-14 w-14 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={`${item.title} ${item.type} cover image`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    ) : (
                      renderTypeIcon()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <Badge variant="outline" className="capitalize">{item.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : new Date(item.addedAt).toLocaleDateString()}
                      {item.location ? ` • ${item.location}` : ''}
                      {item.peopleIds.length ? ` • ${item.peopleIds.length} people` : ''}
                    </p>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}