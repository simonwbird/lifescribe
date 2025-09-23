/**
 * Network utilities with timeout and cancellation support
 */

export interface NetworkConfig {
  timeout?: number
  signal?: AbortSignal
}

const DEFAULT_TIMEOUT = 10000 // 10 seconds

/**
 * Creates an AbortController that times out after specified duration
 */
export function createTimeoutController(timeout = DEFAULT_TIMEOUT): AbortController {
  const controller = new AbortController()
  
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)
  
  // Clear timeout if request completes before timeout
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId)
  })
  
  return controller
}

/**
 * Wrapper for fetch with timeout and better error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  config: NetworkConfig = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, signal } = config
  
  // Create timeout controller if no signal provided
  const controller = signal ? undefined : createTimeoutController(timeout)
  const requestSignal = signal || controller?.signal
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: requestSignal
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out')
      }
      throw error
    }
    throw new Error('Network request failed')
  }
}

/**
 * Creates a cancellable promise wrapper
 */
export function makeCancellable<T>(
  promise: Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      reject(new Error('Operation cancelled'))
    }
    
    if (signal?.aborted) {
      reject(new Error('Operation cancelled'))
      return
    }
    
    signal?.addEventListener('abort', abortHandler)
    
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal?.removeEventListener('abort', abortHandler)
      })
  })
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}