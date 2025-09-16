import { supabase } from '@/lib/supabase'

export interface SecurityAuditEvent {
  user_id?: string
  family_id?: string
  action: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

/**
 * Log a security event to the audit log
 */
export async function logSecurityEvent(event: SecurityAuditEvent) {
  try {
    const { error } = await supabase.rpc('log_security_event', {
      p_user_id: event.user_id || null,
      p_family_id: event.family_id || null,
      p_action: event.action,
      p_details: event.details || {},
      p_ip_address: event.ip_address || null,
      p_user_agent: event.user_agent || navigator.userAgent || null
    })

    if (error) {
      console.error('Failed to log security event:', error)
    }
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

/**
 * Get security audit logs for family admins
 */
export async function getSecurityAuditLogs(familyId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch security audit logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching security audit logs:', error)
    return []
  }
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureId(length = 16): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for environments without crypto.randomUUID
  const array = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Last resort fallback (should rarely be used)
  console.warn('Using insecure random generation - crypto APIs not available')
  return Math.random().toString(36).substring(2, length + 2)
}

/**
 * Validate password strength
 */
export interface PasswordStrengthResult {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score++
  else feedback.push('Password should be at least 8 characters long')

  // Uppercase check
  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add an uppercase letter')

  // Lowercase check  
  if (/[a-z]/.test(password)) score++
  else feedback.push('Add a lowercase letter')

  // Number check
  if (/\d/.test(password)) score++
  else feedback.push('Add a number')

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  else feedback.push('Add a special character')

  // Common password patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein']
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2)
    feedback.push('Avoid common password patterns')
  }

  return {
    score: Math.min(4, score),
    feedback,
    isValid: score >= 3 && password.length >= 8
  }
}

/**
 * Mask email for display (keeps first 2 chars and domain)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  
  const [localPart, domain] = email.split('@')
  if (localPart.length <= 2) return email
  
  return `${localPart.substring(0, 2)}***@${domain}`
}

/**
 * Check if current session is secure (HTTPS in production)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true // SSR context
  
  return (
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

/**
 * Security constants
 */
export const SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT_WARNING: 5 * 60 * 1000, // 5 minutes before expiry
  PASSWORD_MIN_LENGTH: 8,
  INVITE_RATE_LIMIT: 10, // per hour
  INVITE_LINK_RATE_LIMIT: 5, // per hour
} as const