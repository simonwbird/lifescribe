import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface PromptOfTheWeekProps {
  personId: string
  onAnswer?: (answer: string) => void
}

export function PromptOfTheWeek({ personId, onAnswer }: PromptOfTheWeekProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [answer, setAnswer] = useState('')

  // This could be fetched from an edge function or hardcoded weekly prompts
  const weeklyPrompt = "What's a small moment you're grateful for this week?"

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({
        title: 'Please write an answer',
        variant: 'destructive'
      })
      return
    }

    onAnswer?.(answer)
    toast({
      title: 'Answer saved!',
      description: 'Your response has been recorded'
    })
    setAnswer('')
    setShowAnswer(false)
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="uppercase tracking-wide">Prompt of the Week</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base font-medium">{weeklyPrompt}</p>
        
        {!showAnswer ? (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => setShowAnswer(true)}
          >
            Answer
          </Button>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit}>
                Submit
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setShowAnswer(false)
                  setAnswer('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
