import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Person, getUserRole, getPageType } from '@/utils/personUtils'
import Header from '@/components/Header'
import { LifePageHeader } from '@/components/people/LifePageHeader'
import { PortraitAbout } from '@/components/people/PortraitAbout'
import { PinnedStrip } from '@/components/people/PinnedStrip'
import { PersonTimeline } from '@/components/people/PersonTimeline'
import { PhotosStrip } from '@/components/people/PhotosStrip'
import { DatesPanel } from '@/components/people/DatesPanel'
import { Contributions } from '@/components/people/Contributions'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [person, setPerson] = useState<Person | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    
    const initializePage = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }
        setCurrentUserId(user.id)

        // Fetch person data
        const { data: personData, error: personError } = await supabase
          .from('people')
          .select('*')
          .eq('id', id)
          .single()

        if (personError) {
          if (personError.code === 'PGRST116') {
            setError('Person not found')
          } else {
            throw personError
          }
          return
        }

        // Get user link for this person to check for profile photo
        const { data: userLink } = await supabase
          .from('person_user_links')
          .select('user_id')
          .eq('person_id', id)
          .single()

        console.log('🔍 Person Profile Initial Load Debug:', {
          personId: id,
          userLink,
          personAvatar: personData.avatar_url
        })

        // If person is linked to a user, get their profile photo
        let finalPersonData = personData
        if (userLink?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userLink.user_id)
            .single()

          const authAvatar = userLink.user_id === user.id 
            ? ((user.user_metadata as any)?.avatar_url || (user.user_metadata as any)?.picture || null)
            : null

          const preferredAvatar = authAvatar || profile?.avatar_url || personData.avatar_url || null

          if (preferredAvatar) {
            finalPersonData = {
              ...personData,
              avatar_url: preferredAvatar
            }
            console.log('✅ Using preferred avatar for person:', finalPersonData.full_name, preferredAvatar)
          }
        }

        // Check user's role in this family
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('role')
          .eq('profile_id', user.id)
          .eq('family_id', personData.family_id)
          .single()

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError
        }

        setMemberRole(memberData?.role || null)
        setPerson(finalPersonData as Person)
        
      } catch (error) {
        console.error('Error loading person profile:', error)
        setError('Failed to load person profile')
        toast({
          title: "Error",
          description: "Failed to load person profile",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [id, navigate, toast])

  const refreshPerson = async () => {
    if (!id) return
    
    try {
      const { data: personData, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()

      // Get user link for this person to check for profile photo
      const { data: userLink } = await supabase
        .from('person_user_links')
        .select('user_id')
        .eq('person_id', id)
        .single()

      console.log('🔍 Person Profile Debug:', {
        personId: id,
        userLink,
        personAvatar: personData.avatar_url
      })

      // If person is linked to a user, get their profile photo
      let finalPersonData = personData
      if (userLink?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userLink.user_id)
          .single()

        const authAvatar = userLink.user_id === user?.id 
          ? ((user?.user_metadata as any)?.avatar_url || (user?.user_metadata as any)?.picture || null)
          : null

        const preferredAvatar = authAvatar || profile?.avatar_url || personData.avatar_url || null

        if (preferredAvatar) {
          finalPersonData = {
            ...personData,
            avatar_url: preferredAvatar
          }
          console.log('✅ Using preferred avatar for person:', finalPersonData.full_name, preferredAvatar)
        }
      }

      setPerson(finalPersonData as Person)
    } catch (error) {
      console.error('Error refreshing person data:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Person not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const userRole = getUserRole(person, currentUserId, memberRole)
  const pageType = getPageType(person)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <LifePageHeader 
          person={person} 
          userRole={userRole}
          pageType={pageType}
          onPersonUpdated={refreshPerson}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <PortraitAbout 
              person={person} 
              userRole={userRole}
              onPersonUpdated={refreshPerson}
            />
            
            <PinnedStrip 
              person={person}
              userRole={userRole}
              onPersonUpdated={refreshPerson}
            />
            
            <PersonTimeline 
              person={person}
              userRole={userRole}
              onRefresh={refreshPerson}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PhotosStrip person={person} />
            
            <DatesPanel 
              person={person}
              userRole={userRole}
              onPersonUpdated={refreshPerson}
            />
            
            <Contributions 
              person={person}
              userRole={userRole}
              pageType={pageType}
            />
          </div>
        </div>
      </div>
    </div>
  )
}