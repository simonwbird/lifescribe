import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeWizardStep } from '@/lib/recipeTypes'
import { RECIPE_WIZARD_STEPS } from '@/lib/recipeTypes'

interface RecipeWizardProgressProps {
  currentStep: RecipeWizardStep
  completedSteps: RecipeWizardStep[]
}

export default function RecipeWizardProgress({ 
  currentStep, 
  completedSteps 
}: RecipeWizardProgressProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
      {RECIPE_WIZARD_STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = currentStep === step.id
        const isActive = isCurrent || isCompleted

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-accent border-accent text-accent-foreground",
                  isCurrent && !isCompleted && "border-accent text-accent-foreground",
                  !isActive && "border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={cn(
                  "text-xs font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                <div className={cn(
                  "text-xs mt-1 hidden sm:block",
                  isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {index < RECIPE_WIZARD_STEPS.length - 1 && (
              <div 
                className={cn(
                  "h-0.5 w-16 sm:w-24 mx-2 mt-[-1.5rem] transition-colors",
                  completedSteps.includes(step.id) && completedSteps.includes(RECIPE_WIZARD_STEPS[index + 1].id)
                    ? "bg-accent" 
                    : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}