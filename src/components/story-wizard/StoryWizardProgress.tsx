import { ChevronRight } from 'lucide-react'
import { WIZARD_STEPS, PHOTO_FIRST_STEPS, type WizardStep, type AutosaveStatus } from './StoryWizardTypes'

interface StoryWizardProgressProps {
  currentStep: WizardStep
  completedSteps: WizardStep[]
  autosaveStatus: AutosaveStatus
  isPhotoFirst?: boolean
}

export default function StoryWizardProgress({ 
  currentStep, 
  completedSteps, 
  autosaveStatus,
  isPhotoFirst = false
}: StoryWizardProgressProps) {
  
  const stepOrder = isPhotoFirst ? PHOTO_FIRST_STEPS : WIZARD_STEPS
  const currentIndex = stepOrder.findIndex(s => s.id === currentStep)
  
  return (
    <div className="mb-6">
      {/* Progress Bar */}
      <div className="mb-4 h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-brand-green transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / stepOrder.length) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {stepOrder.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${
                step.id === currentStep 
                  ? 'text-foreground font-medium' 
                  : completedSteps.includes(step.id)
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/60'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step.id === currentStep 
                    ? 'bg-brand-green text-brand-green-foreground'
                    : completedSteps.includes(step.id)
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-muted/50 text-muted-foreground/60'
                }`}>
                  {index + 1}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{index + 1}</span>
              </div>
              {index < stepOrder.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60" />
              )}
            </div>
          ))}
        </div>

        {/* Autosave Status */}
        <div className={`text-xs flex items-center gap-1 ${
          autosaveStatus.status === 'saving' ? 'text-muted-foreground animate-pulse' :
          autosaveStatus.status === 'saved' ? 'text-muted-foreground' :
          autosaveStatus.status === 'error' ? 'text-destructive' :
          'text-muted-foreground/60'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            autosaveStatus.status === 'saving' ? 'bg-brand-green animate-pulse' :
            autosaveStatus.status === 'saved' ? 'bg-brand-green' :
            autosaveStatus.status === 'error' ? 'bg-destructive' :
            'bg-muted-foreground/30'
          }`} />
          <span className="hidden sm:inline">{autosaveStatus.message}</span>
          <span className="sm:hidden">
            {autosaveStatus.status === 'saved' ? '✓' : 
             autosaveStatus.status === 'saving' ? '...' : 
             autosaveStatus.status === 'error' ? '✗' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}