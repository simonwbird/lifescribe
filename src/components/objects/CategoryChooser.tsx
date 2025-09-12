import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { OBJECT_CATEGORY_SPECS, OBJECT_CATEGORY_GROUPS, getCategoriesByGroup, type CategorySpec } from '@/lib/artifactTypes'

interface CategoryChooserProps {
  onCategorySelect: (categoryId: string) => void
  onCancel: () => void
}

export default function CategoryChooser({ onCategorySelect, onCancel }: CategoryChooserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  
  const categoriesByGroup = getCategoriesByGroup()
  
  const filteredCategories = searchQuery
    ? OBJECT_CATEGORY_SPECS.filter(spec => 
        spec.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectedGroup
    ? categoriesByGroup[selectedGroup] || []
    : []

  const showAllCategories = !selectedGroup && !searchQuery

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }>
    return IconComponent ? <IconComponent className="h-6 w-6" /> : <Icons.Package className="h-6 w-6" />
  }

  const CategoryCard = ({ spec }: { spec: CategorySpec }) => (
    <Card 
      key={spec.id}
      className="cursor-pointer hover:bg-accent/50 transition-colors group"
      onClick={() => onCategorySelect(spec.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {getIcon(spec.icon)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {spec.label}
              </h3>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {spec.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Add Object</h1>
              <p className="text-muted-foreground">Choose a category for your family artifact</p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-6 py-6">
        {showAllCategories ? (
          // Show category groups
          <div className="space-y-8">
            {Object.entries(OBJECT_CATEGORY_GROUPS).map(([groupName, iconName]) => {
              const categories = categoriesByGroup[groupName] || []
              if (categories.length === 0) return null
              
              return (
                <div key={groupName}>
                  <div 
                    className="flex items-center gap-3 mb-4 cursor-pointer hover:text-primary transition-colors group"
                    onClick={() => setSelectedGroup(groupName)}
                  >
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      {getIcon(iconName)}
                    </div>
                    <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                      {groupName}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {categories.length}
                    </Badge>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.slice(0, 6).map(spec => (
                      <CategoryCard key={spec.id} spec={spec} />
                    ))}
                    {categories.length > 6 && (
                      <Card 
                        className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
                        onClick={() => setSelectedGroup(groupName)}
                      >
                        <CardContent className="p-4 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-muted-foreground mb-2">
                              <Icons.Plus className="h-6 w-6 mx-auto" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              +{categories.length - 6} more
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Show filtered categories or selected group
          <div>
            {selectedGroup && (
              <div className="mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedGroup(null)}
                  className="mb-2"
                >
                  ← Back to all categories
                </Button>
                <h2 className="text-xl font-semibold text-foreground">{selectedGroup}</h2>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map(spec => (
                <CategoryCard key={spec.id} spec={spec} />
              ))}
            </div>
            
            {filteredCategories.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Icons.Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No categories found</h3>
                <p className="text-muted-foreground">
                  Try searching for something else or browse all categories
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}