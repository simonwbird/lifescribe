import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader'
import type { Person } from '@/lib/familyTreeTypes'

interface PersonFormProps {
  person?: Person
  familyId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function PersonForm({ person, familyId, onSuccess, onCancel }: PersonFormProps) {
  const [formData, setFormData] = useState({
    given_name: '',
    middle_name: '',
    surname: '',
    full_name: '',
    alt_names: [] as string[],
    birth_date: '',
    birth_date_precision: 'ymd',
    death_date: '',
    death_date_precision: 'ymd',
    is_living: true,
    gender: '',
    notes: '',
    avatar_url: ''
  })
  const [altNameInput, setAltNameInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (person) {
      setFormData({
        given_name: person.given_name || '',
        middle_name: person.middle_name || '',
        surname: person.surname || '',
        full_name: person.full_name || '',
        alt_names: person.alt_names || [],
        birth_date: person.birth_date || '',
        birth_date_precision: person.birth_date_precision || 'ymd',
        death_date: person.death_date || '',
        death_date_precision: person.death_date_precision || 'ymd',
        is_living: person.is_living !== false,
        gender: person.gender || '',
        notes: person.notes || '',
        avatar_url: person.avatar_url || ''
      })
    }
  }, [person])

  // Auto-generate full name
  useEffect(() => {
    const parts = [formData.given_name, formData.middle_name, formData.surname].filter(Boolean)
    if (parts.length > 0) {
      setFormData(prev => ({ ...prev, full_name: parts.join(' ') }))
    }
  }, [formData.given_name, formData.middle_name, formData.surname])

  const handleAddAltName = () => {
    if (altNameInput.trim() && !formData.alt_names.includes(altNameInput.trim())) {
      setFormData(prev => ({
        ...prev,
        alt_names: [...prev.alt_names, altNameInput.trim()]
      }))
      setAltNameInput('')
    }
  }

  const handleRemoveAltName = (name: string) => {
    setFormData(prev => ({
      ...prev,
      alt_names: prev.alt_names.filter(n => n !== name)
    }))
  }

  const handlePhotoUploaded = (newPhotoUrl: string) => {
    setFormData(prev => ({ ...prev, avatar_url: newPhotoUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const personData = {
        ...formData,
        family_id: familyId,
        birth_date: formData.birth_date || null,
        death_date: formData.death_date || null,
        created_by: user.id
      }

      if (person) {
        // Update existing person
        const { error } = await supabase
          .from('people')
          .update(personData)
          .eq('id', person.id)

        if (error) throw error
        
        toast({
          title: "Success",
          description: "Person updated successfully"
        })
      } else {
        // Create new person
        const { error } = await supabase
          .from('people')
          .insert([personData])

        if (error) throw error
        
        toast({
          title: "Success", 
          description: "Person created successfully"
        })
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving person:', error)
      toast({
        title: "Error",
        description: "Failed to save person",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="given_name">Given Name *</Label>
              <Input
                id="given_name"
                value={formData.given_name}
                onChange={(e) => setFormData(prev => ({ ...prev, given_name: e.target.value }))}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="middle_name">Middle Name</Label>
              <Input
                id="middle_name"
                value={formData.middle_name}
                onChange={(e) => setFormData(prev => ({ ...prev, middle_name: e.target.value }))}
                placeholder="Michael"
              />
            </div>
            <div>
              <Label htmlFor="surname">Surname</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Michael Smith"
              required
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alternative Names */}
          <div>
            <Label>Alternative Names</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={altNameInput}
                onChange={(e) => setAltNameInput(e.target.value)}
                placeholder="Nickname, maiden name, etc."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAltName())}
              />
              <Button type="button" onClick={handleAddAltName}>Add</Button>
            </div>
            {formData.alt_names.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.alt_names.map((name) => (
                  <span
                    key={name}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleRemoveAltName(name)}
                  >
                    {name} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Life Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Life Dates</CardTitle>
          <CardDescription>Enter birth and death dates with appropriate precision</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_living"
              checked={formData.is_living}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                is_living: checked as boolean,
                death_date: checked ? '' : prev.death_date
              }))}
            />
            <Label htmlFor="is_living">This person is living</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
              <Select value={formData.birth_date_precision} onValueChange={(value) => setFormData(prev => ({ ...prev, birth_date_precision: value }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ymd">Year, Month, Day</SelectItem>
                  <SelectItem value="md">Month, Day (unknown year)</SelectItem>
                  <SelectItem value="m">Month only</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!formData.is_living && (
              <div>
                <Label htmlFor="death_date">Death Date</Label>
                <Input
                  id="death_date"
                  type="date"
                  value={formData.death_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, death_date: e.target.value }))}
                />
                <Select value={formData.death_date_precision} onValueChange={(value) => setFormData(prev => ({ ...prev, death_date_precision: value }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ymd">Year, Month, Day</SelectItem>
                    <SelectItem value="md">Month, Day (unknown year)</SelectItem>
                    <SelectItem value="m">Month only</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Profile Photo</Label>
            <div className="mt-2">
              <ProfilePhotoUploader
                currentPhotoUrl={formData.avatar_url}
                fallbackText={formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                onPhotoUploaded={handlePhotoUploaded}
                personId={person?.id}
                size="lg"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional information about this person..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : person ? 'Update Person' : 'Create Person'}
        </Button>
      </div>
    </form>
  )
}