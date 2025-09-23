'use client'

import { useState } from 'react'
import { TextPromptForm } from '@/components/workspace/text-prompt-form'
import { GenerationProgress } from '@/components/workspace/generation-progress'
import { ResultPreview } from '@/components/workspace/result-preview'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth/auth-provider'
import { redirect } from 'next/navigation'
import type { Job } from '@coloringpage/types'

export default function ImaginePage() {
  const { user } = useAuth()
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [textPrompt, setTextPrompt] = useState<string>('')

  // Redirect to home if not authenticated
  if (!user) {
    redirect('/')
  }

  const handleGenerationStart = (job: Job, prompt: string) => {
    setCurrentJob(job)
    setTextPrompt(prompt)
    setIsGenerating(true)
  }

  const handleGenerationComplete = (job: Job) => {
    setCurrentJob(job)
    setIsGenerating(false)
  }

  const handleReset = () => {
    setCurrentJob(null)
    setTextPrompt('')
    setIsGenerating(false)
  }

  const handleEditJobCreated = (editJob: Job) => {
    // Switch to tracking the edit job instead of the original
    setCurrentJob(editJob)
    setIsGenerating(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Imagine Your{' '}
              <span className="text-transparent bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange bg-clip-text">
                Coloring Page
              </span>
            </h1>
            <p className="text-gray-600">Describe your idea and watch the magic happen!</p>
          </div>

          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Text Input and Parameters */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">1. Describe Your Idea</h2>
                <TextPromptForm
                  onGenerationStart={handleGenerationStart}
                  disabled={isGenerating}
                />
              </Card>
            </div>

            {/* Right Column - Preview and Results */}
            <div className="space-y-6">
              {textPrompt && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Idea</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">"{textPrompt}"</p>
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