interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div
            key={stepNumber}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isActive || isCompleted
                ? 'bg-accent'
                : 'border-2 border-border bg-transparent'
            }`}
            aria-label={`Step ${stepNumber} of ${totalSteps}${isActive ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
          />
        );
      })}
    </div>
  );
}
