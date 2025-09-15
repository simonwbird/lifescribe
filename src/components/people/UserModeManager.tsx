import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Monitor, Smartphone, Settings } from 'lucide-react'

interface UserModeManagerProps {
  person: {
    id: string
    full_name: string
    account_status?: string
    member_role?: string | null
  }
  personUserLink?: {
    user_id: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function UserModeManager({ 
  person, 
  personUserLink, 
  open, 
  onOpenChange, 
  onSuccess 
}: UserModeManagerProps) {
  const [currentMode, setCurrentMode] = useState<'simple' | 'studio' | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMode, setLoadingMode] = useState(false)
  const { toast } = useToast()

  // Load current mode when dialog opens
  useEffect(() => {
    if (open && personUserLink?.user_id) {
      loadUserMode()
    }
  }, [open, personUserLink?.user_id])

  const loadUserMode = async () => {
    if (!personUserLink?.user_id) return

    setLoadingMode(true)
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', personUserLink.user_id)
        .single()

      if (error) throw error

      const settings = (profile?.settings as any) || {}
      const mode = settings.mode || 'studio' // Default to studio
      setCurrentMode(mode)
    } catch (error) {
      console.error('Error loading user mode:', error)
      toast({
        title: "Error",
        description: "Failed to load current user mode",
        variant: "destructive"
      })
    } finally {
      setLoadingMode(false)
    }
  }

  const handleModeChange = async (newMode: 'simple' | 'studio') => {
    if (!personUserLink?.user_id || !currentMode) return

    setLoading(true)
    try {
      // Get current profile settings
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', personUserLink.user_id)
        .single()

      if (fetchError) throw fetchError

      const currentSettings = (profile?.settings as any) || {}
      const newSettings = {
        ...currentSettings,
        mode: newMode
      }

      // Update the mode
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          settings: newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', personUserLink.user_id)

      if (updateError) throw updateError

      setCurrentMode(newMode)
      
      toast({
        title: "Success",
        description: `${person.full_name}'s mode has been changed to ${newMode}`
      })

      onSuccess?.()
    } catch (error) {
      console.error('Error updating user mode:', error)
      toast({
        title: "Error",
        description: "Failed to update user mode",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getModeIcon = (mode: 'simple' | 'studio') => {
    return mode === 'simple' ? (
      <Smartphone className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    )
  }

  const getModeDescription = (mode: 'simple' | 'studio') => {
    return mode === 'simple' 
      ? 'Simplified interface with larger text and fewer options'
      : 'Full-featured interface with advanced tools and options'
  }

  if (!personUserLink?.user_id) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              User Mode Settings
            </DialogTitle>
            <DialogDescription>
              {person.full_name} is not linked to a user account. 
              Only users who have joined the family can have their mode changed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Mode Settings for {person.full_name}
          </DialogTitle>
          <DialogDescription>
            Change how this user experiences the family space
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loadingMode ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Current Mode Display */}
              {currentMode && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getModeIcon(currentMode)}
                    <div>
                      <div className="font-medium">Current Mode</div>
                      <div className="text-sm text-muted-foreground">
                        {getModeDescription(currentMode)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={currentMode === 'simple' ? 'secondary' : 'default'}>
                    {currentMode === 'simple' ? 'Simple' : 'Studio'}
                  </Badge>
                </div>
              )}

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Change Mode</label>
                <Select 
                  value={currentMode || undefined} 
                  onValueChange={handleModeChange}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Simple Mode</div>
                          <div className="text-xs text-muted-foreground">
                            Larger text, simplified interface
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="studio">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Studio Mode</div>
                          <div className="text-xs text-muted-foreground">
                            Full-featured interface
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <Smartphone className="h-4 w-4" />
                    Simple Mode
                  </div>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Larger, easier-to-read text</li>
                    <li>• Simplified navigation</li>
                    <li>• Reduced animation</li>
                    <li>• Essential features only</li>
                  </ul>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <Monitor className="h-4 w-4" />
                    Studio Mode
                  </div>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Full feature access</li>
                    <li>• Advanced creation tools</li>
                    <li>• Compact, information-dense</li>
                    <li>• All animations and effects</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}