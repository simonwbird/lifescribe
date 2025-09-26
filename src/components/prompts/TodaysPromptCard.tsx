import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, BookOpen } from 'lucide-react'
import { PromptInstance } from '@/hooks/usePrompts'

interface TodaysPromptCardProps {
  promptInstance: PromptInstance | null
  onRespond: (instanceId: string) => void
  onBrowseAll: () => void
}

export default function TodaysPromptCard({ 
  promptInstance, 
  onRespond, 
  onBrowseAll 
}: TodaysPromptCardProps) {
  if (!promptInstance?.prompt) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center mb-4">
            No prompts available right now
          </p>
          <Button onClick={onBrowseAll} variant="outline">
            Browse All Prompts
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-background/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Prompt</CardTitle>
          <Badge variant="outline">
            {promptInstance.prompt.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-foreground mb-2">
            {promptInstance.prompt.title}
          </h3>
          <p className="text-muted-foreground">
            {promptInstance.prompt.body}
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => onRespond(promptInstance.id)}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            <Play className="h-4 w-4" />
            Respond to this prompt
          </Button>
          
          <Button 
            onClick={onBrowseAll}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Browse all prompts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}