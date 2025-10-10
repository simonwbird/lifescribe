import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  usePersonObjects,
  usePersonPlaces,
  usePersonProjects,
} from '@/hooks/useObjectsPlacesProjects';
import { Package, MapPin, Briefcase, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ObjectsPlacesBlockProps {
  personId: string;
  familyId: string;
  canEdit: boolean;
}

export function ObjectsPlacesBlock({ personId, familyId, canEdit }: ObjectsPlacesBlockProps) {
  const { data: objects = [], isLoading: objectsLoading } = usePersonObjects(personId);
  const { data: places = [], isLoading: placesLoading } = usePersonPlaces(personId);
  const { data: projects = [], isLoading: projectsLoading } = usePersonProjects(personId);

  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const getObjectIcon = (type: string) => {
    const icons: Record<string, string> = {
      keepsake: '🎁',
      heirloom: '👑',
      artifact: '🏺',
      document: '📜',
      artwork: '🎨',
      jewelry: '💍',
      furniture: '🪑',
      clothing: '👔',
    };
    return icons[type] || '📦';
  };

  const getPlaceIcon = (type: string) => {
    const icons: Record<string, string> = {
      home: '🏠',
      school: '🎓',
      workplace: '🏢',
      hospital: '🏥',
      church: '⛪',
      cemetery: '🪦',
      park: '🌳',
      business: '🏪',
    };
    return icons[type] || '📍';
  };

  const getProjectIcon = (type: string) => {
    const icons: Record<string, string> = {
      personal: '✨',
      professional: '💼',
      community: '🤝',
      creative: '🎭',
      academic: '📚',
      business: '🏢',
      volunteer: '❤️',
    };
    return icons[type] || '🎯';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Objects, Places & Projects</CardTitle>
          <CardDescription>
            Keepsakes, locations, and life works connected to this person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="objects" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="objects" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Objects ({objects.length})
              </TabsTrigger>
              <TabsTrigger value="places" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Places ({places.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Projects ({projects.length})
              </TabsTrigger>
            </TabsList>

            {/* Objects Tab */}
            <TabsContent value="objects" className="space-y-4 mt-4">
              {objectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : objects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No objects linked yet</p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Object
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {objects.map((link: any) => (
                    <Card
                      key={link.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedObject(link.object)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{getObjectIcon(link.object.object_type)}</div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold">{link.object.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{link.relationship_type}</Badge>
                              <Badge variant="outline">{link.object.object_type}</Badge>
                            </div>
                            {link.object.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {link.object.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Places Tab */}
            <TabsContent value="places" className="space-y-4 mt-4">
              {placesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : places.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No places linked yet</p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Place
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {places.map((link: any) => (
                    <Card
                      key={link.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedPlace(link.place)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{getPlaceIcon(link.place.place_type)}</div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold">{link.place.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{link.relationship_type}</Badge>
                              <Badge variant="outline">{link.place.place_type}</Badge>
                            </div>
                            {link.place.address && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {link.place.address}
                              </p>
                            )}
                            {link.place.years_active && (
                              <p className="text-xs text-muted-foreground">
                                {link.place.years_active}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4 mt-4">
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No projects linked yet</p>
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.map((link: any) => (
                    <Card
                      key={link.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedProject(link.project)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{getProjectIcon(link.project.project_type)}</div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold">{link.project.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{link.role}</Badge>
                              <Badge variant="outline">{link.project.project_type}</Badge>
                              {link.project.status && (
                                <Badge>{link.project.status}</Badge>
                              )}
                            </div>
                            {link.project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {link.project.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Object Detail Dialog */}
      {selectedObject && (
        <Dialog open={!!selectedObject} onOpenChange={() => setSelectedObject(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-3xl">{getObjectIcon(selectedObject.object_type)}</span>
                {selectedObject.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedObject.object_type}</Badge>
                <Badge variant="outline">{selectedObject.visibility}</Badge>
              </div>
              {selectedObject.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedObject.description}</p>
                </div>
              )}
              {selectedObject.provenance && (
                <div>
                  <h4 className="font-semibold mb-2">Provenance</h4>
                  <p className="text-muted-foreground">{selectedObject.provenance}</p>
                </div>
              )}
              {selectedObject.cultural_significance && (
                <div>
                  <h4 className="font-semibold mb-2">Cultural Significance</h4>
                  <p className="text-muted-foreground">{selectedObject.cultural_significance}</p>
                </div>
              )}
              {selectedObject.current_location && (
                <div>
                  <h4 className="font-semibold mb-2">Current Location</h4>
                  <p className="text-muted-foreground">{selectedObject.current_location}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Place Detail Dialog */}
      {selectedPlace && (
        <Dialog open={!!selectedPlace} onOpenChange={() => setSelectedPlace(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-3xl">{getPlaceIcon(selectedPlace.place_type)}</span>
                {selectedPlace.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedPlace.place_type}</Badge>
                <Badge variant="outline">{selectedPlace.visibility}</Badge>
              </div>
              {selectedPlace.address && (
                <div>
                  <h4 className="font-semibold mb-2">Address</h4>
                  <p className="text-muted-foreground">
                    {selectedPlace.address}
                    {selectedPlace.city && `, ${selectedPlace.city}`}
                    {selectedPlace.state && `, ${selectedPlace.state}`}
                    {selectedPlace.country && ` ${selectedPlace.country}`}
                  </p>
                </div>
              )}
              {selectedPlace.years_active && (
                <div>
                  <h4 className="font-semibold mb-2">Years Active</h4>
                  <p className="text-muted-foreground">{selectedPlace.years_active}</p>
                </div>
              )}
              {selectedPlace.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedPlace.description}</p>
                </div>
              )}
              {selectedPlace.significance && (
                <div>
                  <h4 className="font-semibold mb-2">Significance</h4>
                  <p className="text-muted-foreground">{selectedPlace.significance}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Project Detail Dialog */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-3xl">{getProjectIcon(selectedProject.project_type)}</span>
                {selectedProject.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedProject.project_type}</Badge>
                <Badge variant="outline">{selectedProject.status}</Badge>
                <Badge variant="outline">{selectedProject.visibility}</Badge>
              </div>
              {(selectedProject.start_date || selectedProject.end_date) && (
                <div>
                  <h4 className="font-semibold mb-2">Timeline</h4>
                  <p className="text-muted-foreground">
                    {selectedProject.start_date && `Started: ${selectedProject.start_date}`}
                    {selectedProject.start_date && selectedProject.end_date && ' • '}
                    {selectedProject.end_date && `Ended: ${selectedProject.end_date}`}
                  </p>
                </div>
              )}
              {selectedProject.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>
              )}
              {selectedProject.achievements && (
                <div>
                  <h4 className="font-semibold mb-2">Achievements</h4>
                  <p className="text-muted-foreground">{selectedProject.achievements}</p>
                </div>
              )}
              {selectedProject.impact && (
                <div>
                  <h4 className="font-semibold mb-2">Impact</h4>
                  <p className="text-muted-foreground">{selectedProject.impact}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
