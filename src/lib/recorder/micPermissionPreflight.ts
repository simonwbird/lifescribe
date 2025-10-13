/**
 * Microphone Permission Preflight
 * Handles mic access with friendly UI guidance
 */

export type MicPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported'

export interface MicPreflightResult {
  status: MicPermissionStatus
  stream?: MediaStream
  error?: string
}

export async function runMicPreflight(): Promise<MicPreflightResult> {
  // Check if browser supports getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      status: 'unsupported',
      error: 'Browser does not support microphone access'
    }
  }

  try {
    // Try to query permission state first (non-blocking)
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        })
        
        if (permission.state === 'denied') {
          return {
            status: 'denied',
            error: 'Microphone access is blocked. Please enable it in your browser settings.'
          }
        }
      } catch (e) {
        // Some browsers don't support querying microphone permission
        console.warn('Permission query not supported:', e)
      }
    }

    // Attempt to get microphone access (will prompt if needed)
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    return {
      status: 'granted',
      stream
    }

  } catch (error) {
    const err = error as DOMException
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        status: 'denied',
        error: 'Microphone access was denied. Please check your browser permissions.'
      }
    }
    
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return {
        status: 'unsupported',
        error: 'No microphone found. Please connect a microphone and try again.'
      }
    }

    return {
      status: 'denied',
      error: err.message || 'Could not access microphone'
    }
  }
}

export function cleanupMicStream(stream?: MediaStream): void {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
}
