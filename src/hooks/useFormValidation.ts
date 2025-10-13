import { useState, useCallback } from 'react'

interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

interface FieldValidation {
  [fieldName: string]: ValidationRule[]
}

export function useFormValidation(validationRules: FieldValidation) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rules = validationRules[fieldName]
    if (!rules) return null

    for (const rule of rules) {
      if (!rule.validate(value)) {
        return rule.message
      }
    }

    return null
  }, [validationRules])

  const validate = useCallback((data: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [validationRules, validateField])

  const validateSingle = useCallback((fieldName: string, value: any) => {
    const error = validateField(fieldName, value)
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }))
    return !error
  }, [validateField])

  const touchField = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }, [])

  const resetValidation = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined
  }, [errors, touched])

  return {
    errors,
    touched,
    validate,
    validateSingle,
    touchField,
    resetValidation,
    getFieldError
  }
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value != null
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.trim().length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.trim().length <= max,
    message: message || `Must be no more than ${max} characters`
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  url: (message = 'Invalid URL'): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message
  })
}
