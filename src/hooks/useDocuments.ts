import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { PropertyDocument } from '@/lib/propertyTypes'

export function useDocuments(propertyId: string, familyId: string) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['property-documents', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_documents' as any)
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as PropertyDocument[]
    },
  })

  const createDocument = useMutation({
    mutationFn: async (doc: Partial<PropertyDocument>) => {
      const { data, error } = await supabase
        .from('property_documents' as any)
        .insert({
          ...doc,
          property_id: propertyId,
          family_id: familyId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as unknown as PropertyDocument
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] })
      toast({
        title: 'Document added',
        description: 'The document has been added successfully.',
      })
    },
    onError: (error) => {
      console.error('Error creating document:', error)
      toast({
        title: 'Error',
        description: 'Failed to add document.',
        variant: 'destructive',
      })
    },
  })

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('property_documents' as any)
        .delete()
        .eq('id', documentId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-documents', propertyId] })
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.',
      })
    },
    onError: (error) => {
      console.error('Error deleting document:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      })
    },
  })

  const uploadFile = async (file: File, familyId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${familyId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('property-documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('property-documents')
      .getPublicUrl(filePath)

    return { filePath, publicUrl }
  }

  return {
    documents,
    isLoading,
    createDocument: createDocument.mutate,
    deleteDocument: deleteDocument.mutate,
    uploadFile,
  }
}
