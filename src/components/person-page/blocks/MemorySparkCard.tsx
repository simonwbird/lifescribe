import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shuffle, Pencil, Mic, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemorySpark } from '@/hooks/useMemorySpark'

interface MemorySparkCardProps {
  person: {
    id: string
    first_name?: string
    preferred_name?: string
    full_name?: string
    birth_date?: string
    death_date?: string
  }
  viewer?: {
    relationship_to_person?: string
  }
  context?: {
    type?: 'photo' | 'place' | 'date'
    place?: string
  }
}

export default function MemorySparkCard({ person, viewer, context }: MemorySparkCardProps) {
  const navigate = useNavigate()
  const { currentSpark, interpolatedText, loading, shuffle } = useMemorySpark(person, viewer, context)
  
  const firstName = person.first_name || person.preferred_name || person.full_name?.split(' ')[0] || 'them'

  const handleCapture = (type: 'text' | 'voice' | 'photo') => {
    if (!interpolatedText) return
    
    // Navigate to story creation with the memory spark as a prompt
    const params = new URLSearchParams({
      type,
      promptTitle: `Share a memory of ${firstName}`,
      prompt_text: interpolatedText,
      person_id: person.id
    })
    navigate(`/stories/new?${params.toString()}`)
  }

  if (loading) {
    return (
      <Card className="border-2 bg-background p-6" data-block="memory_spark">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-1/4" />
        </div>
      </Card>
    )
  }

  if (!currentSpark || !interpolatedText) {
    return null
  }

  return (
    <Card className="border-2 bg-background p-6" data-block="memory_spark">
      <div className="space-y-4">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Share a memory of {firstName}
        </div>
        
        <div className="text-xl font-medium leading-relaxed text-foreground">
          {interpolatedText}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => handleCapture('text')}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Write
          </Button>
          
          <Button
            variant="outline"
            size="default"
            onClick={() => handleCapture('voice')}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Record voice
          </Button>
          
          <Button
            variant="outline"
            size="default"
            onClick={() => handleCapture('photo')}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Add photo
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffle}
            className="ml-auto text-xs opacity-70 hover:opacity-100"
          >
            <Shuffle className="w-3 h-3 mr-1" />
            Show another spark
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          A few sentences is perfect. Add a year or place if you remember.
        </p>
      </div>
    </Card>
  )
}
