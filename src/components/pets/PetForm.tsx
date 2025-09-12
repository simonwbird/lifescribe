import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Save, ArrowLeft, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import type { Pet, PetSpecies, PetSex } from '@/lib/petTypes'
import { SPECIES_GROUPS, VACCINE_TEMPLATES } from '@/lib/petTypes'
import EnhancedMediaUploader from '@/components/story-wizard/EnhancedMediaUploader'
import type { MediaItem } from '@/components/story-wizard/StoryWizardTypes'

interface PetFormProps {
  isEditing?: boolean
}

export default function PetForm({ isEditing = false }: PetFormProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string>('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    sex: '' as PetSex | '',
    neutered: false,
    color: '',
    markings: '',
    dobApprox: '',
    gotchaDate: undefined as Date | undefined,
    status: 'current' as 'current' | 'past',
    microchipNumber: '',
    microchipProvider: '',
    vetName: '',
    vetPhone: '',
    vetEmail: '',
    insuranceProvider: '',
    insurancePolicy: '',
    weightKg: '',
    diet: '',
    allergies: '',
    medications: '',
    temperament: '',
    careInstructions: '',
    room: '',
    tags: [] as string[],
    favorites: [] as string[],
    media: [] as MediaItem[]
  })
  
  const [newTag, setNewTag] = useState('')
  const [newFavorite, setNewFavorite] = useState('')

  useEffect(() => {
    const loadUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (member) {
        setFamilyId(member.family_id)
        
        if (isEditing && id) {
          await loadPet(id, member.family_id)
        }
      }
    }

    loadUserAndData()
  }, [isEditing, id])

  const loadPet = async (petId: string, familyId: string) => {
    const { data: pet, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .eq('family_id', familyId)
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Could not load pet data",
        variant: "destructive"
      })
      return
    }

    if (pet) {
      setFormData({
        name: pet.name || '',
        species: pet.species || '',
        breed: pet.breed || '',
        sex: (pet.sex || '') as PetSex | '',
        neutered: pet.neutered || false,
        color: pet.color || '',
        markings: pet.markings || '',
        dobApprox: pet.dob_approx || '',
        gotchaDate: pet.gotcha_date ? new Date(pet.gotcha_date) : undefined,
        status: (pet.status || 'current') as 'current' | 'past',
        microchipNumber: pet.microchip_number || '',
        microchipProvider: pet.microchip_provider || '',
        vetName: pet.vet_name || '',
        vetPhone: pet.vet_phone || '',
        vetEmail: pet.vet_email || '',
        insuranceProvider: pet.insurance_provider || '',
        insurancePolicy: pet.insurance_policy || '',
        weightKg: pet.weight_kg?.toString() || '',
        diet: pet.diet || '',
        allergies: pet.allergies || '',
        medications: pet.medications || '',
        temperament: pet.temperament || '',
        careInstructions: pet.care_instructions || '',
        room: pet.room || '',
        tags: pet.tags || [],
        favorites: pet.favorites || [],
        media: [] // Media will be loaded separately if needed
      })
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Pet name is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const petData = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed || null,
        sex: formData.sex || null,
        neutered: formData.neutered,
        color: formData.color || null,
        markings: formData.markings || null,
        dob_approx: formData.dobApprox || null,
        gotcha_date: formData.gotchaDate ? format(formData.gotchaDate, 'yyyy-MM-dd') : null,
        status: formData.status,
        microchip_number: formData.microchipNumber || null,
        microchip_provider: formData.microchipProvider || null,
        vet_name: formData.vetName || null,
        vet_phone: formData.vetPhone || null,
        vet_email: formData.vetEmail || null,
        insurance_provider: formData.insuranceProvider || null,
        insurance_policy: formData.insurancePolicy || null,
        weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        diet: formData.diet || null,
        allergies: formData.allergies || null,
        medications: formData.medications || null,
        temperament: formData.temperament || null,
        care_instructions: formData.careInstructions || null,
        room: formData.room || null,
        tags: formData.tags,
        favorites: formData.favorites,
        family_id: familyId,
        created_by: user.id
      }

      if (isEditing && id) {
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', id)
          .eq('family_id', familyId)

        if (error) throw error

        toast({
          title: "Success",
          description: "Pet updated successfully"
        })
      } else {
        const { error } = await supabase
          .from('pets')
          .insert([petData])

        if (error) throw error

        toast({
          title: "Success",
          description: "Pet added successfully"
        })
      }

      navigate('/collections?tab=pet')
    } catch (error) {
      console.error('Error saving pet:', error)
      toast({
        title: "Error",
        description: "Failed to save pet",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addFavorite = () => {
    if (newFavorite.trim() && !formData.favorites.includes(newFavorite.trim())) {
      setFormData(prev => ({
        ...prev,
        favorites: [...prev.favorites, newFavorite.trim()]
      }))
      setNewFavorite('')
    }
  }

  const removeFavorite = (favorite: string) => {
    setFormData(prev => ({
      ...prev,
      favorites: prev.favorites.filter(f => f !== favorite)
    }))
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/collections?tab=pet')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Edit Pet' : 'Add New Pet'}
              </h1>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your pet's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="species">Species</Label>
                    <Select value={formData.species} onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SPECIES_GROUPS).map(([group, species]) => (
                          <optgroup key={group} label={group}>
                            {species.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                              </SelectItem>
                            ))}
                          </optgroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="breed">Breed</Label>
                    <Input
                      id="breed"
                      value={formData.breed}
                      onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                      placeholder="e.g., Golden Retriever, Maine Coon"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sex">Sex</Label>
                      <Select value={formData.sex} onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value as PetSex }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox 
                        id="neutered"
                        checked={formData.neutered}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, neutered: checked === true }))}
                      />
                      <Label htmlFor="neutered">Spayed/Neutered</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gotchaDate">Gotcha Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.gotchaDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.gotchaDate ? format(formData.gotchaDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.gotchaDate}
                          onSelect={(date) => setFormData(prev => ({ ...prev, gotchaDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'current' | 'past' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="past">Past (Memorial)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Health Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Health & Care</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vetName">Veterinarian</Label>
                    <Input
                      id="vetName"
                      value={formData.vetName}
                      onChange={(e) => setFormData(prev => ({ ...prev, vetName: e.target.value }))}
                      placeholder="Dr. Jane Smith"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vetPhone">Vet Phone</Label>
                    <Input
                      id="vetPhone"
                      value={formData.vetPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, vetPhone: e.target.value }))}
                      placeholder="555-VET-CARE"
                    />
                  </div>

                  <div>
                    <Label htmlFor="microchipNumber">Microchip Number</Label>
                    <Input
                      id="microchipNumber"
                      value={formData.microchipNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, microchipNumber: e.target.value }))}
                      placeholder="982000123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                      placeholder="e.g., PetPlan, Trupanion"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder="Known allergies or sensitivities"
                    />
                  </div>

                  <div>
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      value={formData.medications}
                      onChange={(e) => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                      placeholder="Current medications and dosages"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Photos & Media */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Photos & Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedMediaUploader
                    media={formData.media}
                    onChange={(media) => setFormData(prev => ({ ...prev, media }))}
                    maxFiles={10}
                  />
                </CardContent>
              </Card>

              {/* Tags & Favorites */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button onClick={addTag} size="icon" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Favorites */}
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Things</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newFavorite}
                      onChange={(e) => setNewFavorite(e.target.value)}
                      placeholder="What does your pet love?"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addFavorite()
                        }
                      }}
                    />
                    <Button onClick={addFavorite} size="icon" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.favorites.map((favorite) => (
                      <Badge key={favorite} variant="outline" className="flex items-center gap-1">
                        {favorite}
                        <button onClick={() => removeFavorite(favorite)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Care Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Care Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.careInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, careInstructions: e.target.value }))}
                  placeholder="Special care instructions, routines, behavioral notes..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline"
                onClick={() => navigate('/collections?tab=pet')}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : (isEditing ? 'Update Pet' : 'Add Pet')}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthGate>
  )
}