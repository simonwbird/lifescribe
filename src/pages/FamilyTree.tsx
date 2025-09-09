import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import FamilyTreeNode from '@/components/FamilyTreeNode'
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
  Search,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  UserPlus,
  Maximize2,
  RotateCcw
} from 'lucide-react'
import type { Person, Relationship, TreePreference, TreeGraph } from '@/lib/familyTreeTypes'
import { buildFamilyTree, getPersonDisplayName } from '@/utils/familyTreeUtils'
import { useToast } from '@/hooks/use-toast'

export default function FamilyTree() {
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [treeGraph, setTreeGraph] = useState<TreeGraph>({ nodes: [], relationships: [], people: [] })
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rootPersonId, setRootPersonId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
  const [newPersonForm, setNewPersonForm] = useState({
    given_name: '',
    surname: '',
    birth_year: '',
    gender: ''
  })
  const [isGedcomModalOpen, setIsGedcomModalOpen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    loadFamilyData()
  }, [])

  useEffect(() => {
    if (people.length > 0) {
      const graph = buildFamilyTree(people, relationships, rootPersonId || undefined)
      setTreeGraph(graph)
    }
  }, [people, relationships, rootPersonId])

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

      // Load tree preference
      const { data: preference } = await supabase
        .from('tree_preferences')
        .select('root_person_id')
        .eq('user_id', user.id)
        .eq('family_id', member.family_id)
        .single()

      if (preference?.root_person_id) {
        setRootPersonId(preference.root_person_id)
      }

      // Load people
      const { data: peopleData } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', member.family_id)
        .order('created_at')

      setPeople(peopleData as Person[] || [])

      // Load relationships  
      const { data: relationshipsData } = await supabase
        .from('relationships')
        .select('*')
        .eq('family_id', member.family_id)

      setRelationships(relationshipsData || [])

      // If no people exist, suggest creating person nodes for current family members
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

  const createInitialPeople = async (familyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all family members
      const { data: members } = await supabase
        .from('members')
        .select(`
          profile_id,
          profiles (full_name, email)
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
            full_name: member.profiles.full_name || member.profiles.email,
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

  const handleRootChange = async (personId: string) => {
    setRootPersonId(personId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !familyId) return

      await supabase
        .from('tree_preferences')
        .upsert({
          user_id: user.id,
          family_id: familyId,
          root_person_id: personId,
          updated_at: new Date().toISOString()
        })

      toast({
        title: "Root Updated",
        description: "Tree has been re-centered on the selected person"
      })
    } catch (error) {
      console.error('Error saving tree preference:', error)
    }
  }

  const handleViewPerson = (personId: string) => {
    navigate(`/people/${personId}`)
  }

  const handleAddParent = (personId: string) => {
    // TODO: Open person creation modal with parent relationship
    toast({
      title: "Add Parent",
      description: "Person creation with relationships will be implemented next"
    })
  }

  const handleAddChild = (personId: string) => {
    // TODO: Open person creation modal with child relationship
    toast({
      title: "Add Child", 
      description: "Person creation with relationships will be implemented next"
    })
  }

  const handleAddSpouse = (personId: string) => {
    // TODO: Open person creation modal with spouse relationship
    toast({
      title: "Add Spouse",
      description: "Person creation with relationships will be implemented next"
    })
  }

  const handleEditPerson = (personId: string) => {
    // TODO: Open person edit modal
    toast({
      title: "Edit Person",
      description: "Person editing will be implemented next"
    })
  }

  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (direction === 'fit') {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    } else {
      setZoom(prev => {
        const newZoom = direction === 'in' ? Math.min(prev * 1.2, 3) : Math.max(prev * 0.8, 0.3)
        return newZoom
      })
    }
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

      // Reset form and close dialog
      setNewPersonForm({ given_name: '', surname: '', birth_year: '', gender: '' })
      setIsAddPersonOpen(false)
      
      // Reload data
      await loadFamilyData()
      
      toast({
        title: "Person Added",
        description: `${full_name} has been added to your family tree`
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

  const filteredPeople = people.filter(person =>
    getPersonDisplayName(person).toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        
        {/* Toolbar */}
        <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95 sticky top-16 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <TreePine className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Family Tree</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Root Selector */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="root-select" className="text-sm font-medium">Root:</Label>
                  <Select value={rootPersonId} onValueChange={handleRootChange}>
                    <SelectTrigger id="root-select" className="w-48">
                      <SelectValue placeholder="Select root person" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {getPersonDisplayName(person)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                  />
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1">
                  <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleZoom('fit')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Dialog open={isGedcomModalOpen} onOpenChange={setIsGedcomModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Import GEDCOM
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Import GEDCOM File</DialogTitle>
                        <DialogDescription>
                          Upload a GEDCOM (.ged) file to import family tree data.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">GEDCOM import functionality will be implemented next.</p>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Person
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Person</DialogTitle>
                        <DialogDescription>
                          Add a new person to your family tree.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="given_name">First Name *</Label>
                            <Input
                              id="given_name"
                              value={newPersonForm.given_name}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, given_name: e.target.value }))}
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <Label htmlFor="surname">Last Name</Label>
                            <Input
                              id="surname"
                              value={newPersonForm.surname}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, surname: e.target.value }))}
                              placeholder="Smith"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="birth_year">Birth Year</Label>
                            <Input
                              id="birth_year"
                              type="number"
                              value={newPersonForm.birth_year}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, birth_year: e.target.value }))}
                              placeholder="1990"
                            />
                          </div>
                          <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={newPersonForm.gender} onValueChange={(value) => setNewPersonForm(prev => ({ ...prev, gender: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button variant="outline" onClick={() => setIsAddPersonOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddPerson}>
                            Add Person
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-hidden">
          <div 
            ref={containerRef}
            className="w-full h-[calc(100vh-140px)] overflow-auto bg-gradient-to-br from-slate-50 to-white"
          >
            <div 
              className="min-w-full min-h-full flex items-center justify-center p-8"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center'
              }}
            >
              {treeGraph.nodes.length > 0 ? (
                <div className="family-tree-container">
                  {treeGraph.nodes.map((node) => (
                    <FamilyTreeNode
                      key={node.id}
                      node={node}
                      onViewPerson={handleViewPerson}
                      onAddParent={handleAddParent}
                      onAddChild={handleAddChild}
                      onAddSpouse={handleAddSpouse}
                      onEditPerson={handleEditPerson}
                    />
                  ))}
                </div>
              ) : (
                <Card className="max-w-md mx-auto">
                  <CardHeader className="text-center">
                    <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <CardTitle>No Family Tree Yet</CardTitle>
                    <CardDescription>
                      Start building your family tree by adding people and their relationships.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Person
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}