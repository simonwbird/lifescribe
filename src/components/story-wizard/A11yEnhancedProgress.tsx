import { AutosaveStatus } from '@/hooks/useDraftManager'
import { type WizardStep, WIZARD_STEPS, PHOTO_FIRST_STEPS, AUDIO_FIRST_STEPS, VIDEO_FIRST_STEPS } from './StoryWizardTypes'

interface A11yEnhancedProgressProps {
  currentStep: WizardStep
  completedSteps: WizardStep[]
  autosaveStatus?: AutosaveStatus
  isPhotoFirst?: boolean
  isAudioFirst?: boolean
  isVideoFirst?: boolean
}

export function A11yEnhancedProgress({
  currentStep,
  completedSteps,
  autosaveStatus,
  isPhotoFirst,
  isAudioFirst,
  isVideoFirst
}: A11yEnhancedProgressProps) {
  const steps = isPhotoFirst ? PHOTO_FIRST_STEPS :
                isAudioFirst ? AUDIO_FIRST_STEPS :
                isVideoFirst ? VIDEO_FIRST_STEPS :
                WIZARD_STEPS

  const currentIndex = steps.findIndex(s => s.id === currentStep)
  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div 
        role="progressbar" 
        aria-valuenow={Math.round(progress)} 
        aria-valuemin={0} 
        aria-valuemax={100}
        aria-label={`Story creation progress: ${Math.round(progress)}% complete`}
        className="w-full bg-secondary rounded-full h-2 overflow-hidden"
      >
        <div 
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <nav aria-label="Story creation steps">
        <ol className="flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id as WizardStep)
            const isCurrent = step.id === currentStep
            
            return (
              <li 
                key={step.id}
                className={`
                  flex-1 text-center relative
                  ${index !== steps.length - 1 ? 'after:content-[""] after:absolute after:top-4 after:left-1/2 after:w-full after:h-0.5 after:bg-border' : ''}
                `}
              >
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      transition-colors duration-200
                      ${isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : ''}
                      ${isCompleted && !isCurrent ? 'bg-green-600 text-white' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                    `}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Step ${index + 1}: ${step.title} - ${
                      isCurrent ? 'Current step' : 
                      isCompleted ? 'Completed' : 
                      'Not started'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span 
                    className={`
                      text-xs font-medium max-w-[80px] hidden sm:block
                      ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {step.title}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Autosave status */}
      {autosaveStatus && (
        <div 
          className="text-sm text-muted-foreground flex items-center justify-center gap-2"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">Autosave status:</span>
          {autosaveStatus.message}
        </div>
      )}
    </div>
  )
}
