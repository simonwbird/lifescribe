import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, CheckCircle, Clock, Circle } from 'lucide-react'
import { usePrompts, PromptInstance } from '@/hooks/usePrompts'
import { Person } from '@/utils/personUtils'

interface PersonPromptsTabProps {
  person: Person
  familyId: string
  onStartPrompt: (instanceId: string) => void
}

export default function PersonPromptsTab({ 
  person, 
  familyId, 
  onStartPrompt 
}: PersonPromptsTabProps) {
  const { instances, loading, getPersonProgress, getNextPromptForPerson } = usePrompts(familyId, person.id)
  
  const progress = getPersonProgress(person.id)
  const nextPrompt = getNextPromptForPerson(person.id)
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

  const getStatusIcon = (instance: PromptInstance) => {
    switch (instance.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'open':
        return <Circle className="h-4 w-4 text-muted-foreground" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (instance: PromptInstance) => {
    switch (instance.status) {
      case 'completed':
        return 'Complete'
      case 'in_progress':
        return 'In Progress'
      case 'open':
        return 'Not started'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Prompt Progress</h3>
          <span className="text-sm text-muted-foreground">
            {progress.completed} of {progress.total} done
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Next Prompt Action */}
      {nextPrompt && (
        <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium">Next: {nextPrompt.prompt?.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {nextPrompt.prompt?.body}
              </p>
            </div>
            <Badge variant="outline">
              {nextPrompt.prompt?.category}
            </Badge>
          </div>
          <Button 
            onClick={() => onStartPrompt(nextPrompt.id)}
            className="w-full flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start this prompt
          </Button>
        </div>
      )}

      {/* All Prompts List */}
      <div className="space-y-3">
        <h3 className="font-semibold">All Prompts for {person.given_name}</h3>
        
        {progress.instances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No prompts available for {person.given_name} yet.</p>
            <p className="text-sm mt-1">
              Prompts will appear based on their relationships in the family tree.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {progress.instances
              .sort((a, b) => {
                // Sort: in_progress first, then open, then completed
                const statusOrder = { 'in_progress': 0, 'open': 1, 'completed': 2 }
                return statusOrder[a.status] - statusOrder[b.status]
              })
              .map((instance) => (
                <div 
                  key={instance.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(instance)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {instance.prompt?.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {instance.prompt?.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(instance)}
                      </p>
                    </div>
                  </div>
                  
                  {instance.status !== 'completed' && (
                    <Button
                      onClick={() => onStartPrompt(instance.id)}
                      size="sm"
                      variant={instance.status === 'in_progress' ? 'default' : 'outline'}
                      className="ml-2"
                    >
                      {instance.status === 'in_progress' ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}