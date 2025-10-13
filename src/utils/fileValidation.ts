// Enhanced file validation for Simple Mode uploads
export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

// Comprehensive file type definitions
export const SUPPORTED_FILE_TYPES = {
  // Image formats
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    'image/bmp': ['.bmp'],
    'image/tiff': ['.tiff', '.tif'],
    'image/heic': ['.heic', '.heif'], // iOS formats
    'image/avif': ['.avif'] // Modern format
  },
  
  // Video formats
  videos: {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/ogg': ['.ogv', '.ogg'],
    'video/avi': ['.avi'],
    'video/mov': ['.mov'],
    'video/quicktime': ['.mov', '.qt'],
    'video/x-msvideo': ['.avi'],
    'video/3gpp': ['.3gp'],
    'video/x-flv': ['.flv'],
    'video/x-ms-wmv': ['.wmv']
  },
  
  // Audio formats
  audio: {
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg', '.oga'],
    'audio/aac': ['.aac'],
    'audio/mp4': ['.m4a', '.mp4'],
    'audio/webm': ['.webm'],
    'audio/flac': ['.flac'],
    'audio/x-ms-wma': ['.wma'],
    'audio/amr': ['.amr'], // Voice recordings
    'audio/3gpp': ['.3ga']
  }
}

// Size limits (in bytes)
export const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB - increased for large videos
  audio: 50 * 1024 * 1024, // 50MB
  default: 50 * 1024 * 1024 // 50MB fallback
}

// Get all supported MIME types
export function getAllSupportedMimeTypes(): string[] {
  return [
    ...Object.keys(SUPPORTED_FILE_TYPES.images),
    ...Object.keys(SUPPORTED_FILE_TYPES.videos),
    ...Object.keys(SUPPORTED_FILE_TYPES.audio)
  ]
}

// Get supported types for specific category
export function getSupportedMimeTypes(category: 'images' | 'videos' | 'audio'): string[] {
  return Object.keys(SUPPORTED_FILE_TYPES[category])
}

// Get file category from MIME type
export function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | null {
  if (Object.keys(SUPPORTED_FILE_TYPES.images).includes(mimeType)) return 'image'
  if (Object.keys(SUPPORTED_FILE_TYPES.videos).includes(mimeType)) return 'video'
  if (Object.keys(SUPPORTED_FILE_TYPES.audio).includes(mimeType)) return 'audio'
  return null
}

// Get size limit for file type
export function getSizeLimit(mimeType: string): number {
  const category = getFileCategory(mimeType)
  if (!category) return SIZE_LIMITS.default
  return SIZE_LIMITS[category]
}

// Validate single file
export function validateFile(file: File): FileValidationResult {
  const warnings: string[] = []
  
  // Check if file type is supported
  const category = getFileCategory(file.type)
  if (!category) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Please use common image, video, or audio formats.`
    }
  }
  
  // Check file size
  const sizeLimit = getSizeLimit(file.type)
  if (file.size > sizeLimit) {
    const limitMB = Math.round(sizeLimit / 1024 / 1024)
    const fileSizeMB = Math.round(file.size / 1024 / 1024)
    return {
      isValid: false,
      error: `File is too large (${fileSizeMB}MB). Maximum size for ${category} files is ${limitMB}MB.`
    }
  }
  
  // Add warnings for specific cases
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    warnings.push('HEIC/HEIF files may not display on all devices. Consider using JPG or PNG.')
  }
  
  if (file.size > sizeLimit * 0.8) {
    const limitMB = Math.round(sizeLimit / 1024 / 1024)
    warnings.push(`File is quite large. Consider compressing it for faster uploads (max: ${limitMB}MB).`)
  }
  
  if (category === 'video' && file.size > 50 * 1024 * 1024) {
    warnings.push('Large videos may take longer to process and upload.')
  }
  
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

// Validate multiple files
export function validateFiles(files: FileList | File[]): {
  validFiles: File[]
  invalidFiles: { file: File; error: string }[]
  warnings: string[]
} {
  const validFiles: File[] = []
  const invalidFiles: { file: File; error: string }[] = []
  const allWarnings: string[] = []
  
  const fileArray = Array.from(files)
  
  for (const file of fileArray) {
    const result = validateFile(file)
    
    if (result.isValid) {
      validFiles.push(file)
      if (result.warnings) {
        allWarnings.push(...result.warnings.map(w => `${file.name}: ${w}`))
      }
    } else {
      invalidFiles.push({
        file,
        error: result.error || 'Unknown validation error'
      })
    }
  }
  
  return {
    validFiles,
    invalidFiles,
    warnings: allWarnings
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get human-readable file type description
export function getFileTypeDescription(mimeType: string): string {
  const category = getFileCategory(mimeType)
  if (!category) return 'Unknown file type'
  
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'image/heic': 'HEIC Image (iOS)',
    'video/mp4': 'MP4 Video',
    'video/webm': 'WebM Video',
    'video/mov': 'QuickTime Video',
    'audio/mpeg': 'MP3 Audio',
    'audio/wav': 'WAV Audio',
    'audio/m4a': 'M4A Audio',
    'audio/aac': 'AAC Audio'
  }
  
  return typeMap[mimeType] || `${category.charAt(0).toUpperCase() + category.slice(1)} file`
}

// Generate accept attribute for file inputs
export function generateAcceptAttribute(categories: ('images' | 'videos' | 'audio')[]): string {
  const mimeTypes: string[] = []
  
  categories.forEach(category => {
    mimeTypes.push(...getSupportedMimeTypes(category))
  })
  
  return mimeTypes.join(',')
}