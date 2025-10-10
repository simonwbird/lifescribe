import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export type IndexabilityLevel = 'private' | 'unlisted' | 'public_indexable'

export interface PersonSEOSettings {
  indexability: IndexabilityLevel
  ogTitle?: string
  ogDescription?: string
  ogImageUrl?: string
  slug: string
}

export function usePersonSEO(personId: string) {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['person-seo', personId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people' as any)
        .select('indexability, og_title, og_description, og_image_url, slug')
        .eq('id', personId)
        .single() as any

      if (error) throw error
      
      return {
        indexability: (data?.indexability || 'private') as IndexabilityLevel,
        ogTitle: data?.og_title,
        ogDescription: data?.og_description,
        ogImageUrl: data?.og_image_url,
        slug: data?.slug || ''
      } as PersonSEOSettings
    }
  })

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<PersonSEOSettings>) => {
      const { error } = await supabase
        .from('people' as any)
        .update({
          indexability: updates.indexability,
          og_title: updates.ogTitle,
          og_description: updates.ogDescription,
          og_image_url: updates.ogImageUrl
        })
        .eq('id', personId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-seo', personId] })
      queryClient.invalidateQueries({ queryKey: ['person-page', personId] })
      toast.success('SEO settings updated')
    },
    onError: (error) => {
      console.error('Failed to update SEO settings:', error)
      toast.error('Failed to update SEO settings')
    }
  })

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending
  }
}

export function usePublicPersonPages() {
  return useQuery({
    queryKey: ['public-person-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_person_pages' as any)
        .select('*')

      if (error) throw error
      return data || []
    }
  })
}
