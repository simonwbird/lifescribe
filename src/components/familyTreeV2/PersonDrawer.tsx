import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Calendar, MapPin, Users, BookOpen, Camera, Package, ChefHat } from 'lucide-react'
import { FamilyTreeService } from '@/lib/familyTreeV2Service'
import type { TreePerson } from '@/lib/familyTreeV2Types'
import { supabase } from '@/integrations/supabase/client'

interface PersonDrawerProps {
  personId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const PersonDrawer: React.FC<PersonDrawerProps> = ({
  personId,
  open,
  onOpenChange
}) => {
  const [person, setPerson] = useState<TreePerson | null>(null)
  const [relationships, setRelationships] = useState<{
    partners: TreePerson[]
    children: TreePerson[]
    parents: TreePerson[]
  }>({ partners: [], children: [], parents: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && personId) {
      loadPersonData()
    }
  }, [open, personId])

  const loadPersonData = async () => {
    setLoading(true)
    try {
      const data = await FamilyTreeService.getPersonWithRelationships(personId)
      setPerson(data.person)
      setRelationships({
        partners: data.partners,
        children: data.children,
        parents: data.parents
      })
    } catch (error) {
      console.error('Error loading person data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!person) return null

  const displayName = `${person.given_name || ''} ${person.surname || ''}`.trim()
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()
  const birthYear = person.birth_date?.split('-')[0]
  const deathYear = person.death_date?.split('-')[0]
  const years = birthYear || deathYear ? `${birthYear || '?'} – ${deathYear || ''}` : ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={person.profile_photo_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <SheetTitle className="text-xl">{displayName}</SheetTitle>
              {years && (
                <p className="text-muted-foreground">{years}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {person.sex && (
                  <Badge variant="outline">
                    {person.sex === 'M' ? 'Male' : person.sex === 'F' ? 'Female' : 'Other'}
                  </Badge>
                )}
                <Badge variant={person.is_living ? 'default' : 'secondary'}>
                  {person.is_living ? 'Living' : 'Deceased'}
                </Badge>
              </div>
            </div>

            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="text-xs">
              <Users className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="stories" className="text-xs">
              <BookOpen className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs">
              <Camera className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="objects" className="text-xs">
              <Package className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-xs">
              <ChefHat className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.birth_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Born {person.birth_date}</span>
                  </div>
                )}
                
                {person.birth_place && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{person.birth_place}</span>
                  </div>
                )}

                {person.death_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Died {person.death_date}</span>
                  </div>
                )}

                {person.notes && (
                  <div className="text-sm text-muted-foreground mt-3 p-3 bg-muted/30 rounded">
                    {person.notes}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Family Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Family</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relationships.parents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Parents</h4>
                    <div className="space-y-2">
                      {relationships.parents.map(parent => (
                        <div key={parent.id} className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {parent.given_name?.[0]}{parent.surname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{parent.given_name} {parent.surname}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relationships.partners.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Partners</h4>
                    <div className="space-y-2">
                      {relationships.partners.map(partner => (
                        <div key={partner.id} className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {partner.given_name?.[0]}{partner.surname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{partner.given_name} {partner.surname}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {relationships.children.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Children</h4>
                    <div className="space-y-2">
                      {relationships.children.map(child => (
                        <div key={child.id} className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {child.given_name?.[0]}{child.surname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{child.given_name} {child.surname}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No stories yet</p>
              <Button className="mt-4" size="sm">
                + Add Story
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No photos yet</p>
              <Button className="mt-4" size="sm">
                + Add Photos
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="objects" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No objects yet</p>
              <Button className="mt-4" size="sm">
                + Add Object
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No recipes yet</p>
              <Button className="mt-4" size="sm">
                + Add Recipe
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}