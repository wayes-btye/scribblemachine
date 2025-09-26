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
    isLoading,
    completeGeneration,
    completeEditing,
    startEditing,
    reset
  } = workspaceState

  // Show mode explanation when no mode is selected
  if (!mode) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">✨</div>
            <h3 className="text-lg font-medium">Two Ways to Create</h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-600">
              <div className="p-4 bg-gray-50 rounded-lg">
                <strong>Upload Photo:</strong> Turn your photos into beautiful coloring pages
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <strong>Imagine Idea:</strong> Describe what you want and let AI create it
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Input step - Show context based on mode */}
      {step === 'input' && mode === 'upload' && data.uploadedImage && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Original Image</h2>
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={data.uploadedImage.url}
              alt="Uploaded image"
              className="w-full h-full object-contain"
              data-testid="uploaded-image-preview"
            />
          </div>
        </Card>
      )}

      {step === 'input' && mode === 'prompt' && data.textPrompt && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Idea</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 italic">"{data.textPrompt}"</p>
          </div>
        </Card>
      )}

      {/* Generating step - Show progress with context preservation */}
      {(step === 'generating' || step === 'editing') && data.currentJob && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
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
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Coloring Page</h2>
          <ResultPreview
            job={data.currentJob}
            onReset={reset}
            onEditJobCreated={(editJob) => {
              startEditing(editJob)
            }}
          />
        </Card>
      )}

      {/* Empty state for input step */}
      {step === 'input' && !data.uploadedImage && !data.textPrompt && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">
              {mode === 'upload' ? '📸' : '💭'}
            </div>
            <h3 className="text-lg font-medium">
              {mode === 'upload' ? 'Upload an Image' : 'Share Your Idea'}
            </h3>
            <p className="text-gray-600 text-sm">
              {mode === 'upload'
                ? 'Your original image will appear here once uploaded'
                : 'Your creative prompt will appear here once entered'
              }
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}