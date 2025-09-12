import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, ChefHat, Package, Home } from 'lucide-react'
import type { ContentType, ContentCounts } from '@/lib/collectionsTypes'

interface CollectionsTabsProps {
  activeTab: ContentType | 'all'
  onTabChange: (tab: ContentType | 'all') => void
  counts: ContentCounts
}

export default function CollectionsTabs({ activeTab, onTabChange, counts }: CollectionsTabsProps) {
  const tabs = [
    { 
      id: 'all' as const, 
      label: 'All', 
      icon: null, 
      count: counts.all 
    },
    { 
      id: 'story' as const, 
      label: 'Stories', 
      icon: FileText, 
      count: counts.stories 
    },
    { 
      id: 'recipe' as const, 
      label: 'Recipes', 
      icon: ChefHat, 
      count: counts.recipes 
    },
    { 
      id: 'object' as const, 
      label: 'Objects', 
      icon: Package, 
      count: counts.objects 
    },
    { 
      id: 'property' as const, 
      label: 'Properties', 
      icon: Home, 
      count: counts.properties 
    }
  ]

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-auto p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 sm:px-4 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            <div className="flex items-center gap-2">
              {tab.icon && <tab.icon className="h-4 w-4" />}
              <span className="text-sm font-medium">{tab.label}</span>
            </div>
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-xs bg-muted text-muted-foreground data-[state=active]:bg-accent-foreground/20"
            >
              {tab.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}