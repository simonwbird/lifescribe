import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Inbox, CheckCircle2, EyeOff } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { MemoryCard } from '@/components/memory/MemoryCard'

interface Memory {
  id: string
  person_id: string
  contributor_user: string | null
  contributor_name: string | null
  relationship_to_person: string | null
  modality: 'text' | 'voice' | 'photo'
  prompt_id: string | null
  title: string | null
  body: string | null
  audio_url: string | null
  photo_url: string | null
  year_approx: number | null
  place_id: string | null
  tags: string[]
  visibility: string
  status: 'pending' | 'approved' | 'hidden' | 'rejected'
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
  tribute_sparks?: {
    text: string
  }
}

export default function ModerationQueue() {
  const { personId } = useParams<{ personId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [canModerate, setCanModerate] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'hidden'>('pending')

  // Check if user can moderate
  useEffect(() => {
    async function checkPermissions() {
      if (!user || !personId) return

      try {
        // Check person_roles for moderation permissions
        const { data: roleData, error: roleError } = await supabase
          .from('person_roles')
          .select('role')
          .eq('person_id', personId)
          .eq('profile_id', user.id)
          .is('revoked_at', null)
          .single()

        if (roleError && roleError.code !== 'PGRST116') {
          throw roleError
        }

        const hasRole = roleData && ['owner', 'steward', 'co_curator'].includes(roleData.role)

        // Also check if user is family admin
        const { data: personData, error: personError } = await supabase
          .from('people')
          .select('family_id')
          .eq('id', personId)
          .single()

        if (personError) throw personError

        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('role')
          .eq('family_id', personData.family_id)
          .eq('profile_id', user.id)
          .single()

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError
        }

        const isAdmin = memberData && memberData.role === 'admin'

        setCanModerate(hasRole || isAdmin)

        if (!hasRole && !isAdmin) {
          toast({
            title: 'Access denied',
            description: 'You do not have permission to moderate memories for this person.',
            variant: 'destructive'
          })
          navigate(-1)
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        setCanModerate(false)
      }
    }

    checkPermissions()
  }, [user, personId, navigate, toast])

  // Load memories
  useEffect(() => {
    async function loadMemories() {
      if (!personId) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('memories')
          .select(`
            *,
            tribute_sparks:prompt_id (
              text
            )
          `)
          .eq('person_id', personId)
          .eq('status', activeTab)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch profile data separately for contributors
        const profileIds = (data || [])
          .map(m => m.contributor_user)
          .filter((id): id is string => id !== null)

        let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {}

        if (profileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', profileIds)

          if (profiles) {
            profilesMap = profiles.reduce((acc, profile) => {
              acc[profile.id] = {
                full_name: profile.full_name,
                avatar_url: profile.avatar_url
              }
              return acc
            }, {} as Record<string, { full_name: string; avatar_url: string | null }>)
          }
        }

        // Attach profile data to memories
        const memoriesWithProfiles = (data || []).map(memory => ({
          ...memory,
          profiles: memory.contributor_user ? profilesMap[memory.contributor_user] : undefined
        }))

        setMemories(memoriesWithProfiles as Memory[])
      } catch (error) {
        console.error('Error loading memories:', error)
        toast({
          title: 'Failed to load memories',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadMemories()
  }, [personId, activeTab, toast])

  const handleUpdate = async () => {
    // Reload memories after update
    if (!personId) return
    
    setLoading(true)
    
    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        tribute_sparks:prompt_id (
          text
        )
      `)
      .eq('person_id', personId)
      .eq('status', activeTab)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Fetch profile data separately for contributors
      const profileIds = data
        .map(m => m.contributor_user)
        .filter((id): id is string => id !== null)

      let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {}

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', profileIds)

        if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = {
              full_name: profile.full_name,
              avatar_url: profile.avatar_url
            }
            return acc
          }, {} as Record<string, { full_name: string; avatar_url: string | null }>)
        }
      }

      // Attach profile data to memories
      const memoriesWithProfiles = data.map(memory => ({
        ...memory,
        profiles: memory.contributor_user ? profilesMap[memory.contributor_user] : undefined
      }))

      setMemories(memoriesWithProfiles as Memory[])
    }
    
    setLoading(false)
  }

  if (!canModerate && !loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Memory Moderation</h1>
            <p className="text-muted-foreground">
              Review and approve submitted memories
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Pending
              {memories.filter(m => m.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {memories.filter(m => m.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="hidden" className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Hidden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading memories...</p>
              </Card>
            ) : memories.length === 0 ? (
              <Card className="p-8 text-center">
                <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pending memories</h3>
                <p className="text-muted-foreground">
                  All memories have been reviewed.
                </p>
              </Card>
            ) : (
              memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  canModerate={canModerate}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading memories...</p>
              </Card>
            ) : memories.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No approved memories</h3>
                <p className="text-muted-foreground">
                  Approved memories will appear here.
                </p>
              </Card>
            ) : (
              memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  canModerate={false}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="hidden" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading memories...</p>
              </Card>
            ) : memories.length === 0 ? (
              <Card className="p-8 text-center">
                <EyeOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No hidden memories</h3>
                <p className="text-muted-foreground">
                  Hidden memories will appear here.
                </p>
              </Card>
            ) : (
              memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  canModerate={canModerate}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
