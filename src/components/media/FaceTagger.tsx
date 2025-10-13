import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, X, User, Sparkles } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

interface FaceSuggestion {
  personId: string
  name: string
  confidence: number
}

interface FaceTaggerProps {
  imageUrl: string
  imageId: string
  familyId: string
  onTagged?: () => void
  onCancel?: () => void
}

export default function FaceTagger({
  imageUrl,
  imageId,
  familyId,
  onTagged,
  onCancel,
}: FaceTaggerProps) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentBox, setCurrentBox] = useState<FaceBox | null>(null)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [showNamePicker, setShowNamePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<FaceSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [people, setPeople] = useState<Array<{ id: string; given_name: string; surname?: string }>>([])

  useEffect(() => {
    loadPeople()
  }, [familyId])

  const loadPeople = async () => {
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .eq('family_id', familyId)
        .order('given_name')

      if (error) throw error
      setPeople((data || []) as any[])
    } catch (error) {
      console.error('Failed to load people:', error)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || showNamePicker) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setStartPoint({ x, y })
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const currentX = ((e.clientX - rect.left) / rect.width) * 100
    const currentY = ((e.clientY - rect.top) / rect.height) * 100
    
    setCurrentBox({
      x: Math.min(startPoint.x, currentX),
      y: Math.min(startPoint.y, currentY),
      width: Math.abs(currentX - startPoint.x),
      height: Math.abs(currentY - startPoint.y),
    })
  }

  const handleMouseUp = async () => {
    if (!isDrawing || !currentBox) return
    
    setIsDrawing(false)
    setStartPoint(null)
    
    // Minimum box size check
    if (currentBox.width < 2 || currentBox.height < 2) {
      setCurrentBox(null)
      toast({
        title: "Box too small",
        description: "Draw a larger box around the face",
        variant: "destructive",
      })
      return
    }
    
    // Get AI suggestions for this face
    await getSuggestions(currentBox)
    setShowNamePicker(true)
  }

  const getSuggestions = async (box: FaceBox) => {
    // Mock AI suggestions - in production, send box coords to AI edge function
    const mockSuggestions: FaceSuggestion[] = []
    
    // Simulate high confidence match
    if (people.length > 0) {
      mockSuggestions.push({
        personId: people[0].id,
        name: `${people[0].given_name}${people[0].surname ? ' ' + people[0].surname : ''}`,
        confidence: 0.92,
      })
    }
    
    if (people.length > 1) {
      mockSuggestions.push({
        personId: people[1].id,
        name: `${people[1].given_name}${people[1].surname ? ' ' + people[1].surname : ''}`,
        confidence: 0.68,
      })
    }
    
    setSuggestions(mockSuggestions)
    setSelectedIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showNamePicker) return
    
    const filteredPeople = getFilteredPeople()
    const items = [...suggestions, ...filteredPeople.filter(p => 
      !suggestions.some(s => s.personId === p.id)
    )]
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length)
        break
      case 'Enter':
        e.preventDefault()
        if (items[selectedIndex]) {
          const item = items[selectedIndex]
          const personId = 'personId' in item ? item.personId : item.id
          confirmTag(personId)
        }
        break
      case 'Escape':
        e.preventDefault()
        handleCancel()
        break
    }
  }

  const getFilteredPeople = () => {
    const query = searchQuery.toLowerCase()
    return people.filter(p => 
      `${p.given_name} ${p.surname || ''}`.toLowerCase().includes(query)
    )
  }

  const confirmTag = async (personId: string) => {
    if (!currentBox) return
    
    try {
      const { error } = await supabase
        .from('entity_links')
        .insert({
          family_id: familyId,
          entity_type: 'person',
          entity_id: personId,
          source_type: 'media',
          source_id: imageId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          position_x: currentBox.x,
          position_y: currentBox.y,
          position_width: currentBox.width,
          position_height: currentBox.height,
        })

      if (error) throw error

      toast({
        title: "Face tagged! ✓",
        description: "Person added to this photo",
      })

      setCurrentBox(null)
      setShowNamePicker(false)
      setSearchQuery('')
      onTagged?.()
    } catch (error) {
      console.error('Failed to tag face:', error)
      toast({
        title: "Failed to tag",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setCurrentBox(null)
    setShowNamePicker(false)
    setSearchQuery('')
    setSuggestions([])
    onCancel?.()
  }

  const filteredPeople = getFilteredPeople()
  const highConfidenceSuggestion = suggestions.find(s => s.confidence >= 0.85)

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full group"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="img"
      aria-label="Click and drag to tag a face"
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Tag faces in this photo"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* Drawing overlay */}
      {currentBox && (
        <div
          className="absolute border-4 border-primary bg-primary/10 pointer-events-none"
          style={{
            left: `${currentBox.x}%`,
            top: `${currentBox.y}%`,
            width: `${currentBox.width}%`,
            height: `${currentBox.height}%`,
          }}
          role="region"
          aria-label="Face selection box"
        >
          {/* Corner handles for accessibility/visibility */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary rounded-full" aria-hidden="true" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full" aria-hidden="true" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary rounded-full" aria-hidden="true" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full" aria-hidden="true" />
        </div>
      )}

      {/* Name picker modal */}
      {showNamePicker && currentBox && (
        <div
          className="absolute z-50 bg-background border border-border rounded-lg shadow-2xl p-4 min-w-[280px] max-w-sm"
          style={{
            left: `${Math.min(currentBox.x + currentBox.width + 2, 70)}%`,
            top: `${currentBox.y}%`,
          }}
          role="dialog"
          aria-label="Tag person"
        >
          {/* High confidence suggestion */}
          {highConfidenceSuggestion && (
            <div className="mb-3 p-3 bg-accent rounded-lg border border-primary">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Is this {highConfidenceSuggestion.name}?</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => confirmTag(highConfidenceSuggestion.personId)}
                  className="flex-1"
                  aria-label={`Confirm tag as ${highConfidenceSuggestion.name}`}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSuggestions(suggestions.filter(s => s !== highConfidenceSuggestion))}
                  aria-label="Not this person"
                >
                  <X className="h-4 w-4 mr-1" />
                  No
                </Button>
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="mb-3">
            <Input
              placeholder="Search or type name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(0)
              }}
              autoFocus={!highConfidenceSuggestion}
              aria-label="Search for person to tag"
            />
          </div>

          {/* Suggestions list */}
          <div className="max-h-48 overflow-y-auto space-y-1" role="listbox">
            {suggestions.filter(s => s !== highConfidenceSuggestion).map((suggestion, idx) => (
              <button
                key={suggestion.personId}
                onClick={() => confirmTag(suggestion.personId)}
                className={`w-full flex items-center justify-between p-2 rounded hover:bg-accent transition-colors ${
                  selectedIndex === idx ? 'bg-accent ring-2 ring-primary' : ''
                }`}
                role="option"
                aria-selected={selectedIndex === idx}
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" aria-hidden="true" />
                  {suggestion.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </button>
            ))}

            {filteredPeople
              .filter(p => !suggestions.some(s => s.personId === p.id))
              .map((person, idx) => {
                const adjustedIdx = idx + suggestions.filter(s => s !== highConfidenceSuggestion).length
                return (
                  <button
                    key={person.id}
                    onClick={() => confirmTag(person.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors ${
                      selectedIndex === adjustedIdx ? 'bg-accent ring-2 ring-primary' : ''
                    }`}
                    role="option"
                    aria-selected={selectedIndex === adjustedIdx}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    {person.given_name} {person.surname}
                  </button>
                )
              })}

            {filteredPeople.length === 0 && suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matches found
              </p>
            )}
          </div>

          {/* Keyboard hints */}
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> navigate •{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> confirm •{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> cancel
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="w-full mt-2"
            aria-label="Cancel tagging"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Instruction overlay on hover */}
      {!showNamePicker && !isDrawing && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">Click and drag to tag a face</p>
          </div>
        </div>
      )}
    </div>
  )
}
