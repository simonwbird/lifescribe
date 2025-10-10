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
import { BLOCK_LIBRARY, BlockType } from '@/types/personPage'
import { 
  User, Calendar, Camera, BookOpen, Heart, 
  Users, Award, Star, Quote 
} from 'lucide-react'

const iconMap = {
  User, Calendar, Camera, BookOpen, Heart, 
  Users, Award, Star, Quote
}

interface BlockLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBlock: (type: BlockType) => void
  existingBlocks: BlockType[]
}

export default function BlockLibraryDialog({
  open,
  onOpenChange,
  onAddBlock,
  existingBlocks
}: BlockLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>
            Choose a block type to add to this page
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {BLOCK_LIBRARY.map((block) => {
            const Icon = iconMap[block.icon as keyof typeof iconMap]
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
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}