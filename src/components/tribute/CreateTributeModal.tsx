import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Heart, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface CreateTributeModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  personId?: string
}

const THEMES = [
  { value: 'soft_blue', label: 'Soft Blue', colors: 'from-blue-50 to-blue-100' },
  { value: 'sunset_rose', label: 'Sunset Rose', colors: 'from-rose-50 to-orange-50' },
  { value: 'gentle_lavender', label: 'Gentle Lavender', colors: 'from-purple-50 to-pink-50' },
  { value: 'serene_green', label: 'Serene Green', colors: 'from-emerald-50 to-teal-50' }
]

const PRIVACY_OPTIONS = [
  { value: 'invite_only', label: 'Invite Only', description: 'Only people you invite can view' },
  { value: 'family', label: 'Family', description: 'All family members can view' },
  { value: 'public', label: 'Public', description: 'Anyone with the link can view' }
]

export function CreateTributeModal({ isOpen, onClose, familyId, personId }: CreateTributeModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('soft_blue')
  const [privacy, setPrivacy] = useState('invite_only')
  const [anniversaryDate, setAnniversaryDate] = useState<Date>()
  const [howWeMet, setHowWeMet] = useState('')
  const [whatTheyTaughtUs, setWhatTheyTaughtUs] = useState('')
  const [favoriteMemory, setFavoriteMemory] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const { toast } = useToast()
  const { track } = useAnalytics()
  const navigate = useNavigate()

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for the tribute',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: tribute, error } = await supabase
        .from('tributes')
        .insert({
          family_id: familyId,
          person_id: personId,
          created_by: user.id,
          title: title.trim(),
          description: description.trim() || null,
          theme,
          privacy,
          anniversary_date: anniversaryDate ? format(anniversaryDate, 'yyyy-MM-dd') : null,
          how_we_met: howWeMet.trim() || null,
          what_they_taught_us: whatTheyTaughtUs.trim() || null,
          favorite_memory: favoriteMemory.trim() || null
        })
        .select()
        .single()

      if (error) throw error

      track('tribute_created', { 
        tribute_id: tribute.id,
        theme,
        privacy,
        has_anniversary: !!anniversaryDate
      })

      toast({
        title: 'Tribute created',
        description: 'Your tribute page has been created'
      })

      onClose()
      navigate(`/tribute/${tribute.id}`)
    } catch (error) {
      console.error('Error creating tribute:', error)
      toast({
        title: 'Failed to create tribute',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Create a Tribute
          </DialogTitle>
          <DialogDescription>
            Create a memorial space to honor and remember someone special
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="In Memory of..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A brief introduction or dedication..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    theme === themeOption.value ? 'border-primary' : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <div className={cn('h-8 rounded mb-2 bg-gradient-to-br', themeOption.colors)} />
                  <p className="font-medium text-sm">{themeOption.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <Label>Privacy</Label>
            <RadioGroup value={privacy} onValueChange={setPrivacy}>
              {PRIVACY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Anniversary Date */}
          <div className="space-y-2">
            <Label>Anniversary Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {anniversaryDate ? format(anniversaryDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={anniversaryDate}
                  onSelect={setAnniversaryDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              We'll send "On this day" reminders to family members
            </p>
          </div>

          {/* Prompts */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Memorial Prompts (Optional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="how-we-met">How we met</Label>
              <Textarea
                id="how-we-met"
                placeholder="Share the story of how you first met..."
                value={howWeMet}
                onChange={(e) => setHowWeMet(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what-they-taught">What they taught us</Label>
              <Textarea
                id="what-they-taught"
                placeholder="Lessons, wisdom, or values they shared..."
                value={whatTheyTaughtUs}
                onChange={(e) => setWhatTheyTaughtUs(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorite-memory">Favorite memory</Label>
              <Textarea
                id="favorite-memory"
                placeholder="A cherished moment you want to remember..."
                value={favoriteMemory}
                onChange={(e) => setFavoriteMemory(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Tribute'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
