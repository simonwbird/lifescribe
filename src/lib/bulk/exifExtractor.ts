/**
 * EXIF Data Extraction from Images
 * Extracts date, location, and other metadata
 */

import ExifReader from 'exifreader'

export interface ExifData {
  dateTaken?: string
  latitude?: number
  longitude?: number
  location?: string
  camera?: string
  orientation?: number
}

export interface ExtractedMetadata extends ExifData {
  fileName: string
  fileSize: number
  mimeType: string
  error?: string
}

export async function extractExifData(file: File): Promise<ExtractedMetadata> {
  const metadata: ExtractedMetadata = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const tags = ExifReader.load(arrayBuffer)

    // Extract date taken
    if (tags.DateTimeOriginal?.description) {
      metadata.dateTaken = parseExifDate(tags.DateTimeOriginal.description)
    } else if (tags.DateTime?.description) {
      metadata.dateTaken = parseExifDate(tags.DateTime.description)
    }

    // Extract GPS coordinates
    if (tags.GPSLatitude && tags.GPSLongitude) {
      metadata.latitude = parseGPSCoordinate(
        tags.GPSLatitude.description,
        tags.GPSLatitudeRef?.value?.[0]
      )
      metadata.longitude = parseGPSCoordinate(
        tags.GPSLongitude.description,
        tags.GPSLongitudeRef?.value?.[0]
      )
    }

    // Extract camera info
    if (tags.Make?.description && tags.Model?.description) {
      metadata.camera = `${tags.Make.description} ${tags.Model.description}`
    }

    // Extract orientation
    if (tags.Orientation?.value) {
      metadata.orientation = tags.Orientation.value as number
    }

  } catch (error) {
    metadata.error = (error as Error).message
    console.warn('EXIF extraction failed for', file.name, error)
  }

  return metadata
}

function parseExifDate(exifDate: string): string {
  try {
    // EXIF format: "2024:01:15 14:30:00"
    const [datePart, timePart] = exifDate.split(' ')
    const [year, month, day] = datePart.split(':')
    return `${year}-${month}-${day}T${timePart}`
  } catch {
    return exifDate
  }
}

function parseGPSCoordinate(dmsString: string, ref?: string): number {
  try {
    // Parse DMS format: "37° 46' 30.12""
    const parts = dmsString.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"/)
    if (!parts) return 0

    const degrees = parseFloat(parts[1])
    const minutes = parseFloat(parts[2])
    const seconds = parseFloat(parts[3])

    let decimal = degrees + minutes / 60 + seconds / 3600

    // Apply hemisphere
    if (ref === 'S' || ref === 'W') {
      decimal = -decimal
    }

    return decimal
  } catch {
    return 0
  }
}

export async function batchExtractExif(files: File[]): Promise<ExtractedMetadata[]> {
  const results: ExtractedMetadata[] = []
  
  for (const file of files) {
    const metadata = await extractExifData(file)
    results.push(metadata)
  }

  return results
}
