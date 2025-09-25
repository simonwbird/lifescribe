import { useState, useEffect, useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Shield } from 'lucide-react'

interface CaptchaProps {
  onVerify: (token: string) => void
  onError?: (error: string) => void
  siteKey?: string
  theme?: 'light' | 'dark'
  size?: 'normal' | 'compact' | 'invisible'
  loading?: boolean
}

// Simple math captcha fallback for development/testing
interface MathCaptchaProps {
  onVerify: (isValid: boolean) => void
  onError?: (error: string) => void
}

function MathCaptcha({ onVerify, onError }: MathCaptchaProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operators = ['+', '-', '*']
    const operator = operators[Math.floor(Math.random() * operators.length)]
    
    let result: number
    switch (operator) {
      case '+':
        result = num1 + num2
        break
      case '-':
        result = Math.abs(num1 - num2) // Keep positive
        setQuestion(`${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ?`)
        setCorrectAnswer(result)
        return
      case '*':
        result = num1 * num2
        break
      default:
        result = num1 + num2
    }
    
    setQuestion(`${num1} ${operator} ${num2} = ?`)
    setCorrectAnswer(result)
  }

  useEffect(() => {
    generateQuestion()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault() 
    
    const userAnswer = parseInt(answer)
    if (userAnswer === correctAnswer) {
      onVerify(true)
    } else {
      setAttempts(prev => prev + 1)
      if (attempts >= 2) {
        onError?.('Too many incorrect attempts. Please refresh and try again.')
        return
      }
      onError?.('Incorrect answer. Please try again.')
      setAnswer('')
      generateQuestion()
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Security Verification</span>
      </div>
      
      <div className="text-center">
        <p className="text-lg font-mono font-semibold mb-3">{question}</p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter answer"
            className="w-20 px-3 py-2 border rounded text-center"
            required
            autoFocus
          />
          
          <div className="flex gap-2 justify-center">
            <Button type="submit" size="sm">
              Verify
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                setAnswer('')
                generateQuestion()
              }}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </form>
        
        {attempts > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Attempts: {attempts}/3
          </p>
        )}
      </div>
    </div>
  )
}

export default function Captcha({
  onVerify,
  onError,
  siteKey,
  theme = 'light',
  size = 'normal',
  loading = false
}: CaptchaProps) {
  const [showFallback, setShowFallback] = useState(true) // Always use fallback for now
  const [error, setError] = useState<string | null>(null)

  // For now, we'll use the math captcha fallback
  // In production, you can integrate hCaptcha or Cloudflare Turnstile
  
  const handleMathCaptchaVerify = (isValid: boolean) => {
    if (isValid) {
      // Generate a simple token for the math captcha
      const token = `math_captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      onVerify(token)
    }
  }

  const handleMathCaptchaError = (errorMsg: string) => {
    setError(errorMsg)
    onError?.(errorMsg)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading security verification...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showFallback ? (
        <MathCaptcha 
          onVerify={handleMathCaptchaVerify}
          onError={handleMathCaptchaError}
        />
      ) : (
        <div className="text-center p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            External captcha service would be loaded here
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowFallback(true)}
          >
            Use Fallback Verification
          </Button>
        </div>
      )}
    </div>
  )
}