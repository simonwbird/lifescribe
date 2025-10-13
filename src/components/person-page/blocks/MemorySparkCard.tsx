import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shuffle, Pencil, Mic, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface MemorySpark {
  id: string
  text: string
}

interface MemorySparkCardProps {
  person: {
    id: string
    first_name?: string
    preferred_name?: string
    full_name?: string
  }
}

// Sample memory sparks - in production these would come from a database
const MEMORY_SPARKS: MemorySpark[] = [
  { id: '1', text: 'Tell us a moment that still makes you smile.' },
  { id: '2', text: 'Share a time when they made you laugh.' },
  { id: '3', text: 'What lesson did they teach you that you still carry today?' },
  { id: '4', text: 'Describe a favorite tradition or ritual you shared.' },
  { id: '5', text: 'What song, smell, or place reminds you of them?' },
  { id: '6', text: 'Share a story that captures their spirit.' },
  { id: '7', text: 'What would you want others to know about them?' },
  { id: '8', text: 'Tell us about a time they were there for you.' },
  { id: '9', text: 'What did they love to talk about?' },
  { id: '10', text: 'Share a memory from a special occasion together.' }
]

export default function MemorySparkCard({ person }: MemorySparkCardProps) {
  const [currentSpark, setCurrentSpark] = useState<MemorySpark>(MEMORY_SPARKS[0])
  const navigate = useNavigate()
  
  const firstName = person.first_name || person.preferred_name || person.full_name?.split(' ')[0] || 'them'

  useEffect(() => {
    // Randomly select a memory spark on mount
    const randomSpark = MEMORY_SPARKS[Math.floor(Math.random() * MEMORY_SPARKS.length)]
    setCurrentSpark(randomSpark)
  }, [])

  const handleShuffle = () => {
    // Pick a different spark
    let newSpark = currentSpark
    while (newSpark.id === currentSpark.id && MEMORY_SPARKS.length > 1) {
      newSpark = MEMORY_SPARKS[Math.floor(Math.random() * MEMORY_SPARKS.length)]
    }
    setCurrentSpark(newSpark)
  }

  const handleCapture = (type: 'text' | 'voice' | 'photo') => {
    // Navigate to story creation with the memory spark as a prompt
    const params = new URLSearchParams({
      type,
      promptTitle: `Share a memory of ${firstName}`,
      prompt_text: currentSpark.text,
      person_id: person.id
    })
    navigate(`/stories/new?${params.toString()}`)
  }

  return (
    <Card className="border-2 bg-background p-6" data-block="memory_spark">
      <div className="space-y-4">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Share a memory of {firstName}
        </div>
        
        <div className="text-xl font-medium leading-relaxed text-foreground">
          {currentSpark.text}
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
            onClick={handleShuffle}
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
