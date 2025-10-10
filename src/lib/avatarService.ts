import { supabase } from '@/integrations/supabase/client'

/**
 * Utility to handle avatar URLs and regenerate expired signed URLs
 */
export class AvatarService {
  static extractFilePath(signedUrl: string): string | null {
    try {
      const url = new URL(signedUrl)
      // Extract path between /storage/v1/object/sign/media/ and ?token=
      const match = url.pathname.match(/\/storage\/v1\/object\/sign\/media\/(.+)$/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  static async refreshSignedUrl(avatarUrl: string): Promise<string | null> {
    if (!avatarUrl?.includes('supabase.co/storage/v1/object/sign')) {
      return avatarUrl // Not a Supabase signed URL, return as-is
    }

    const filePath = this.extractFilePath(avatarUrl)
    if (!filePath) {
      console.error('❌ Could not extract file path from:', avatarUrl)
      return null
    }

    try {
      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error || !data?.signedUrl) {
        console.error('❌ Failed to create signed URL for:', filePath, error)
        return null
      }

      console.log('✅ Refreshed signed URL for:', filePath)
      return data.signedUrl
    } catch (error) {
      console.error('❌ Error refreshing signed URL:', error)
      return null
    }
  }

  static async getValidAvatarUrl(originalUrl: string | null): Promise<string | null> {
    if (!originalUrl) return null
    
    // If it's not a signed URL, return as-is
    if (!originalUrl.includes('supabase.co/storage/v1/object/sign')) {
      return originalUrl
    }

    // Try to refresh the signed URL
    return await this.refreshSignedUrl(originalUrl)
  }
}