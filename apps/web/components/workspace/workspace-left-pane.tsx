'use client'

import { Card } from '@/components/ui/card'
import { FileUploader } from '@/components/workspace/file-uploader'
import { ParameterForm } from '@/components/workspace/parameter-form'
import { TextPromptForm } from '@/components/workspace/text-prompt-form'
import { GenerationProgress } from '@/components/workspace/generation-progress'
import { useWorkspaceState } from '@/hooks/use-workspace-state'

type UseWorkspaceStateReturn = ReturnType<typeof useWorkspaceState>

interface WorkspaceLeftPaneProps {
  workspaceState: UseWorkspaceStateReturn
}

export function WorkspaceLeftPane({ workspaceState }: WorkspaceLeftPaneProps) {
  const {
    mode,
    step,
    data,
    isLoading,
    setUploadedImage,
    setTextPrompt,
    startGeneration
  } = workspaceState

  // Show mode selection if no mode is selected
  if (!mode) {
    return null // Mode toggle handles this state
  }

  // Upload mode workflow
  if (mode === 'upload') {
    // CRITICAL: Hide input form when viewing result or editing - single focus principle
    if (step === 'result' || step === 'editing') {
      return null
    }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Step 1: Upload - Single Focus */}
        {!data.uploadedImage && (
          <div className="transition-all duration-300 ease-out">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-1">Upload Your Image</h3>
              <p className="text-sm text-gray-600">Choose a photo to transform into a coloring page</p>
            </div>
            <FileUploader
              onUploadComplete={(assetId: string, imageUrl: string) => {
                setUploadedImage(assetId, imageUrl)
              }}
              disabled={isLoading}
            />
            {/* Best practices hint */}
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p>✓ Clear, high-contrast images work best</p>
              <p>✓ Simple backgrounds are ideal</p>
            </div>
          </div>
        )}

        {/* Step 2: Parameters (only show after upload) - Single Focus */}
        {data.uploadedImage && step === 'input' && (
          <div className="space-y-4">
            {/* Compact Success Indicator */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs font-semibold">✓</span>
                </div>
                <p className="text-sm text-green-800">Image uploaded</p>
              </div>
              <button
                onClick={() => setUploadedImage('', '')}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Change
              </button>
            </div>

            {/* Section Heading */}
            <div className="text-center pt-2">
              <h3 className="text-lg font-semibold mb-1">Choose Your Style</h3>
              <p className="text-sm text-gray-600">Select complexity and line thickness</p>
            </div>

            {/* Parameter Form - Now the main focus */}
            <ParameterForm
              assetId={data.uploadedImage.assetId}
              onGenerationStart={(job) => {
                startGeneration(job)
              }}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    )
  }

  // Prompt mode workflow
  if (mode === 'prompt') {
    // CRITICAL: Hide input form when viewing result or editing - single focus principle
    if (step === 'result' || step === 'editing') {
      return null
    }

    // Show loading in-place during generation
    if (step === 'generating' && data.currentJob) {
      return (
        <div className="max-w-2xl mx-auto">
          <GenerationProgress
            job={data.currentJob}
            onComplete={(completedJob) => {
              workspaceState.completeGeneration(completedJob)
            }}
          />
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Text Prompt - Single Focus */}
        <TextPromptForm
          onGenerationStart={(job, prompt) => {
            setTextPrompt(prompt)
            startGeneration(job)
          }}
          disabled={isLoading}
        />
      </div>
    )
  }

  return null
}