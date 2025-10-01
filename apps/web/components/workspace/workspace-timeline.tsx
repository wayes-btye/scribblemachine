'use client'

import { cn } from '@/lib/utils'
import { Upload, Sparkles, Palette, Check } from 'lucide-react'
import type { WorkspaceMode, WorkspaceStep } from '@/hooks/use-workspace-state'

interface WorkspaceTimelineProps {
  mode: WorkspaceMode
  step: WorkspaceStep
  hasInput: boolean // Whether user has uploaded image or entered prompt
}

type TimelineStep = {
  id: number
  label: string
  icon: React.ReactNode
  status: 'completed' | 'active' | 'pending'
}

export function WorkspaceTimeline({ mode, step, hasInput }: WorkspaceTimelineProps) {
  // Determine step statuses based on workspace state
  const getStepStatus = (stepNumber: number): 'completed' | 'active' | 'pending' => {
    // Step 1: Upload/Imagine (input phase)
    if (stepNumber === 1) {
      if (hasInput || step === 'generating' || step === 'result' || step === 'editing') {
        return 'completed'
      }
      return 'active'
    }

    // Step 2: Creating Magic (generating phase)
    if (stepNumber === 2) {
      if (step === 'result' || step === 'editing') {
        return 'completed'
      }
      if (step === 'generating') {
        return 'active'
      }
      return 'pending'
    }

    // Step 3: Ready to Color (result phase)
    if (stepNumber === 3) {
      if (step === 'result' || step === 'editing') {
        return 'active'
      }
      return 'pending'
    }

    return 'pending'
  }

  const steps: TimelineStep[] = [
    {
      id: 1,
      label: mode === 'upload' ? 'Upload Photo' : mode === 'prompt' ? 'Describe Idea' : 'Get Started',
      icon: mode === 'upload' ? <Upload className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />,
      status: getStepStatus(1)
    },
    {
      id: 2,
      label: 'Creating Magic',
      icon: <Sparkles className="h-4 w-4" />,
      status: getStepStatus(2)
    },
    {
      id: 3,
      label: 'Ready to Color!',
      icon: <Palette className="h-4 w-4" />,
      status: getStepStatus(3)
    }
  ]

  return (
    <div className="relative w-full max-w-2xl mx-auto py-4">
      {/* Timeline container */}
      <div className="relative flex items-center justify-between px-10 opacity-80">
        {/* Connection line - centered with icon circles */}
        <div className="absolute left-10 right-10 h-0.5 bg-gray-200"
             style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 0 }} />

        {/* Active progress line - centered with icon circles */}
        <div
          className="absolute left-10 h-0.5 bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange transition-all duration-500 ease-out"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            width:
              step === 'input' && hasInput ? 'calc(25% - 2.5rem)' : // Input provided
              step === 'input' ? '0%' :                              // No input yet
              step === 'generating' ? 'calc(50% - 2.5rem)' :         // Generating
              'calc(100% - 2.5rem)',                                 // Result/Editing
            zIndex: 1
          }}
        />

        {/* Timeline steps */}
        {steps.map((timelineStep, index) => (
          <div key={timelineStep.id} className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
            {/* Step circle */}
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                "shadow-sm",
                {
                  'bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange border-brand-warm-orange text-white':
                    timelineStep.status === 'active',
                  'bg-white border-gray-300 text-gray-400':
                    timelineStep.status === 'pending',
                  'bg-gradient-to-r from-green-500 to-green-600 border-green-600 text-white':
                    timelineStep.status === 'completed'
                }
              )}
            >
              {timelineStep.status === 'completed' ? (
                <Check className="h-5 w-5" />
              ) : (
                timelineStep.icon
              )}
            </div>

            {/* Step label */}
            <div
              className={cn(
                "mt-2 text-xs sm:text-sm font-medium text-center transition-colors duration-300 whitespace-nowrap",
                {
                  'text-brand-warm-orange': timelineStep.status === 'active',
                  'text-gray-400': timelineStep.status === 'pending',
                  'text-green-600': timelineStep.status === 'completed'
                }
              )}
            >
              {timelineStep.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
