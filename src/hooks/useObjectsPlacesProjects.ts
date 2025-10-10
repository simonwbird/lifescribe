import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Cast to any since these tables were just added
const objectsTable = (supabase as any).from('objects');
const placesTable = (supabase as any).from('places');
const projectsTable = (supabase as any).from('projects');
const objectLinksTable = (supabase as any).from('object_person_links');
const placeLinksTable = (supabase as any).from('place_person_links');
const projectLinksTable = (supabase as any).from('project_person_links');

// Get objects for a person
export function usePersonObjects(personId: string) {
  return useQuery({
    queryKey: ['person-objects', personId],
    queryFn: async () => {
      const { data, error } = await objectLinksTable
        .select(`
          *,
          object:object_id(*)
        `)
        .eq('person_id', personId);

      if (error) throw error;
      return data;
    },
  });
}

// Get places for a person
export function usePersonPlaces(personId: string) {
  return useQuery({
    queryKey: ['person-places', personId],
    queryFn: async () => {
      const { data, error } = await placeLinksTable
        .select(`
          *,
          place:place_id(*)
        `)
        .eq('person_id', personId);

      if (error) throw error;
      return data;
    },
  });
}

// Get projects for a person
export function usePersonProjects(personId: string) {
  return useQuery({
    queryKey: ['person-projects', personId],
    queryFn: async () => {
      const { data, error } = await projectLinksTable
        .select(`
          *,
          project:project_id(*)
        `)
        .eq('person_id', personId);

      if (error) throw error;
      return data;
    },
  });
}

// Get all linked people for an object
export function useObjectPeople(objectId: string) {
  return useQuery({
    queryKey: ['object-people', objectId],
    queryFn: async () => {
      const { data, error } = await objectLinksTable
        .select(`
          *,
          person:person_id(id, given_name, surname, avatar_url)
        `)
        .eq('object_id', objectId);

      if (error) throw error;
      return data;
    },
  });
}

// Get all linked people for a place
export function usePlacePeople(placeId: string) {
  return useQuery({
    queryKey: ['place-people', placeId],
    queryFn: async () => {
      const { data, error } = await placeLinksTable
        .select(`
          *,
          person:person_id(id, given_name, surname, avatar_url)
        `)
        .eq('place_id', placeId);

      if (error) throw error;
      return data;
    },
  });
}

// Get all linked people for a project
export function useProjectPeople(projectId: string) {
  return useQuery({
    queryKey: ['project-people', projectId],
    queryFn: async () => {
      const { data, error } = await projectLinksTable
        .select(`
          *,
          person:person_id(id, given_name, surname, avatar_url)
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });
}

// Find duplicate places
export function useFindDuplicatePlaces() {
  return useMutation({
    mutationFn: async ({
      familyId,
      latitude,
      longitude,
      name,
    }: {
      familyId: string;
      latitude: number;
      longitude: number;
      name: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)('find_duplicate_places', {
        p_family_id: familyId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_name: name,
      });

      if (error) throw error;
      return data;
    },
  });
}

// Create object
export function useCreateObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (object: {
      family_id: string;
      name: string;
      description?: string;
      object_type: string;
      acquired_date?: string;
      current_location?: string;
      visibility?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await objectsTable
        .insert([{ ...object, created_by: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-objects'] });
      toast({ title: 'Object created', description: 'The object has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create object', description: error.message, variant: 'destructive' });
    },
  });
}

// Create place
export function useCreatePlace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (place: {
      family_id: string;
      name: string;
      place_type: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      description?: string;
      years_active?: string;
      visibility?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await placesTable
        .insert([{ ...place, created_by: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-places'] });
      toast({ title: 'Place created', description: 'The place has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create place', description: error.message, variant: 'destructive' });
    },
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (project: {
      family_id: string;
      name: string;
      project_type: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      status?: string;
      visibility?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await projectsTable
        .insert([{ ...project, created_by: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-projects'] });
      toast({ title: 'Project created', description: 'The project has been added successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create project', description: error.message, variant: 'destructive' });
    },
  });
}

// Link object to person
export function useLinkObjectToPerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (link: {
      object_id: string;
      person_id: string;
      relationship_type: string;
      from_date?: string;
      to_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await objectLinksTable.insert([link]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-objects', variables.person_id] });
      queryClient.invalidateQueries({ queryKey: ['object-people', variables.object_id] });
      toast({ title: 'Link created', description: 'Object linked to person successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to link', description: error.message, variant: 'destructive' });
    },
  });
}

// Link place to person
export function useLinkPlaceToPerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (link: {
      place_id: string;
      person_id: string;
      relationship_type: string;
      from_date?: string;
      to_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await placeLinksTable.insert([link]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-places', variables.person_id] });
      queryClient.invalidateQueries({ queryKey: ['place-people', variables.place_id] });
      toast({ title: 'Link created', description: 'Place linked to person successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to link', description: error.message, variant: 'destructive' });
    },
  });
}

// Link project to person
export function useLinkProjectToPerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (link: {
      project_id: string;
      person_id: string;
      role: string;
      from_date?: string;
      to_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await projectLinksTable.insert([link]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-projects', variables.person_id] });
      queryClient.invalidateQueries({ queryKey: ['project-people', variables.project_id] });
      toast({ title: 'Link created', description: 'Project linked to person successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to link', description: error.message, variant: 'destructive' });
    },
  });
}
