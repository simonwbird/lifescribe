import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/AppLayout'
import { routes } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/integrations/supabase/client'
import { 
  ArrowLeft, 
  MapPin, 
  PenLine, 
  Camera, 
  Copy,
  Check,
  Calendar,
  Home,
  Shield,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Property } from '@/lib/propertyTypes'
import { PROPERTY_STATUSES } from '@/lib/propertyTypes'
import { PropertyUpkeepTab } from '@/components/properties/PropertyUpkeepTab'
import { PropertyDocumentsTab } from '@/components/properties/PropertyDocumentsTab'
import { PropertyPhotos } from '@/components/properties/PropertyPhotos'

export default function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [addressCopied, setAddressCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')

  useEffect(() => {
    if (!id) return
    
    async function loadProperty() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('properties' as any)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (!data) {
          toast({
            title: 'Not found',
            description: 'This property could not be found.',
            variant: 'destructive'
          })
          navigate('/properties')
          return
        }

        setProperty(data as unknown as Property)
      } catch (error) {
        console.error('Error loading property:', error)
        toast({
          title: 'Error',
          description: 'Failed to load property details.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [id, navigate, toast])

  const copyAddress = () => {
    const fullAddress = [
      property?.address_line1,
      property?.address_line2,
      property?.city,
      property?.state_province,
      property?.postal_code,
      property?.country
    ].filter(Boolean).join(', ')

    navigator.clipboard.writeText(fullAddress)
    setAddressCopied(true)
    setTimeout(() => setAddressCopied(false), 2000)
    
    toast({
      title: 'Copied',
      description: 'Address copied to clipboard'
    })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-neutral-canvas">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-64 w-full rounded-2xl mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-96" />
              </div>
              <div>
                <Skeleton className="h-64" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-neutral-canvas flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-h4 font-serif mb-2">Property not found</h2>
            <p className="text-body text-muted-foreground mb-4">
              The property you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/properties">Back to Properties</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const statusLabel = PROPERTY_STATUSES.find(s => s.value === property.status)?.label || property.status

  return (
    <AppLayout>
      <div className="min-h-screen bg-neutral-canvas py-8">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="mb-6"
          >
            <Link to="/properties">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Link>
          </Button>

          {/* Header */}
          <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
            {/* Cover Image */}
            <div className="aspect-[21/9] bg-muted relative">
              {property.cover_url ? (
                <img 
                  src={property.cover_url} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Home className="w-16 h-16" />
                </div>
              )}
              <Badge 
                className="absolute top-4 right-4"
                variant={property.status === 'current' ? 'default' : 'secondary'}
              >
                {statusLabel}
              </Badge>
            </div>

            {/* Header Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="font-serif text-h2 text-foreground mb-2">
                    {property.title}
                  </h1>
                  
                  {property.address_line1 && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-body">
                          {property.address_line1}
                          {property.address_line2 && `, ${property.address_line2}`}
                        </p>
                        <p className="text-body">
                          {[property.city, property.state_province, property.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        {property.country && (
                          <p className="text-body">{property.country}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAddress}
                        className="flex-shrink-0"
                      >
                        {addressCopied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={routes.storyNew({ propertyId: property.id })}>
                      <PenLine className="w-4 h-4 mr-2" />
                      Add Story
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('gallery')}>
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/properties/${property.id}/edit`}>
                      Edit Property
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabs Section */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="upkeep">Upkeep</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-body-sm text-muted-foreground text-center py-8">
                        Stories and memories about this property will appear here.
                        <br />
                        <Link 
                          to={`/compose?type=story&propertyId=${property.id}`}
                          className="text-primary hover:underline mt-2 inline-block"
                        >
                          Add your first story
                        </Link>
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="gallery" className="mt-6">
                  <PropertyPhotos 
                    propertyId={property.id}
                    familyId={property.family_id}
                    coverId={property.cover_media_id}
                  />
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {property.type && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                          <p className="text-body capitalize">{property.type}</p>
                        </div>
                      )}
                      
                      {property.purchase_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Purchase Date</p>
                          <p className="text-body">
                            {new Date(property.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {property.sale_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Sale Date</p>
                          <p className="text-body">
                            {new Date(property.sale_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {property.tenure && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Tenure</p>
                          <p className="text-body capitalize">{property.tenure}</p>
                        </div>
                      )}

                      {(property.bedrooms || property.bathrooms) && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Rooms</p>
                          <p className="text-body">
                            {property.bedrooms && `${property.bedrooms} bedrooms`}
                            {property.bedrooms && property.bathrooms && ' • '}
                            {property.bathrooms && `${property.bathrooms} bathrooms`}
                          </p>
                        </div>
                      )}

                      {property.area_sq_m && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Area</p>
                          <p className="text-body">{property.area_sq_m} m²</p>
                        </div>
                      )}

                      {property.year_built && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Year Built</p>
                          <p className="text-body">{property.year_built}</p>
                        </div>
                      )}

                      {property.epc_rating && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">EPC Rating</p>
                          <p className="text-body">{property.epc_rating}</p>
                        </div>
                      )}

                      {property.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="text-body whitespace-pre-wrap">{property.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="upkeep" className="mt-6">
                  <PropertyUpkeepTab propertyId={property.id} familyId={property.family_id} />
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <PropertyDocumentsTab propertyId={property.id} familyId={property.family_id} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Rail */}
            <div className="space-y-6">
              {/* Quick Facts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-h5">Quick Facts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.purchase_date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Purchased</p>
                        <p className="text-sm font-medium">
                          {new Date(property.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {property.year_built && (
                    <div className="flex items-start gap-3">
                      <Home className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Built</p>
                        <p className="text-sm font-medium">{property.year_built}</p>
                      </div>
                    </div>
                  )}

                  {property.area_sq_m && (
                    <div className="flex items-start gap-3">
                      <Home className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Size</p>
                        <p className="text-sm font-medium">{property.area_sq_m} m²</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insurance & Compliance */}
              {(property.insurance_provider || property.insurance_renewal_at) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-h5">Insurance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.insurance_provider && (
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Provider</p>
                          <p className="text-sm font-medium">{property.insurance_provider}</p>
                        </div>
                      </div>
                    )}

                    {property.insurance_renewal_at && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Renewal Date</p>
                          <p className="text-sm font-medium">
                            {new Date(property.insurance_renewal_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              {(property.council_hoa || property.parking) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-h5">Additional Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.council_hoa && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Council/HOA</p>
                        <p className="text-sm">{property.council_hoa}</p>
                      </div>
                    )}

                    {property.parking && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Parking</p>
                        <p className="text-sm">{property.parking}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
