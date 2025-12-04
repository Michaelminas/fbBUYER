'use client';

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export type ProgressStep = 
  | 'quote' 
  | 'details' 
  | 'verification' 
  | 'scheduling' 
  | 'confirmed';

interface ProgressStepperProps {
  currentStep: ProgressStep;
  className?: string;
  onStepClick?: (step: ProgressStep) => void;
  leadId?: string;
}

const steps = [
  {
    id: 'quote' as const,
    title: 'Get Quote',
    description: 'Device & pricing',
    icon: '📱',
    completedIcon: '✅'
  },
  {
    id: 'details' as const,
    title: 'Your Details',
    description: 'Contact info',
    icon: '👤',
    completedIcon: '✅'
  },
  {
    id: 'verification' as const,
    title: 'Verify Email',
    description: 'Check your inbox',
    icon: '📧',
    completedIcon: '✅'
  },
  {
    id: 'scheduling' as const,
    title: 'Schedule',
    description: 'Pick a time',
    icon: '📅',
    completedIcon: '✅'
  },
  {
    id: 'confirmed' as const,
    title: 'Confirmed',
    description: 'All set!',
    icon: '🎉',
    completedIcon: '🎉'
  }
];

export default function ProgressStepper({ 
  currentStep, 
  className = '', 
  onStepClick,
  leadId 
}: ProgressStepperProps) {
  const analytics = useAnalytics();
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  useEffect(() => {
    // Track progress step views for conversion analysis
    analytics.track({
      event: 'progress_step_viewed',
      category: 'conversion',
      action: 'step_viewed',
      properties: {
        step: currentStep,
        stepIndex: currentStepIndex + 1,
        totalSteps: steps.length,
        leadId
      }
    });
  }, [currentStep, currentStepIndex, leadId, analytics]);

  const handleStepClick = (step: typeof steps[0], index: number) => {
    // Only allow clicking on previous steps (for going back)
    if (index <= currentStepIndex && onStepClick) {
      analytics.track({
        event: 'progress_step_clicked',
        category: 'navigation',
        action: 'step_clicked',
        properties: {
          clickedStep: step.id,
          fromStep: currentStep,
          leadId
        }
      });
      onStepClick(step.id);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Progress Bar */}
      <div className="block md:hidden mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="text-center mt-2">
          <div className="text-lg font-medium text-gray-900 flex items-center justify-center gap-2">
            <span>{steps[currentStepIndex]?.completedIcon || steps[currentStepIndex]?.icon}</span>
            {steps[currentStepIndex]?.title}
          </div>
          <div className="text-sm text-gray-600">{steps[currentStepIndex]?.description}</div>
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isClickable = index <= currentStepIndex && onStepClick;

              return (
                <li key={step.id} className="relative flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center group">
                    <button
                      type="button"
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-200
                        ${isCompleted 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : isCurrent 
                            ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-200' 
                            : 'bg-gray-200 text-gray-500'
                        }
                        ${isClickable 
                          ? 'hover:scale-105 cursor-pointer hover:shadow-lg' 
                          : 'cursor-default'
                        }
                      `}
                      onClick={() => handleStepClick(step, index)}
                      disabled={!isClickable}
                    >
                      {isCompleted ? (
                        <span className="text-base">{step.completedIcon}</span>
                      ) : (
                        <span className="text-base">{step.icon}</span>
                      )}
                    </button>
                    
                    {/* Step Label */}
                    <div className="mt-2 text-center">
                      <div className={`
                        text-sm font-medium transition-colors duration-200
                        ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}
                      `}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-5 left-1/2 transform translate-x-1/2 w-full h-0.5 -z-10">
                      <div 
                        className={`
                          h-full transition-colors duration-300
                          ${index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}
                        `}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        Current step: {steps[currentStepIndex]?.title} ({currentStepIndex + 1} of {steps.length})
      </div>
    </div>
  );
}

// Hook for tracking step changes and drop-offs
export function useProgressTracking(leadId?: string) {
  const analytics = useAnalytics();

  const trackStepCompleted = (completedStep: ProgressStep, nextStep?: ProgressStep) => {
    analytics.track({
      event: 'progress_step_completed',
      category: 'conversion',
      action: 'step_completed',
      properties: {
        completedStep,
        nextStep,
        leadId,
        timestamp: new Date().toISOString()
      }
    });
  };

  const trackDropOff = (dropOffStep: ProgressStep, reason?: string) => {
    analytics.track({
      event: 'progress_drop_off',
      category: 'conversion',
      action: 'drop_off',
      properties: {
        dropOffStep,
        reason,
        leadId,
        timestamp: new Date().toISOString(),
        timeSpentOnStep: Date.now() // You could track actual time spent
      }
    });
  };

  const trackPageExit = (currentStep: ProgressStep) => {
    // This would typically be called on beforeunload or page visibility change
    analytics.track({
      event: 'progress_page_exit',
      category: 'conversion',
      action: 'page_exit',
      properties: {
        currentStep,
        leadId,
        timestamp: new Date().toISOString()
      }
    });
  };

  return {
    trackStepCompleted,
    trackDropOff,
    trackPageExit
  };
}