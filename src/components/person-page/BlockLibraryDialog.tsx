import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BLOCK_LIBRARY, BlockType } from '@/types/personPage'
import { 
  User, Calendar, Camera, BookOpen, Heart, 
  Users, Award, Star, Quote, MessageSquare, MessageCircle,
  TrendingUp, Grid, Mic, MapPin, Image, Book, Flag, Clock, FileText
} from 'lucide-react'

const iconMap = {
  User, Calendar, Camera, BookOpen, Heart, 
  Users, Award, Star, Quote, MessageSquare, MessageCircle,
  TrendingUp, Grid, Mic, MapPin, Image, Book, Flag, Clock, FileText
}

interface BlockLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBlock: (type: BlockType) => void
  existingBlocks: BlockType[]
  currentPreset: 'life' | 'tribute'
}

export default function BlockLibraryDialog({
  open,
  onOpenChange,
  onAddBlock,
  existingBlocks,
  currentPreset
}: BlockLibraryDialogProps) {
  const presetBlocks = BLOCK_LIBRARY.filter(b => 
    b.presets.includes(currentPreset) || b.presets.includes('both')
  )
  
  const sharedBlocks = BLOCK_LIBRARY.filter(b => b.presets.includes('both'))
  const specificBlocks = BLOCK_LIBRARY.filter(b => 
    b.presets.includes(currentPreset) && !b.presets.includes('both')
  )

  const renderBlockCard = (block: typeof BLOCK_LIBRARY[0]) => {
    const Icon = iconMap[block.icon as keyof typeof iconMap] || Star
    const isAdded = existingBlocks.includes(block.type)

    return (
      <Card 
        key={block.type}
        className={isAdded ? 'opacity-50' : 'cursor-pointer hover:shadow-md transition-shadow'}
        onClick={() => !isAdded && onAddBlock(block.type)}
      >
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{block.label}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {block.description}
              </CardDescription>
              {isAdded && (
                <p className="text-xs text-muted-foreground mt-2">
                  Already added
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>
            Choose a block type for your {currentPreset === 'life' ? 'Life' : 'Tribute'} page
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preset" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">
              {currentPreset === 'life' ? 'Life' : 'Tribute'} Blocks
            </TabsTrigger>
            <TabsTrigger value="shared">Shared Blocks</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {specificBlocks.map(renderBlockCard)}
            </div>
          </TabsContent>

          <TabsContent value="shared" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {sharedBlocks.map(renderBlockCard)}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}