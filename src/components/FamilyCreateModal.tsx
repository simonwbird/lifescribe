import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Camera, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

interface FamilyCreateModalProps {
  open: boolean
  onClose: () => void
}

export default function FamilyCreateModal({ open, onClose }: FamilyCreateModalProps) {
  const [familyName, setFamilyName] = useState('')
  const [coverPhoto, setCoverPhoto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      // Create or update profile first
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || '',
          updated_at: new Date().toISOString(),
        })

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName.trim(),
          created_by: session.user.id,
        })
        .select()
        .single()

      if (familyError) throw familyError

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          family_id: family.id,
          profile_id: session.user.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      toast({
        title: "Family created!",
        description: `${familyName} is ready for memories`,
      })

      onClose()
      navigate('/home')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center">Create Your Family Space</DialogTitle>
          <DialogDescription className="text-center">
            Start preserving your family's memories and stories
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="familyName">Family Name</Label>
            <Input
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="The Johnson Family"
              className="text-center text-lg"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Family Photo (Optional)</Label>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                {coverPhoto ? (
                  <img src={coverPhoto} alt="Family" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <Button type="button" variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Add Photo Later
              </Button>
            </div>
          </div>

          {!isAuthenticated && (
            <Alert>
              <AlertDescription>
                Please sign in to create a family.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !familyName.trim() || !isAuthenticated} className="flex-1">
              {loading ? 'Creating...' : 'Create Family'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}