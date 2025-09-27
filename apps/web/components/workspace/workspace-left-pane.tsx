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
      <div className="space-y-4 sm:space-y-6">
        <Card className="p-4 sm:p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl sm:text-6xl">🎨</div>
            <h2 className="text-lg sm:text-xl font-semibold">Get Started</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Choose how you&apos;d like to create your coloring page using the toggle above
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Upload mode workflow
  if (mode === 'upload') {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Step 1: Upload - Hide after successful upload */}
        {!data.uploadedImage && (
          <Card className="p-4 sm:p-6 transition-all duration-300 ease-out">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">1. Upload Your Image</h2>
            <FileUploader
              onUploadComplete={(assetId: string, imageUrl: string) => {
                setUploadedImage(assetId, imageUrl)
              }}
              disabled={isLoading}
            />
          </Card>
        )}

        {/* Step 1 Completed - Show condensed confirmation when upload is done */}
        {data.uploadedImage && step === 'input' && (
          <Card className="p-3 sm:p-4 bg-green-50 border-green-200 transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Image uploaded successfully</p>
                  <p className="text-xs text-green-600">Ready for processing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Reset to re-upload
                  setUploadedImage('', '')
                }}
                className="text-xs text-green-600 hover:text-green-800 underline transition-colors duration-200"
              >
                Change image
              </button>
            </div>
          </Card>
        )}

        {/* Step 2: Parameters (only show after upload) */}
        {data.uploadedImage && step === 'input' && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">2. Choose Your Style</h2>
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
      <div className="space-y-4 sm:space-y-6">
        {/* Step 1: Prompt - Hide after successful submission */}
        {!data.textPrompt && (
          <Card className="p-4 sm:p-6 transition-all duration-300 ease-out">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">1. Describe Your Idea</h2>
            <TextPromptForm
              onGenerationStart={(job, prompt) => {
                setTextPrompt(prompt)
                startGeneration(job)
              }}
              disabled={isLoading}
            />
          </Card>
        )}

        {/* Step 1 Completed - Show condensed confirmation when prompt is submitted */}
        {data.textPrompt && step === 'input' && (
          <Card className="p-3 sm:p-4 bg-green-50 border-green-200 transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Idea submitted successfully</p>
                  <p className="text-xs text-green-600">&quot;{data.textPrompt}&quot;</p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Reset to re-enter prompt
                  setTextPrompt('')
                }}
                className="text-xs text-green-600 hover:text-green-800 underline transition-colors duration-200"
              >
                Change idea
              </button>
            </div>
          </Card>
        )}
      </div>
    )
  }

  return null
}