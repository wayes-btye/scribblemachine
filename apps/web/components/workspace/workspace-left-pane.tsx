'use client'

import { Card } from '@/components/ui/card'
import { FileUploader } from '@/components/workspace/file-uploader'
import { ParameterForm } from '@/components/workspace/parameter-form'
import { TextPromptForm } from '@/components/workspace/text-prompt-form'
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
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🎨</div>
            <h2 className="text-xl font-semibold">Get Started</h2>
            <p className="text-gray-600">
              Choose how you'd like to create your coloring page using the toggle above
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Upload mode workflow
  if (mode === 'upload') {
    return (
      <div className="space-y-6">
        {/* Step 1: Upload */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload Your Image</h2>
          <FileUploader
            onUploadComplete={(assetId: string, imageUrl: string) => {
              setUploadedImage(assetId, imageUrl)
            }}
            disabled={isLoading}
          />
        </Card>

        {/* Step 2: Parameters (only show after upload) */}
        {data.uploadedImage && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Choose Your Style</h2>
            <ParameterForm
              assetId={data.uploadedImage.assetId}
              onGenerationStart={(job) => {
                startGeneration(job)
              }}
              disabled={isLoading}
            />
          </Card>
        )}
      </div>
    )
  }

  // Prompt mode workflow
  if (mode === 'prompt') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">1. Describe Your Idea</h2>
          <TextPromptForm
            onGenerationStart={(job, prompt) => {
              setTextPrompt(prompt)
              startGeneration(job)
            }}
            disabled={isLoading}
          />
        </Card>
      </div>
    )
  }

  return null
}