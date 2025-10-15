import { useNavigate } from 'react-router-dom'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PropertyNew() {
  const navigate = useNavigate()

  const handleSuccess = (propertyId: string) => {
    navigate(`/properties/${propertyId}`)
  }

  const handleCancel = () => {
    navigate('/properties')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={handleCancel}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Properties
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3 font-serif">Add New Property</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  )
}
