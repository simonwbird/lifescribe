import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import Header from '@/components/Header'
import TextStoryForm from '@/components/story-create/TextStoryForm'
import PhotoStoryForm from '@/components/story-create/PhotoStoryForm'
import VoiceStoryForm from '@/components/story-create/VoiceStoryForm'
import FamilyPicker from '@/components/story-create/FamilyPicker'

export default function NewStory() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([])
  const [needsFamilyPicker, setNeedsFamilyPicker] = useState(false)
  
  // Get type from URL (?type=text|photo|voice)
  const typeParam = searchParams.get('type')
  const defaultTab = typeParam === 'photo' || typeParam === 'voice' ? typeParam : 'text'
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Fetch user's families
  useEffect(() => {
    async function loadFamilies() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/auth/login?next=/stories/new')
          return
        }

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
          setFamilyId(familyList[0].id)
        } else if (familyList.length > 1) {
          setNeedsFamilyPicker(true)
        }
      } catch (error) {
        console.error('Error loading families:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFamilies()
  }, [navigate])

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show family picker if needed
  if (needsFamilyPicker && !familyId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <FamilyPicker 
            families={families} 
            onSelect={setFamilyId}
          />
        </div>
      </div>
    )
  }

  if (!familyId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No family found. Please join or create a family first.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Create New Story</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text">
            <TextStoryForm familyId={familyId} />
          </TabsContent>
          
          <TabsContent value="photo">
            <PhotoStoryForm familyId={familyId} />
          </TabsContent>
          
          <TabsContent value="voice">
            <VoiceStoryForm familyId={familyId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
