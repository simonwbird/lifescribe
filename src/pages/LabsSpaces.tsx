import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Header from '@/components/Header'
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Settings, 
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface FamilySpace {
  id: string
  name: string
  description: string
  member_count?: number
  created_at: string
  is_default?: boolean
}

export default function LabsSpaces() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [spaces, setSpaces] = useState<FamilySpace[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)
  const [defaultSpaceId, setDefaultSpaceId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [newSpaceDescription, setNewSpaceDescription] = useState('')

  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's profile with default space
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_space_id, feature_flags')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDefaultSpaceId(profile.default_space_id)
        setActiveSpaceId(profile.default_space_id) // Default to default space
      }

      // Get all families where user is a member
      const { data: memberData } = await supabase
        .from('members')
        .select(`
          family_id,
          families (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('profile_id', user.id)

      if (memberData) {
        const spacesData = memberData.map((member: any) => ({
          id: member.families.id,
          name: member.families.name,
          description: member.families.description,
          created_at: member.families.created_at,
          is_default: member.families.id === profile?.default_space_id
        }))
        setSpaces(spacesData)
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
      toast.error('Failed to load family spaces')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      toast.error('Space name is required')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create new family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: newSpaceName.trim(),
          description: newSpaceDescription.trim() || null,
          created_by: user.id
        })
        .select()
        .single()

      if (familyError) throw familyError

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          profile_id: user.id,
          family_id: family.id,
          role: 'admin'
        })

      if (memberError) throw memberError

      toast.success('Family space created successfully')
      setShowCreateDialog(false)
      setNewSpaceName('')
      setNewSpaceDescription('')
      loadSpaces()

    } catch (error) {
      console.error('Error creating space:', error)
      toast.error('Failed to create family space')
    }
  }

  const handleSetDefault = async (spaceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ default_space_id: spaceId })
        .eq('id', user.id)

      if (error) throw error

      setDefaultSpaceId(spaceId)
      toast.success('Default family space updated')

    } catch (error) {
      console.error('Error setting default space:', error)
      toast.error('Failed to update default space')
    }
  }

  const handleSetActive = (spaceId: string) => {
    setActiveSpaceId(spaceId)
    // In a real implementation, this would update the global state
    // and redirect the user's current view to the selected space
    toast.success('Active space changed (experimental)')
  }

  if (loading) {
    return (
      <AuthGate>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/labs" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Labs
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  Multiple Family Spaces
                  <Badge variant="secondary">Labs</Badge>
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage separate family spaces with their own feeds and digests
                </p>
              </div>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Space
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Family Space</DialogTitle>
                    <DialogDescription>
                      Create a separate space for different family branches or groups
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="space-name">Space Name</Label>
                      <Input
                        id="space-name"
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        placeholder="e.g., Extended Family, In-Laws"
                      />
                    </div>
                    <div>
                      <Label htmlFor="space-description">Description (optional)</Label>
                      <Input
                        id="space-description"
                        value={newSpaceDescription}
                        onChange={(e) => setNewSpaceDescription(e.target.value)}
                        placeholder="Brief description of this family space"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSpace}>
                      Create Space
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Experimental Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Experimental Feature:</strong> Multiple family spaces is an experimental feature. 
                Data switching and cross-space functionality may be unstable.
              </AlertDescription>
            </Alert>

            {/* Spaces List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Family Spaces</h2>
              
              {spaces.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Family Spaces</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have access to any family spaces yet.
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      Create Your First Space
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {spaces.map((space) => (
                    <Card key={space.id} className={activeSpaceId === space.id ? 'ring-2 ring-primary' : ''}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{space.name}</h3>
                              {space.is_default && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                              {activeSpaceId === space.id && (
                                <Badge variant="default">Active</Badge>
                              )}
                            </div>
                            {space.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {space.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(space.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {activeSpaceId !== space.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetActive(space.id)}
                              >
                                Switch To
                              </Button>
                            )}
                            
                            {!space.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(space.id)}
                              >
                                Set as Default
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  How Multiple Spaces Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Each family space has its own stories, people, and weekly digest settings</p>
                <p>• Your <strong>default space</strong> is used when the multi-space feature is disabled</p>
                <p>• The <strong>active space</strong> determines what content you see in feeds and collections</p>
                <p>• Turning off this Labs feature will revert to single-space mode using your default space</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
   )
 }