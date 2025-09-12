import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VEHICLE_WIZARD_STEPS, type VehicleWizardStep } from '@/lib/vehicleTypes'

interface VehicleWizardProgressProps {
  currentStep: VehicleWizardStep
  completedSteps: VehicleWizardStep[]
}

export default function VehicleWizardProgress({
  currentStep,
  completedSteps
}: VehicleWizardProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {VEHICLE_WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          const isPast = step.id < currentStep

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium",
                    {
                      "border-primary bg-primary text-primary-foreground": isCurrent || isCompleted,
                      "border-muted-foreground bg-background text-muted-foreground": !isCurrent && !isCompleted && !isPast,
                      "border-muted bg-muted text-muted-foreground": isPast && !isCompleted
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    {
                      "text-foreground": isCurrent || isCompleted,
                      "text-muted-foreground": !isCurrent && !isCompleted
                    }
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < VEHICLE_WIZARD_STEPS.length - 1 && (
                <div className="flex-1 mx-4 mt-5">
                  <div
                    className={cn(
                      "h-0.5 w-full",
                      {
                        "bg-primary": step.id < currentStep || isCompleted,
                        "bg-muted": step.id >= currentStep && !isCompleted
                      }
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}