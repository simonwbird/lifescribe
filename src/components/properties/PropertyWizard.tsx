import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Home, MapPin } from 'lucide-react'
import { PropertyService } from '@/lib/propertyService'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { PropertyType, PropertyStatus, PropertyAddress } from '@/lib/propertyTypes'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from '@/lib/propertyTypes'

const steps = [
  { id: 1, title: 'Property Details', description: 'Basic information about your property' },
  { id: 2, title: 'Address & Privacy', description: 'Location and visibility settings' },
  { id: 3, title: 'Timeline', description: 'Important dates and history' },
  { id: 4, title: 'Review', description: 'Final review and save' }
]

interface PropertyData {
  display_title: string
  property_types: PropertyType[]
  description: string
  address_json: PropertyAddress
  address_visibility: 'exact' | 'street_hidden' | 'city_only'
  map_visibility: boolean
  built_year?: number
  built_year_circa: boolean
  first_known_date?: string
  first_known_circa: boolean
  last_known_date?: string
  last_known_circa: boolean
  status: PropertyStatus
  tags: string[]
}

export function PropertyWizard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)

  const [propertyData, setPropertyData] = useState<PropertyData>({
    display_title: '',
    property_types: [],
    description: '',
    address_json: {},
    address_visibility: 'exact',
    map_visibility: true,
    built_year_circa: false,
    first_known_circa: false,
    last_known_circa: false,
    status: 'current',
    tags: []
  })

  // Get family ID on component mount
  useState(() => {
    const getFamilyId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (member) {
          setFamilyId(member.family_id)
        }
      } catch (error) {
        console.error('Error getting family ID:', error)
      }
    }
    getFamilyId()
  })

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!familyId) {
      toast({
        title: "Error",
        description: "Family information not found",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const property = await PropertyService.createProperty({
        ...propertyData,
        family_id: familyId
      })

      if (property) {
        toast({
          title: "Success",
          description: "Property created successfully"
        })
        navigate(`/properties/${property.id}`)
      } else {
        throw new Error('Failed to create property')
      }
    } catch (error) {
      console.error('Error creating property:', error)
      toast({
        title: "Error",
        description: "Failed to create property",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePropertyType = (type: PropertyType) => {
    const current = propertyData.property_types
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    setPropertyData(prev => ({ ...prev, property_types: updated }))
  }

  const addTag = (tag: string) => {
    if (tag && !propertyData.tags.includes(tag)) {
      setPropertyData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setPropertyData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Property Title</Label>
              <Input
                id="title"
                placeholder="e.g., The Johnson Family Home"
                value={propertyData.display_title}
                onChange={(e) => setPropertyData(prev => ({ ...prev, display_title: e.target.value }))}
              />
            </div>

            <div>
              <Label>Property Type(s)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([type, label]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={propertyData.property_types.includes(type as PropertyType)}
                      onCheckedChange={() => togglePropertyType(type as PropertyType)}
                    />
                    <Label htmlFor={type} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select 
                value={propertyData.status} 
                onValueChange={(value: PropertyStatus) => setPropertyData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_STATUS_LABELS).map(([status, label]) => (
                    <SelectItem key={status} value={status}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about this property and why it matters to your family..."
                value={propertyData.description}
                onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="line1">Street Address</Label>
                <Input
                  id="line1"
                  placeholder="123 Main Street"
                  value={propertyData.address_json.line1 || ''}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    address_json: { ...prev.address_json, line1: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="line2">Apt/Unit (optional)</Label>
                <Input
                  id="line2"
                  placeholder="Apt 2B"
                  value={propertyData.address_json.line2 || ''}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    address_json: { ...prev.address_json, line2: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={propertyData.address_json.city || ''}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    address_json: { ...prev.address_json, city: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="region">State/Region</Label>
                <Input
                  id="region"
                  placeholder="NY"
                  value={propertyData.address_json.region || ''}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    address_json: { ...prev.address_json, region: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={propertyData.address_json.country || ''}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    address_json: { ...prev.address_json, country: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Address Visibility</Label>
              <Select
                value={propertyData.address_visibility}
                onValueChange={(value: 'exact' | 'street_hidden' | 'city_only') => 
                  setPropertyData(prev => ({ ...prev, address_visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Show exact address</SelectItem>
                  <SelectItem value="street_hidden">Hide street, show city</SelectItem>
                  <SelectItem value="city_only">City only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="map_visibility"
                checked={propertyData.map_visibility}
                onCheckedChange={(checked) => setPropertyData(prev => ({ 
                  ...prev, 
                  map_visibility: checked as boolean 
                }))}
              />
              <Label htmlFor="map_visibility">Show on family map</Label>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="built_year">Built Year</Label>
                <Input
                  id="built_year"
                  type="number"
                  placeholder="1985"
                  value={propertyData.built_year || ''}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    built_year: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="built_year_circa"
                    checked={propertyData.built_year_circa}
                    onCheckedChange={(checked) => setPropertyData(prev => ({ 
                      ...prev, 
                      built_year_circa: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="built_year_circa" className="text-sm">Approximate</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_known">First Known Date</Label>
                <Input
                  id="first_known"
                  type="date"
                  value={propertyData.first_known_date || ''}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    first_known_date: e.target.value 
                  }))}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="first_known_circa"
                    checked={propertyData.first_known_circa}
                    onCheckedChange={(checked) => setPropertyData(prev => ({ 
                      ...prev, 
                      first_known_circa: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="first_known_circa" className="text-sm">Approximate</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="last_known">Last Known Date</Label>
                <Input
                  id="last_known"
                  type="date"
                  value={propertyData.last_known_date || ''}
                  onChange={(e) => setPropertyData(prev => ({ 
                    ...prev, 
                    last_known_date: e.target.value 
                  }))}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="last_known_circa"
                    checked={propertyData.last_known_circa}
                    onCheckedChange={(checked) => setPropertyData(prev => ({ 
                      ...prev, 
                      last_known_circa: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="last_known_circa" className="text-sm">Approximate</Label>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-4">Property Summary</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Title:</strong> {propertyData.display_title}</div>
                <div><strong>Type:</strong> {propertyData.property_types.map(t => PROPERTY_TYPE_LABELS[t]).join(', ')}</div>
                <div><strong>Status:</strong> {PROPERTY_STATUS_LABELS[propertyData.status]}</div>
                {propertyData.address_json.city && (
                  <div><strong>Location:</strong> {propertyData.address_json.city}, {propertyData.address_json.region}</div>
                )}
                {propertyData.built_year && (
                  <div><strong>Built:</strong> {propertyData.built_year}{propertyData.built_year_circa ? ' (circa)' : ''}</div>
                )}
              </div>
            </div>
            
            {propertyData.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{propertyData.description}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/collections')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collections
        </Button>
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Add Property</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              currentStep >= step.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step.id}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                currentStep > step.id ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
          <p className="text-muted-foreground">{steps[currentStep - 1]?.description}</p>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!propertyData.display_title}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Property'}
          </Button>
        )}
      </div>
    </div>
  )
}