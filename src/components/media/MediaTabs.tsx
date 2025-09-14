import React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MediaTabOption } from '@/lib/mediaTypes'

interface MediaTabsProps {
  activeTab: MediaTabOption
  onTabChange: (tab: MediaTabOption) => void
  counts: Record<MediaTabOption, number>
}

export function MediaTabs({ activeTab, onTabChange, counts }: MediaTabsProps) {
  const tabs = [
    { id: 'all' as const, label: 'All' },
    { id: 'photos' as const, label: 'Photos' },
    { id: 'videos' as const, label: 'Videos' },
    { id: 'voice' as const, label: 'Voice' }
  ]

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as MediaTabOption)}>
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            className="relative"
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {counts[tab.id].toLocaleString()}
              </Badge>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}