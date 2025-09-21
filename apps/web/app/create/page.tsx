'use client'

import { useState } from 'react'
import { FileUploader } from '@/components/workspace/file-uploader'
import { ParameterForm } from '@/components/workspace/parameter-form'
import { GenerationProgress } from '@/components/workspace/generation-progress'
import { ResultPreview } from '@/components/workspace/result-preview'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-provider'
import { redirect } from 'next/navigation'
import type { Job } from '@coloringpage/types'

export default function CreatePage() {
  const { user } = useAuth()
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/')
  }

  const handleUploadComplete = (assetId: string, imageUrl: string) => {
    setUploadedAssetId(assetId)
    setUploadedImageUrl(imageUrl)
  }

  const handleGenerationStart = (job: Job) => {
    setCurrentJob(job)
    setIsGenerating(true)
  }

  const handleGenerationComplete = (job: Job) => {
    setCurrentJob(job)
    setIsGenerating(false)
  }

  const handleReset = () => {
    setUploadedAssetId(null)
    setUploadedImageUrl(null)
    setCurrentJob(null)
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Create Your{' '}
              <span className="text-transparent bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange bg-clip-text">
                Coloring Page
              </span>
            </h1>
            <p className="text-gray-600">Upload an image and watch the magic happen!</p>
          </div>

          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Upload and Parameters */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">1. Upload Your Image</h2>
                <FileUploader
                  onUploadComplete={handleUploadComplete}
                  disabled={isGenerating}
                />
              </Card>

              {uploadedAssetId && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">2. Choose Your Style</h2>
                  <ParameterForm
                    assetId={uploadedAssetId}
                    onGenerationStart={handleGenerationStart}
                    disabled={isGenerating}
                  />
                </Card>
              )}
            </div>

            {/* Right Column - Preview and Results */}
            <div className="space-y-6">
              {uploadedImageUrl && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Original Image</h2>
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded image"
                      className="w-full h-full object-contain"
                      data-testid="uploaded-image-preview"
                    />
                  </div>
                </Card>
              )}

              {currentJob && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Generation Progress</h2>
                  <GenerationProgress
                    job={currentJob}
                    onComplete={handleGenerationComplete}
                  />
                </Card>
              )}

              {currentJob?.status === 'succeeded' && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Coloring Page</h2>
                  <ResultPreview
                    job={currentJob}
                    onReset={handleReset}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}