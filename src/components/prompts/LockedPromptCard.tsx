import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Plus } from 'lucide-react'
import { Prompt } from '@/hooks/usePrompts'

interface LockedPromptCardProps {
  prompt: Prompt
  missingRelationship: string
  onAddPerson: (relationship: string) => void
}

export default function LockedPromptCard({ 
  prompt, 
  missingRelationship,
  onAddPerson 
}: LockedPromptCardProps) {
  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            {prompt.title}
          </CardTitle>
          <Badge variant="outline">
            {prompt.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground">
            {prompt.body}
          </p>
        </div>
        
        <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground mb-2">
            This prompt requires a family member with the role: <strong>{missingRelationship}</strong>
          </p>
          <Button 
            onClick={() => onAddPerson(missingRelationship)}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add person to answer this
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}