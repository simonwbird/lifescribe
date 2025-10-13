// Utility to extract EXIF data from images
export async function extractExifDate(file: File): Promise<Date | null> {
  try {
    // Use the browser's built-in EXIF support via File API
    const arrayBuffer = await file.arrayBuffer()
    const dataView = new DataView(arrayBuffer)
    
    // Look for EXIF marker (0xFFE1)
    let offset = 2 // Skip JPEG SOI marker
    while (offset < dataView.byteLength) {
      const marker = dataView.getUint16(offset, false)
      if (marker === 0xFFE1) {
        // Found EXIF segment
        const segmentLength = dataView.getUint16(offset + 2, false)
        const exifString = new TextDecoder().decode(
          new Uint8Array(arrayBuffer, offset + 4, 6)
        )
        
        if (exifString === 'Exif\0\0') {
          // Parse date from EXIF (simplified - in production use a proper EXIF library)
          return await extractDateFromExifSegment(arrayBuffer, offset, segmentLength)
        }
      }
      offset += dataView.getUint16(offset + 2, false) + 2
    }
    
    return null
  } catch (error) {
    console.error('Error extracting EXIF:', error)
    return null
  }
}

async function extractDateFromExifSegment(
  buffer: ArrayBuffer,
  offset: number,
  length: number
): Promise<Date | null> {
  try {
    // This is a simplified implementation
    // In production, use a proper EXIF parsing library like exif-js
    const exifData = new Uint8Array(buffer, offset + 10, length - 10)
    const text = new TextDecoder().decode(exifData)
    
    // Look for DateTime tag (0x0132)
    // Format: YYYY:MM:DD HH:MM:SS
    const dateMatch = text.match(/\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}/)
    if (dateMatch) {
      const [datePart, timePart] = dateMatch[0].split(' ')
      const [year, month, day] = datePart.split(':').map(Number)
      const [hour, minute, second] = timePart.split(':').map(Number)
      
      return new Date(year, month - 1, day, hour, minute, second)
    }
    
    return null
  } catch (error) {
    console.error('Error parsing EXIF date:', error)
    return null
  }
}

// Helper to check if file has EXIF data
export function hasExifSupport(file: File): boolean {
  return file.type === 'image/jpeg' || file.type === 'image/tiff'
}
