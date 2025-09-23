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
    console.log('✅ GENERATION COMPLETE HANDLER:')
    console.log('  Completed job ID:', job.id)
    console.log('  Job status:', job.status)
    console.log('  Is edit job:', !!job.params_json?.edit_parent_id)
    console.log('  Edit prompt:', job.params_json?.edit_prompt)
    console.log('  Setting isGenerating=false to show ResultPreview')

    setCurrentJob(job)
    setIsGenerating(false)
  }

  const handleReset = () => {
    setUploadedAssetId(null)
    setUploadedImageUrl(null)
    setCurrentJob(null)
    setIsGenerating(false)
  }

  const handleEditJobCreated = (editJob: Job) => {
    // Switch to tracking the edit job instead of the original
    console.log('🔄 EDIT JOB CREATED - Switching job tracking:')
    console.log('  Previous job ID:', currentJob?.id)
    console.log('  Previous job status:', currentJob?.status)
    console.log('  NEW edit job ID:', editJob.id)
    console.log('  Edit job status:', editJob.status)
    console.log('  Edit prompt:', editJob.params_json?.edit_prompt)
    console.log('  Edit parent ID:', editJob.params_json?.edit_parent_id)

    setCurrentJob(editJob)
    setIsGenerating(true)

    console.log('  ✅ State updated: currentJob set to edit job, isGenerating=true')
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

              {/* Show GenerationProgress when actively generating */}
              {currentJob && isGenerating && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {currentJob.params_json?.edit_parent_id ? 'Edit Progress' : 'Generation Progress'}
                  </h2>
                  <GenerationProgress
                    job={currentJob}
                    onComplete={handleGenerationComplete}
                  />
                </Card>
              )}

              {/* Show ResultPreview only when not actively generating and job is complete */}
              {currentJob?.status === 'succeeded' && !isGenerating && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Coloring Page</h2>
                  <ResultPreview
                    job={currentJob}
                    onReset={handleReset}
                    onEditJobCreated={handleEditJobCreated}
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