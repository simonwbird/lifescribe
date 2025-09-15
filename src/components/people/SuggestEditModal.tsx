import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface SuggestEditModalProps {
  person: Person
  familyId: string
  onClose: () => void
  onSuccess: () => void
}

export default function SuggestEditModal({ person, familyId, onClose, onSuccess }: SuggestEditModalProps) {
  const [suggestedField, setSuggestedField] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [suggestedValue, setSuggestedValue] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fieldOptions = [
    { value: 'full_name', label: 'Full Name', current: person.full_name },
    { value: 'given_name', label: 'Given Name', current: person.given_name },
    { value: 'surname', label: 'Surname', current: person.surname },
    { value: 'birth_date', label: 'Birth Date', current: person.birth_date },
    { value: 'death_date', label: 'Death Date', current: person.death_date },
    { value: 'gender', label: 'Gender', current: person.gender },
    { value: 'notes', label: 'Notes', current: person.notes }
  ]

  const handleFieldChange = (field: string) => {
    setSuggestedField(field)
    const fieldOption = fieldOptions.find(opt => opt.value === field)
    setCurrentValue(fieldOption?.current || '')
    setSuggestedValue('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!suggestedField || !suggestedValue.trim()) {
      toast({
        title: "Error",
        description: "Please select a field and provide a suggested value",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const payload = {
        field: suggestedField,
        current_value: currentValue,
        suggested_value: suggestedValue,
        explanation: explanation.trim()
      }

      const { error } = await supabase
        .from('suggestions')
        .insert([{
          family_id: familyId,
          person_id: person.id,
          suggested_by: user.id,
          payload: payload,
          status: 'open'
        }])

      if (error) throw error

      toast({
        title: "Success",
        description: "Your suggestion has been submitted for review"
      })
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast({
        title: "Error", 
        description: "Failed to submit suggestion",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest an Edit</CardTitle>
        <CardDescription>
          Help improve {person.full_name}'s information by suggesting corrections or additions.
          Your suggestion will be reviewed by a family admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="field">What would you like to correct?</Label>
            <Select value={suggestedField} onValueChange={handleFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field to edit" />
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suggestedField && (
            <>
              <div>
                <Label>Current Value</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {currentValue || <em className="text-muted-foreground">No value set</em>}
                </div>
              </div>

              <div>
                <Label htmlFor="suggested_value">Suggested Value *</Label>
                <Textarea
                  id="suggested_value"
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  placeholder="Enter the correct information..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="explanation">Explanation (optional)</Label>
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Why do you think this correction is needed? Any additional context..."
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !suggestedField || !suggestedValue.trim()}>
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}