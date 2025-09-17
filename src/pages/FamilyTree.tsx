import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import ProfessionalFamilyTree from '@/components/family-tree/ProfessionalFamilyTree'
import { FamilyTreeCanvas } from '@/components/tree/FamilyTreeCanvas'
import GenerationalFamilyTree from '@/components/family-tree/GenerationalFamilyTree'
import VoiceCaptureModal from '@/components/voice/VoiceCaptureModal'
import { FamilyDataEditor } from '@/components/family-tree/FamilyDataEditor'
import { DuplicateDetector } from '@/components/family-tree/DuplicateDetector'
import { useLabs } from '@/hooks/useLabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TreePine,
  UserPlus,
  Users,
} from 'lucide-react'
import type { Person, Relationship } from '@/lib/familyTreeTypes'
import { useToast } from '@/hooks/use-toast'

export default function FamilyTree() {
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
  // Removed layout mode - always use interactive
  const [isVoiceCaptureOpen, setIsVoiceCaptureOpen] = useState(false)
  const [preselectedPeople, setPreselectedPeople] = useState<Array<{ id: string; name: string }>>([])
  const [showDataEditor, setShowDataEditor] = useState(false)
  
  const { labsEnabled } = useLabs()
  const [newPersonForm, setNewPersonForm] = useState({
    given_name: '',
    surname: '',
    birth_year: '',
    gender: ''
  })
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [isFirstTime, setIsFirstTime] = useState(false)
  // State to trigger fit-to-screen after adding a person
  const [shouldFitToScreen, setShouldFitToScreen] = useState(false)
  
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadFamilyData()
  }, [])

  const loadFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's family
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return
      setFamilyId(member.family_id)

      // Check if first time (no existing positions)
      const hasCompletedTutorial = localStorage.getItem('familyTree.tutorialCompleted')
      
      // Load people
      const { data: peopleData } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', member.family_id)
        .order('created_at')

      // Load profile photos separately and merge
      if (peopleData?.length) {
        // Get user links
        const { data: userLinks } = await supabase
          .from('person_user_links')
          .select('person_id, user_id')
          .in('person_id', peopleData.map(p => p.id))

        // Get profile photos for linked users
        if (userLinks?.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, avatar_url')
            .in('id', userLinks.map(link => link.user_id))

          // Merge photos into people data
          const peopleWithAvatars = peopleData.map(person => {
            const userLink = userLinks.find(link => link.person_id === person.id)
            const profile = userLink ? profiles?.find(p => p.id === userLink.user_id) : null
            return {
              ...person,
              avatar_url: profile?.avatar_url || person.avatar_url
            }
          })

          setPeople(peopleWithAvatars as Person[])
        } else {
          setPeople(peopleData as Person[])
        }
      } else {
        setPeople([])
      }

      // Load relationships with biological status
      const { data: relationshipsData } = await supabase
        .from('relationships')
        .select('*, is_biological')
        .eq('family_id', member.family_id)

      setRelationships(relationshipsData || [])
      
      // Debug the loaded data
      console.log('🌳 FamilyTree - Data loaded:', {
        familyId: member.family_id,
        peopleCount: peopleData?.length || 0,
        relationshipsCount: relationshipsData?.length || 0,
        samplePeople: peopleData?.slice(0, 2).map(p => ({ id: p.id, name: p.full_name })),
        sampleRelationships: relationshipsData?.slice(0, 2)
      })

      // Initialize positions for new family trees
      if (peopleData?.length && !hasCompletedTutorial) {
        setIsFirstTime(true)
        initializeDefaultPositions(peopleData as Person[])
      } else if (peopleData?.length) {
        loadSavedPositions(peopleData as Person[], member.family_id)
      }

      // If no people exist, create initial people from family members
      if (!peopleData?.length) {
        await createInitialPeople(member.family_id)
      }

    } catch (error) {
      console.error('Error loading family tree data:', error)
      toast({
        title: "Error",
        description: "Failed to load family tree data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultPositions = (peopleData: Person[]) => {
    const positions: Record<string, { x: number; y: number }> = {}
    peopleData.forEach((person, index) => {
      positions[person.id] = {
        x: (index % 4) * 300 + 200,
        y: Math.floor(index / 4) * 200 + 200
      }
    })
    setNodePositions(positions)
  }

  const loadSavedPositions = (peopleData: Person[], currentFamilyId: string) => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem(`familyTree.positions.${currentFamilyId}`)
    if (saved) {
      setNodePositions(JSON.parse(saved))
    } else {
      initializeDefaultPositions(peopleData)
    }
  }

  const createInitialPeople = async (familyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all family members
        const { data: members } = await supabase
        .from('members')
        .select(`
          profile_id,
          profiles (full_name)
        `)
        .eq('family_id', familyId)

      if (!members?.length) return

      // Create person entries for each family member
      const newPeople = []
      const personUserLinks = []

      for (const member of members) {
        if (member.profiles) {
          const personId = crypto.randomUUID()
          
          newPeople.push({
            id: personId,
            family_id: familyId,
            full_name: member.profiles.full_name || 'Family Member',
            created_by: user.id
          })

          personUserLinks.push({
            person_id: personId,
            user_id: member.profile_id,
            family_id: familyId
          })
        }
      }

      if (newPeople.length > 0) {
        const { data: insertedPeople } = await supabase
          .from('people')
          .insert(newPeople)
          .select()

        if (insertedPeople) {
          await supabase
            .from('person_user_links')
            .insert(personUserLinks)
          
          setPeople(insertedPeople as Person[])
        }
      }
    } catch (error) {
      console.error('Error creating initial people:', error)
    }
  }

  const handleRecordMemoryAbout = (personId: string, personName: string) => {
    setPreselectedPeople([{ id: personId, name: personName }])
    setIsVoiceCaptureOpen(true)
  }

  const handlePersonMove = (personId: string, x: number, y: number) => {
    setNodePositions(prev => ({
      ...prev,
      [personId]: { x, y }
    }))
  }

  const handleSaveLayout = () => {
    if (familyId) {
      localStorage.setItem(`familyTree.positions.${familyId}`, JSON.stringify(nodePositions))
      toast({
        title: "Layout Saved",
        description: "Your family tree layout has been saved"
      })
    }
  }

  const handleAddRelation = async (fromPersonId: string, toPersonId: string, type: 'parent' | 'spouse') => {
    if (!familyId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('relationships')
        .insert({
          family_id: familyId,
          from_person_id: fromPersonId,
          to_person_id: toPersonId,
          relationship_type: type,
          created_by: user.id
        })

      await loadFamilyData()
      toast({
        title: "Connection Added",
        description: `${type} relationship created successfully`
      })
    } catch (error) {
      console.error('Error connecting people:', error)
    }
  }

  const handleDeleteRelation = async (relationshipId: string) => {
    if (!familyId) return

    try {
      await supabase
        .from('relationships')
        .delete()
        .eq('id', relationshipId)

      await loadFamilyData()
      toast({
        title: "Connection Removed",
        description: "Relationship deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting relationship:', error)
      toast({
        title: "Error",
        description: "Failed to delete relationship",
        variant: "destructive"
      })
    }
  }

  const handleViewPerson = (personId: string) => {
    navigate(`/people/${personId}`)
  }

  const handleAddPerson = async () => {
    if (!familyId || !newPersonForm.given_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a first name",
        variant: "destructive"
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const full_name = `${newPersonForm.given_name} ${newPersonForm.surname}`.trim()
      
      const { data: newPerson, error } = await supabase
        .from('people')
        .insert({
          family_id: familyId,
          given_name: newPersonForm.given_name,
          surname: newPersonForm.surname,
          full_name,
          birth_year: newPersonForm.birth_year ? parseInt(newPersonForm.birth_year) : null,
          gender: newPersonForm.gender || null,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Position the new person in a visible area
      const newPersonId = newPerson.id
      const centerX = 400
      const centerY = 400
      
      // Update positions immediately to ensure the new person is visible
      setNodePositions(prev => ({
        ...prev,
        [newPersonId]: { x: centerX, y: centerY }
      }))

      // Reset form and close dialog
      setNewPersonForm({ given_name: '', surname: '', birth_year: '', gender: '' })
      setIsAddPersonOpen(false)
      
      // Reload data
      await loadFamilyData()
      
      // Trigger fit to screen to show the new person
      setShouldFitToScreen(true)
      
      toast({
        title: "Person Added",
        description: `${full_name} has been added to your family tree and is visible in the center`
      })

    } catch (error) {
      console.error('Error adding person:', error)
      toast({
        title: "Error",
        description: "Failed to add person. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Controls */}
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDataEditor(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Edit Relationships
              </Button>
              
              <DuplicateDetector 
                people={people} 
                onPersonsUpdated={loadFamilyData}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {people.length === 0 ? (
            <div className="container mx-auto px-4 py-16">
              <Card className="max-w-md mx-auto text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <TreePine className="h-6 w-6" />
                    Start Your Family Tree
                  </CardTitle>
                  <CardDescription>
                    Begin by adding the first person to your family tree
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsAddPersonOpen(true)} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Person
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <FamilyTreeCanvas
              people={people}
              relationships={relationships}
              familyId={familyId || ''}
              onPersonSelect={(personId) => {
                console.log('🔍 Person selected:', personId)
                console.log('📊 Current data state:', {
                  peopleCount: people.length,
                  relationshipsCount: relationships.length,
                  familyId
                })
              }}
              onPersonEdit={(personId) => navigate(`/people/${personId}`)}
              onPersonView={handleViewPerson}
            />
          )}
        </div>

        {/* Voice Capture Modal */}
        <VoiceCaptureModal
          open={isVoiceCaptureOpen}
          onClose={() => {
            setIsVoiceCaptureOpen(false)
            setPreselectedPeople([])
          }}
          preselectedPeople={preselectedPeople}
          onStoryCreated={(storyId) => {
            console.log('Story created:', storyId)
            // Optionally navigate to story or refresh data
          }}
        />

        {/* Family Data Editor Modal */}
        <FamilyDataEditor
          open={showDataEditor}
          onOpenChange={setShowDataEditor}
          familyId={familyId || ''}
          onDataChange={() => {
            // Refresh the family tree data
            loadFamilyData()
          }}
        />
      </div>
    </AuthGate>
  )
}