import { supabase } from '@/integrations/supabase/client'

export class MediaService {
  /**
   * Gets a signed URL for a media file stored in Supabase storage
   * @param filePath The file path in the media bucket
   * @returns The signed URL or null if error
   */
  static async getMediaUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(filePath, 3600)

      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error getting media URL:', error)
      return null
    }
  }

  /**
   * Gets signed URLs for multiple media files
   * @param filePaths Array of file paths
   * @returns Array of URLs in the same order
   */
  static async getMediaUrls(filePaths: string[]): Promise<(string | null)[]> {
    return Promise.all(
      filePaths.map(path => this.getMediaUrl(path))
    )
  }

  /**
   * Gets a temporary signed URL for a private media file (valid for 1 hour)
   * @param filePath The file path in the media bucket
   * @returns The signed URL or null if error
   */
  static async getSignedMediaUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Error getting signed media URL:', error)
      return null
    }
  }
}