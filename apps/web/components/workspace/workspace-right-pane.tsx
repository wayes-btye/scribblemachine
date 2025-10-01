'use client'

import { Card } from '@/components/ui/card'
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
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Idea</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 italic">&quot;{data.textPrompt}&quot;</p>
          </div>
        </Card>
      )}

      {/* Generating step - Show progress with context preservation */}
      {/* For prompt mode, loading appears in left pane (in-place). For upload mode, show here with context */}
      {/* For editing, ALWAYS show in right pane regardless of mode */}
      {((step === 'generating' && mode === 'upload') || step === 'editing') && data.currentJob && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            {step === 'editing' ? 'Edit Progress' : 'Generation Progress'}
          </h2>

          {/* Show previous result dimmed during editing */}
          {step === 'editing' && data.currentJob.params_json?.edit_parent_id && (
            <div className="mb-4 relative">
              <div className="opacity-50 pointer-events-none">
                {/* This would show the previous result - we'll implement this later */}
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Previous result...</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-brand-warm-blue border-t-transparent rounded-full mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Applying changes...</span>
                </div>
              </div>
            </div>
          )}

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
        </Card>
      )}

      {/* Result step - Show completed result with edit capabilities */}
      {step === 'result' && data.currentJob?.status === 'succeeded' && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Coloring Page</h2>
          <ResultPreview
            job={data.currentJob}
            onReset={reset}
            onEditJobCreated={(editJob) => {
              startEditing(editJob)
            }}
          />
        </Card>
      )}

      {/* Don't show placeholder - keep focus on main input */}
    </div>
  )
}