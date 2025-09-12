import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Save, Home, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PropertyService } from '@/lib/propertyService'
import type { PropertyStatus, PropertyWithDetails, PropertyType, PropertyAddress } from '@/lib/propertyTypes'
import { PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/propertyTypes'

const steps = [
  { id: 1, title: 'Property Details', description: 'Basic information about your property' },
  { id: 2, title: 'Address & Privacy', description: 'Location and visibility settings' },
  { id: 3, title: 'Timeline', description: 'Important dates and history' },
  { id: 4, title: 'Photos & Documents', description: 'Upload images and documents' },
  { id: 5, title: 'Review & Save', description: 'Review changes and save' }
]

export default function PropertyEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<PropertyWithDetails | null>(null)
  
  // Form data state
  const [formData, setFormData] = useState({
    display_title: '',
    property_types: [] as PropertyType[],
    status: 'current' as PropertyStatus,
    description: '',
    address_json: {} as PropertyAddress,
    address_visibility: 'exact' as 'exact' | 'street_hidden' | 'city_only',
    map_visibility: true,
    built_year: undefined as number | undefined,
    built_year_circa: false,
    first_known_date: '',
    first_known_circa: false,
    last_known_date: '',
    last_known_circa: false,
    tags: [] as string[]
  })

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await PropertyService.getProperty(id)
        if (data) {
          setProperty(data)
          // Pre-fill all form data
          setFormData({
            display_title: data.display_title || '',
            property_types: data.property_types || [],
            status: (data.status || 'current') as PropertyStatus,
            description: data.description || '',
            address_json: (data.address_json as PropertyAddress) || {},
            address_visibility: data.address_visibility || 'exact',
            map_visibility: data.map_visibility ?? true,
            built_year: data.built_year,
            built_year_circa: data.built_year_circa || false,
            first_known_date: data.first_known_date || '',
            first_known_circa: data.first_known_circa || false,
            last_known_date: data.last_known_date || '',
            last_known_circa: data.last_known_circa || false,
            tags: data.tags || []
          })
          document.title = `Edit Property · ${data.display_title || 'Property'}`
        }
      } catch (e) {
        console.error(e)
        toast({ title: 'Error', description: 'Failed to load property', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, toast])

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const togglePropertyType = (type: PropertyType) => {
    const current = formData.property_types
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    setFormData(prev => ({ ...prev, property_types: updated }))
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await PropertyService.updateProperty(id, formData)
      if (updated) {
        toast({ title: 'Saved', description: 'Property updated successfully.' })
        navigate(`/properties/${id}`)
      } else {
        throw new Error('Update failed')
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Could not save changes.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
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
                value={formData.display_title}
                onChange={(e) => setFormData(prev => ({ ...prev, display_title: e.target.value }))}
              />
            </div>

            <div>
              <Label>Property Type(s)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([type, label]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={formData.property_types.includes(type as PropertyType)}
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
                value={formData.status} 
                onValueChange={(value: PropertyStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
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
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  value={formData.address_json.line1 || ''}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.address_json.line2 || ''}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.address_json.city || ''}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.address_json.region || ''}
                  onChange={(e) => setFormData(prev => ({
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
                  value={formData.address_json.country || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address_json: { ...prev.address_json, country: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Address Visibility</Label>
              <Select
                value={formData.address_visibility}
                onValueChange={(value: 'exact' | 'street_hidden' | 'city_only') => 
                  setFormData(prev => ({ ...prev, address_visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="exact">Show exact address</SelectItem>
                  <SelectItem value="street_hidden">Hide street, show city</SelectItem>
                  <SelectItem value="city_only">City only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="map_visibility"
                checked={formData.map_visibility}
                onCheckedChange={(checked) => setFormData(prev => ({ 
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
                  value={formData.built_year || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    built_year: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="built_year_circa"
                    checked={formData.built_year_circa}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
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
                  value={formData.first_known_date || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    first_known_date: e.target.value 
                  }))}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="first_known_circa"
                    checked={formData.first_known_circa}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
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
                  value={formData.last_known_date || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    last_known_date: e.target.value 
                  }))}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="last_known_circa"
                    checked={formData.last_known_circa}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      last_known_circa: checked as boolean 
                    }))}
                  />
                  <Label htmlFor="last_known_circa" className="text-sm">Approximate</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(e.currentTarget.value.trim())
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Media Management</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Media upload and management will be available in a future update. You can currently view and organize existing media from the property detail page.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Cover Photo:</strong> Main image for the property card</p>
                <p><strong>Then & Now:</strong> Historical vs current photos</p>
                <p><strong>Floorplans:</strong> Layout and room diagrams</p>
                <p><strong>Documents:</strong> Deeds, mortgages, surveys, receipts</p>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-4">Review Changes</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Title:</strong> {formData.display_title}</div>
                <div><strong>Type:</strong> {formData.property_types.map(t => PROPERTY_TYPE_LABELS[t]).join(', ')}</div>
                <div><strong>Status:</strong> {PROPERTY_STATUS_LABELS[formData.status]}</div>
                {formData.address_json.city && (
                  <div><strong>Location:</strong> {formData.address_json.city}, {formData.address_json.region}</div>
                )}
                {formData.built_year && (
                  <div><strong>Built:</strong> {formData.built_year}{formData.built_year_circa ? ' (circa)' : ''}</div>
                )}
                {formData.tags.length > 0 && (
                  <div><strong>Tags:</strong> {formData.tags.join(', ')}</div>
                )}
              </div>
            </div>
            
            {formData.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(`/properties/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Property
            </Button>
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Edit Property</h1>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-muted-foreground text-center">Loading property...</div>
              </CardContent>
            </Card>
          ) : !property ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-muted-foreground text-center">Property not found.</div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium cursor-pointer ${
                      currentStep >= step.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                    >
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
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < 5 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGate>
  )
}
