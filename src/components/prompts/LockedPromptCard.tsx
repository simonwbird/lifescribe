import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Plus } from 'lucide-react'

interface LockedPrompt {
  role: string
  prompts: Array<{
    id: string
    title: string
    body: string
    category: string
  }>
}

interface LockedPromptCardProps {
  lockedPrompt: LockedPrompt
  onAddPerson: (relationship: string) => void
}

export default function LockedPromptCard({ 
  lockedPrompt, 
  onAddPerson 
}: LockedPromptCardProps) {
  const firstPrompt = lockedPrompt.prompts[0]
  
  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            {firstPrompt.title}
          </CardTitle>
          <Badge variant="outline">
            {firstPrompt.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground">
            {firstPrompt.body}
          </p>
          {lockedPrompt.prompts.length > 1 && (
            <p className="text-sm text-muted-foreground mt-2">
              +{lockedPrompt.prompts.length - 1} more prompts available
            </p>
          )}
        </div>
        
        <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground mb-2">
            This prompt requires a family member with the role: <strong>{lockedPrompt.role}</strong>
          </p>
          <Button 
            onClick={() => onAddPerson(lockedPrompt.role)}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {lockedPrompt.role} to unlock these prompts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}