import { ReactNode } from 'react'

interface A11yFieldWrapperProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

/**
 * Accessible field wrapper with proper ARIA attributes
 */
export function A11yFieldWrapper({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children
}: A11yFieldWrapperProps) {
  const hintId = `${htmlFor}-hint`
  const errorId = `${htmlFor}-error`
  
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {children}
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      
      {error && (
        <p 
          id={errorId} 
          className="text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
