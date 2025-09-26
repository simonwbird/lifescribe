import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowRight } from 'lucide-react'
import { PromptInstance } from '@/hooks/usePrompts'

interface ContinueSectionProps {
  instances: PromptInstance[]
  onContinue: (instanceId: string) => void
}

export default function ContinueSection({ instances, onContinue }: ContinueSectionProps) {
  if (instances.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" />
          Continue where you left off
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {instances.map((instance) => (
          <div key={instance.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-sm">
                {instance.prompt?.title || 'Untitled Prompt'}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {instance.prompt?.category}
                </Badge>
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Draft saved • finish anytime
                </span>
              </div>
            </div>
            <Button 
              onClick={() => onContinue(instance.id)}
              size="sm"
              variant="outline"
              className="ml-3"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}