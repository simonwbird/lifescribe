import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  Edit, 
  Calendar, 
  Phone, 
  Shield, 
  Stethoscope,
  MapPin,
  Star,
  FileText,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Play
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { MediaService } from '@/lib/mediaService'
import { toast } from '@/hooks/use-toast'
import { ImageViewer } from '@/components/ui/image-viewer'
import type { Pet } from '@/lib/petTypes'

interface MediaItem {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  signed_url?: string;
}

export default function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState<Pet | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [currentImageAlt, setCurrentImageAlt] = useState('')

  useEffect(() => {
    if (id) {
      loadPet(id)
    }
  }, [id])

  const loadPet = async (petId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return

      // Fetch pet media - note: pets might use different media linking
      // Check if pets link through a junction table or direct foreign key
      const mediaResponse = await supabase
        .from('media')
        .select('id, file_name, file_path, mime_type')
        .eq('family_id', member.family_id)
        .order('created_at', { ascending: true })

      if (mediaResponse.data && mediaResponse.data.length > 0) {
        const mediaWithUrls: MediaItem[] = []
        for (const item of mediaResponse.data) {
          const signedUrl = await MediaService.getSignedMediaUrl(item.file_path)
          if (signedUrl) {
            mediaWithUrls.push({
              id: item.id,
              file_name: item.file_name,
              file_path: item.file_path,
              mime_type: item.mime_type,
              signed_url: signedUrl
            })
          }
        }
        setMedia(mediaWithUrls)
      }

      const { data: petData, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('family_id', member.family_id)
        .single()

      if (error) {
        toast({
          title: "Error",
          description: "Could not load pet details",
          variant: "destructive"
        })
        return
      }

      if (petData) {
        // Transform the data to match our Pet type
        const transformedPet: Pet = {
          id: petData.id,
          familyId: petData.family_id,
          createdBy: petData.created_by,
          name: petData.name,
          species: petData.species,
          breed: petData.breed,
          sex: petData.sex as any,
          neutered: petData.neutered,
          color: petData.color,
          markings: petData.markings,
          dobApprox: petData.dob_approx,
          gotchaDate: petData.gotcha_date,
          passedAt: petData.passed_at,
          microchip: {
            number: petData.microchip_number,
            provider: petData.microchip_provider,
            date: petData.microchip_date
          },
          vet: {
            name: petData.vet_name,
            phone: petData.vet_phone,
            email: petData.vet_email
          },
          insurance: {
            provider: petData.insurance_provider,
            policy: petData.insurance_policy,
            renews: petData.insurance_renews
          },
          health: {
            weightKg: petData.weight_kg,
            diet: petData.diet,
            allergies: petData.allergies,
            medications: petData.medications,
            conditions: petData.conditions || [],
            vaccines: [],
            visits: []
          },
          roles: petData.roles || [],
          awards: petData.awards || [],
          temperament: petData.temperament,
          favorites: petData.favorites || [],
          routine: {
            feeding: petData.feeding_routine,
            walks: petData.walks_routine,
            bedtime: petData.bedtime_routine
          },
          careInstructions: petData.care_instructions,
          guardianIds: [],
          propertyId: petData.property_id,
          room: petData.room,
          breederRescue: petData.breeder_rescue,
          coverUrl: petData.cover_url,
          status: petData.status as any,
          tags: petData.tags || [],
          reminders: [],
          createdAt: petData.created_at,
          updatedAt: petData.updated_at
        }

        setPet(transformedPet)
      }
    } catch (error) {
      console.error('Error loading pet:', error)
      toast({
        title: "Error",
        description: "Failed to load pet details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dobApprox?: string) => {
    if (!dobApprox) return 'Unknown age'
    
    try {
      const dobDate = new Date(dobApprox)
      const today = new Date()
      const years = today.getFullYear() - dobDate.getFullYear()
      const months = today.getMonth() - dobDate.getMonth()
      
      if (years === 0) {
        return months > 0 ? `${months} months` : 'Under 1 month'
      }
      
      return `${years} years old`
    } catch {
      return dobApprox // Return the original string if it's not a valid date
    }
  }

  const getSpeciesIcon = (species?: string) => {
    switch (species) {
      case 'dog':
      case 'cat':
      case 'rabbit':
      default:
        return Heart
    }
  }

  const openImageViewer = (imageUrl: string, imageAlt: string) => {
    setCurrentImageUrl(imageUrl)
    setCurrentImageAlt(imageAlt)
    setImageViewerOpen(true)
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </AuthGate>
    )
  }

  if (!pet) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-muted-foreground">Pet not found</h1>
              <Link to="/collections?tab=pet">
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pets
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </AuthGate>
    )
  }

  const SpeciesIcon = getSpeciesIcon(pet.species)

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/collections?tab=pet')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">{pet.name}</h1>
                  <p className="text-muted-foreground">
                    {pet.breed ? `${pet.breed} • ` : ''}{pet.species?.charAt(0).toUpperCase() + pet.species?.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to={`/pets/${pet.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={pet.coverUrl} alt={pet.name} />
                    <AvatarFallback className="text-2xl">
                      <SpeciesIcon className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Age</h3>
                        <p>{calculateAge(pet.dobApprox)}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Sex</h3>
                        <p>{pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : 'Unknown'} {pet.neutered && '(Spayed/Neutered)'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                        <Badge variant={pet.status === 'current' ? 'default' : 'secondary'}>
                          {pet.status === 'current' ? 'Current' : 'Memorial'}
                        </Badge>
                      </div>
                    </div>

                    {/* Status Icons */}
                    <div className="flex gap-2">
                      {pet.microchip?.number && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Microchipped
                        </Badge>
                      )}
                      {pet.insurance?.provider && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <FileText className="h-3 w-3 mr-1" />
                          Insured
                        </Badge>
                      )}
                      {pet.vet?.name && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          Vet Assigned
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    {pet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pet.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Health Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Health & Care
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pet.vet?.name && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Veterinarian</h4>
                      <p>{pet.vet.name}</p>
                      {pet.vet.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {pet.vet.phone}
                        </p>
                      )}
                    </div>
                  )}

                  {pet.health.allergies && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Allergies</h4>
                      <p className="text-sm">{pet.health.allergies}</p>
                    </div>
                  )}

                  {pet.health.medications && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Current Medications</h4>
                      <p className="text-sm">{pet.health.medications}</p>
                    </div>
                  )}

                  {pet.microchip?.number && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Microchip</h4>
                      <p className="text-sm font-mono">{pet.microchip.number}</p>
                      {pet.microchip.provider && (
                        <p className="text-xs text-muted-foreground">{pet.microchip.provider}</p>
                      )}
                    </div>
                  )}

                  {pet.insurance?.provider && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Insurance</h4>
                      <p className="text-sm">{pet.insurance.provider}</p>
                      {pet.insurance.policy && (
                        <p className="text-xs text-muted-foreground">Policy: {pet.insurance.policy}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Favorites & Personality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Personality & Favorites
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pet.temperament && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Temperament</h4>
                      <p className="text-sm">{pet.temperament}</p>
                    </div>
                  )}

                  {pet.favorites.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Favorite Things</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pet.favorites.map((favorite) => (
                          <Badge key={favorite} variant="outline" className="text-xs">
                            {favorite}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {pet.gotchaDate && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Gotcha Day</h4>
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(pet.gotchaDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {pet.room && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Location</h4>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pet.room}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Media Gallery */}
            {media.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photos & Media ({media.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {media.map((item) => (
                      <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                        {item.signed_url && (
                          <>
                            {item.mime_type.startsWith('image/') ? (
                              <img
                                src={item.signed_url}
                                alt={item.file_name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                                onClick={() => openImageViewer(item.signed_url!, item.file_name)}
                              />
                            ) : item.mime_type.startsWith('video/') ? (
                              <div className="flex h-full w-full items-center justify-center cursor-pointer">
                                <Play className="h-8 w-8 text-muted-foreground" />
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Care Instructions */}
            {pet.careInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Care Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{pet.careInstructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Reminders */}
            {pet.reminders && pet.reminders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Upcoming Reminders
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reminder
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pet.reminders
                      .filter(r => r.status === 'upcoming' || r.status === 'overdue')
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(reminder.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={reminder.status === 'overdue' ? 'destructive' : 'default'}>
                            {reminder.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <ImageViewer
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={currentImageUrl}
          imageAlt={currentImageAlt}
        />
      </div>
    </AuthGate>
  )
}