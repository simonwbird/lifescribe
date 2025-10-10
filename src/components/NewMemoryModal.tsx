import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Image, Mic } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'

interface Family {
  id: string
  name: string
}

interface NewMemoryModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type MemoryType = 'text' | 'photo' | 'voice'

const LAST_FAMILY_KEY = 'lastUsedFamilyId'
const LAST_TYPE_KEY = 'lastUsedMemoryType'

export function NewMemoryModal({ isOpen, onOpenChange }: NewMemoryModalProps) {
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { toast } = useToast()
  const [families, setFamilies] = useState<Family[]>([])
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')
  const [lastUsedType, setLastUsedType] = useState<MemoryType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadFamilies()
    }
  }, [isOpen])

  async function loadFamilies() {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberships, error } = await supabase
        .from('members')
        .select('family_id, families:family_id(id, name)')
        .eq('profile_id', user.id)

      if (error) throw error

      const familyList = memberships?.map((m: any) => ({
        id: m.families?.id,
        name: m.families?.name || 'Family'
      })).filter(f => f.id) || []

      setFamilies(familyList)

      // Auto-select if only one family
      if (familyList.length === 1) {
        setSelectedFamilyId(familyList[0].id)
      } else {
        // Try to restore last used family
        const lastUsedFamily = localStorage.getItem(LAST_FAMILY_KEY)
        if (lastUsedFamily && familyList.some(f => f.id === lastUsedFamily)) {
          setSelectedFamilyId(lastUsedFamily)
        }
      }

      // Restore last used memory type for highlighting
      const lastType = localStorage.getItem(LAST_TYPE_KEY) as MemoryType | null
      if (lastType) {
        setLastUsedType(lastType)
      }
    } catch (error) {
      console.error('Error loading families:', error)
      toast({
        title: 'Error',
        description: 'Failed to load families. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleContinue(type: MemoryType) {
    if (!selectedFamilyId) {
      toast({
        title: 'Select a family',
        description: 'Please select which family this memory is for.',
        variant: 'destructive'
      })
      return
    }

    // Save last used family
    localStorage.setItem(LAST_FAMILY_KEY, selectedFamilyId)
    // Save last used type
    localStorage.setItem(LAST_TYPE_KEY, type)

    // Track selection
    track('new_memory_selected', { type, family_id: selectedFamilyId })

    // Close modal
    onOpenChange(false)

    // Navigate to creation page
    navigate(`/stories/new?type=${type}&family_id=${selectedFamilyId}`)
  }

  // Keyboard shortcuts when modal is open
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedFamilyId) return // Require family selection first

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        handleContinue('text')
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handleContinue('photo')
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        handleContinue('voice')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedFamilyId])

  const memoryOptions = [
    {
      type: 'text' as MemoryType,
      icon: BookOpen,
      title: 'Text Story',
      description: 'Write a memory',
      testId: 'new-memory-option-text',
      shortcut: 'T'
    },
    {
      type: 'photo' as MemoryType,
      icon: Image,
      title: 'Photo Story',
      description: 'Add photos',
      testId: 'new-memory-option-photo',
      shortcut: 'P'
    },
    {
      type: 'voice' as MemoryType,
      icon: Mic,
      title: 'Voice Memory',
      description: 'Record or upload audio',
      testId: 'new-memory-option-voice',
      shortcut: 'V'
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        data-testid="new-memory-modal"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a New Memory</DialogTitle>
          <DialogDescription>
            Choose how you'd like to capture this moment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Family Selector - only show if multiple families */}
          {families.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Which family is this memory for?
              </label>
              <Select
                data-testid="new-memory-family-select"
                value={selectedFamilyId}
                onValueChange={setSelectedFamilyId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a family" />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Memory Type Options */}
          <div className="grid gap-4 sm:grid-cols-3">
            {memoryOptions.map((option) => {
              const Icon = option.icon
              return (
                <Card
                  key={option.type}
                  data-testid={option.testId}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    lastUsedType === option.type ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => handleContinue(option.type)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleContinue(option.type)
                    }
                  }}
                >
                  <CardContent className="flex flex-col items-center text-center p-6 space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      lastUsedType === option.type ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2 justify-center">
                        {option.title}
                        {lastUsedType === option.type && (
                          <span className="text-xs text-primary">(Last used)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    <Button
                      data-testid="new-memory-continue"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContinue(option.type)
                      }}
                    >
                      Continue
                      <span className="ml-2 text-xs text-muted-foreground">
                        {option.shortcut}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Keyboard shortcuts hint */}
          {selectedFamilyId && (
            <p className="text-xs text-center text-muted-foreground">
              Keyboard shortcuts: T for Text, P for Photo, V for Voice
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
