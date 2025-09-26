import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, BookOpen } from 'lucide-react'
import { PromptInstance } from '@/hooks/usePrompts'
import PersonChip from './PersonChip'
import { ResponseModal } from './ResponseModal'
import { useNavigate } from 'react-router-dom'

interface TodaysPromptCardProps {
  promptInstance: PromptInstance | null
  onRespond: (instanceId: string) => void
  onBrowseAll: () => void
  people?: Array<{ id: string; full_name: string }> // For person chips
}

export default function TodaysPromptCard({ 
  promptInstance, 
  onRespond, 
  onBrowseAll,
  people = []
}: TodaysPromptCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false)
  const navigate = useNavigate()

  const handleResponseSelect = (type: 'voice' | 'text' | 'video') => {
    setShowResponseModal(false)
    
    if (!promptInstance) return
    
    const searchParams = new URLSearchParams({
      type,
      promptTitle: promptInstance.prompt?.title || '',
      prompt_id: promptInstance.id,
      prompt_text: promptInstance.prompt?.body || ''
    })
    
    navigate(`/stories/new?${searchParams.toString()}`)
  }
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
          
          {/* Person chips for person-specific prompts */}
          {promptInstance.person_ids && promptInstance.person_ids.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {promptInstance.person_ids.map(personId => {
                const person = people.find(p => p.id === personId)
                return person ? (
                  <PersonChip key={personId} name={person.full_name} />
                ) : null
              })}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => setShowResponseModal(true)}
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

      {/* Response Modal */}
      {promptInstance?.prompt && (
        <ResponseModal
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          prompt={{
            title: promptInstance.prompt.title,
            body: promptInstance.prompt.body
          }}
          onSelectResponse={handleResponseSelect}
        />
      )}
    </Card>
  )
}