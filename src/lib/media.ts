import { supabase } from '@/integrations/supabase/client'

export interface MediaProxyRequest {
  filePath: string
  familyId: string
}

export interface MediaProxyResponse {
  signedUrl: string
  expiresIn: number
}

/**
 * Get a signed URL for a media file via the media-proxy edge function
 * This ensures proper access control based on family membership
 */
export async function getSignedMediaUrl(filePath: string, familyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<MediaProxyResponse>('media-proxy', {
      body: {
        filePath,
        familyId
      } as MediaProxyRequest
    })

    if (error) {
      console.error('Media proxy error:', error)
      return null
    }

    return data?.signedUrl || null
  } catch (error) {
    console.error('Failed to get signed media URL:', error)
    return null
  }
}

/**
 * Upload a file to Supabase Storage with proper family-based path structure
 * Path format: family_id/profile_id/filename
 */
export async function uploadMediaFile(
  file: File, 
  familyId: string, 
  profileId: string
): Promise<{ path: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${familyId}/${profileId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { path: '', error: uploadError.message }
    }

    return { path: filePath }
  } catch (error) {
    console.error('Failed to upload file:', error)
    return { path: '', error: 'Upload failed' }
  }
}