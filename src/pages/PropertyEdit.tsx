import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import type { Property } from '@/lib/propertyTypes'

export default function PropertyEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        
        // Map database fields to Property type
        if (data) {
          const addressJson = data.address_json as Record<string, string> | null
          setProperty({
            ...data,
            title: data.display_title || data.name || '',
            address_line1: addressJson?.line1,
            address_line2: addressJson?.line2,
            city: addressJson?.city,
            state_province: addressJson?.region,
            postal_code: addressJson?.postcode,
            country: addressJson?.country,
            type: data.property_types?.[0],
            purchase_date: data.first_known_date,
            sale_date: data.last_known_date,
            notes: data.description,
            year_built: data.built_year,
          } as Property)
        }
      } catch (error) {
        console.error('Error fetching property:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  const handleSuccess = () => {
    navigate(`/properties/${id}`)
  }

  const handleCancel = () => {
    navigate(`/properties/${id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-center text-muted-foreground">Property not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={handleCancel}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Property
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3 font-serif">Edit Property</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm 
            property={property}
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
