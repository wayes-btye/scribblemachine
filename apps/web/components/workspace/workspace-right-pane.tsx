'use client'

import { GenerationProgress } from '@/components/workspace/generation-progress'
import { ResultPreview } from '@/components/workspace/result-preview'
import { useWorkspaceState } from '@/hooks/use-workspace-state'

type UseWorkspaceStateReturn = ReturnType<typeof useWorkspaceState>

interface WorkspaceRightPaneProps {
  workspaceState: UseWorkspaceStateReturn
}

export function WorkspaceRightPane({ workspaceState }: WorkspaceRightPaneProps) {
  const {
    mode,
    step,
    data,
    completeGeneration,
    completeEditing,
    startEditing,
    reset
  } = workspaceState

  // Don't show anything when no mode is selected (mode toggle handles this)
  if (!mode) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Input step - Show context based on mode */}
      {/* Removed large image preview - now shown compactly in left pane success indicator */}

      {step === 'input' && mode === 'prompt' && data.textPrompt && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Idea</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 italic">&quot;{data.textPrompt}&quot;</p>
          </div>
        </div>
      )}

      {/* Generating step - Show progress with context preservation */}
      {/* For prompt mode, loading appears in left pane (in-place). For upload mode, show here with context */}
      {/* For editing, ALWAYS show in right pane regardless of mode */}
      {((step === 'generating' && mode === 'upload') || step === 'editing') && data.currentJob && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-6">
          <div className="text-center">
            <GenerationProgress
              job={data.currentJob}
              onComplete={(completedJob) => {
                if (step === 'editing') {
                  completeEditing(completedJob)
                } else {
                  completeGeneration(completedJob)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Result step - Show completed result with edit capabilities */}
      {step === 'result' && data.currentJob?.status === 'succeeded' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-4 sm:p-6">
          <ResultPreview
            job={data.currentJob}
            onReset={reset}
            onEditJobCreated={(editJob) => {
              startEditing(editJob)
            }}
            onCreditsUpdated={() => {
              // Refresh the page to update credit balance
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* Don't show placeholder - keep focus on main input */}
    </div>
  )
}