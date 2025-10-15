import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '@/lib/propertyTypes'
import type { Property, PropertyType, PropertyStatus } from '@/lib/propertyTypes'

interface PropertyFormProps {
  property?: Property
  onSuccess: (propertyId: string) => void
  onCancel: () => void
}

export function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const [title, setTitle] = useState(property?.title || '')
  const [addressLine1, setAddressLine1] = useState(property?.address_line1 || '')
  const [addressLine2, setAddressLine2] = useState(property?.address_line2 || '')
  const [city, setCity] = useState(property?.city || '')
  const [stateProvince, setStateProvince] = useState(property?.state_province || '')
  const [postalCode, setPostalCode] = useState(property?.postal_code || '')
  const [country, setCountry] = useState(property?.country || '')
  const [propertyType, setPropertyType] = useState<PropertyType | ''>(property?.type || '')
  const [status, setStatus] = useState<PropertyStatus>(property?.status || 'current')
  const [purchaseDate, setPurchaseDate] = useState(property?.purchase_date || '')
  const [saleDate, setSaleDate] = useState(property?.sale_date || '')
  const [notes, setNotes] = useState(property?.notes || '')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!memberData) throw new Error('No family membership found')

      const propertyData = {
        family_id: memberData.family_id,
        created_by: user.id,
        title: title.trim(),
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        state_province: stateProvince.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || null,
        type: propertyType || null,
        status,
        purchase_date: purchaseDate || null,
        sale_date: saleDate || null,
        notes: notes.trim() || null,
      }

      if (property?.id) {
        // Update existing property
        const { error } = await supabase
          .from('properties' as any)
          .update(propertyData)
          .eq('id', property.id)

        if (error) throw error

        toast({
          title: 'Property updated',
          description: 'Your property has been updated successfully.',
        })

        onSuccess(property.id)
      } else {
        // Create new property
        const { data, error } = await supabase
          .from('properties' as any)
          .insert(propertyData)
          .select()
          .single()

        if (error) throw error

        const newProperty = data as any

        toast({
          title: 'Property created',
          description: 'Your property has been added successfully.',
        })

        onSuccess(newProperty.id)
      }
    } catch (error) {
      console.error('Error saving property:', error)
      toast({
        title: 'Error',
        description: 'Failed to save property. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Property Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="The Family Home, Grandpa's Farm, etc."
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address</h3>
        
        <div>
          <Label htmlFor="address1">Address Line 1</Label>
          <Input
            id="address1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <Label htmlFor="address2">Address Line 2</Label>
          <Input
            id="address2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apartment 4B"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Springfield"
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value)}
              placeholder="IL"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="postal">Postal Code</Label>
            <Input
              id="postal"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="62701"
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United States"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="type">Property Type</Label>
          <Select
            value={propertyType}
            onValueChange={(value) => setPropertyType(value as PropertyType)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as PropertyStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="purchase">Purchase Date</Label>
          <Input
            id="purchase"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sale">Sale Date (if applicable)</Label>
          <Input
            id="sale"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details about the property..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : property ? 'Update Property' : 'Create Property'}
        </Button>
      </div>
    </form>
  )
}
