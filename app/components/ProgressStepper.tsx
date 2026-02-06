/**
 * ProgressStepper Component
 * Visual progress indicator for multi-step forms
 */

'use client';

interface Step {
  number: number;
  label: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

export default function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" style={{ zIndex: 0 }} />
        
        {/* Active progress bar */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            zIndex: 1
          }}
        />

        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <div key={step.number} className="flex flex-col items-center relative" style={{ zIndex: 2 }}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent text-black'
                    : isActive
                    ? 'bg-accent/20 text-accent border-2 border-accent'
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-gray-200' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
