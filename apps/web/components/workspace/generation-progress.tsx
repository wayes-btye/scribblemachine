'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { LottieLoader } from '@/components/ui/lottie-loader'
import type { Job } from '@coloringpage/types'

interface GenerationProgressProps {
  job: Job
  onComplete: (job: Job) => void
}

const statusConfig = {
  queued: {
    label: 'Getting Ready',
    description: 'Your magical coloring page is next in line...',
    icon: Clock,
    color: 'bg-yellow-500',
    progress: 10,
    theme: 'generation' as const,
    playfulMessage: "We're gathering our digital crayons and getting ready to create something amazing!"
  },
  running: {
    label: 'Creating Magic',
    description: 'Our AI artist is hard at work creating your coloring page...',
    icon: Loader2,
    color: 'bg-brand-warm-blue',
    progress: 60,
    theme: 'generation' as const,
    playfulMessage: "✨ Sprinkling some creativity dust and drawing the perfect lines just for you!"
  },
  succeeded: {
    label: 'Ta-da! It\'s Ready!',
    description: 'Your beautiful coloring page is complete!',
    icon: CheckCircle,
    color: 'bg-green-500',
    progress: 100,
    theme: 'success' as const,
    playfulMessage: "🎉 Your masterpiece awaits! Time to bring it to life with colors!"
  },
  failed: {
    label: 'Oops!',
    description: 'Our AI artist needs to try again. Let\'s give it another shot!',
    icon: XCircle,
    color: 'bg-red-500',
    progress: 0,
    theme: 'generation' as const,
    playfulMessage: "Sometimes even the best artists need a second try. Let's create something wonderful together!"
  }
}

export function GenerationProgress({ job: initialJob, onComplete }: GenerationProgressProps) {
  const [job, setJob] = useState(initialJob)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Poll for job status updates
  useEffect(() => {
    if (!job.id || job.status === 'succeeded' || job.status === 'failed') {
      if (job.status === 'succeeded' || job.status === 'failed') {
        onComplete(job)
      }
      return
    }

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`)
        if (response.ok) {
          const updatedJob: Job = await response.json()

          // Only log when status changes to avoid flooding logs
          if (updatedJob.status !== job.status) {
            console.log('📥 JOB STATUS CHANGED:')
            console.log('  Job ID:', updatedJob.id)
            console.log('  Status:', updatedJob.status)
            console.log('  Is edit job:', !!updatedJob.params_json?.edit_parent_id)
            console.log('  Edit prompt:', updatedJob.params_json?.edit_prompt)
            console.log('  Download URLs:', updatedJob.download_urls)
            console.log('  Has edge_map URL:', !!updatedJob.download_urls?.edge_map)
          }

          setJob(updatedJob)

          if (updatedJob.status === 'succeeded' || updatedJob.status === 'failed') {
            console.log('  🎯 JOB COMPLETED:', updatedJob.status, '- calling onComplete')
            onComplete(updatedJob)
          }
        } else {
          console.log('❌ Failed to fetch job update, status:', response.status)
        }
      } catch (error) {
        console.error('Failed to poll job status:', error)
      }
    }

    // Start polling immediately instead of waiting for interval
    console.log('  🚀 Starting immediate first poll...')
    pollJob() // Immediate first poll

    // Poll every 2 seconds
    console.log('  ⏰ Setting up 2-second polling interval')
    const interval = setInterval(pollJob, 2000)

    return () => {
      console.log('  🛑 Cleaning up polling interval for job:', job.id)
      clearInterval(interval)
    }
  }, [job.id, job.status, onComplete, job])

  // Update elapsed time
  useEffect(() => {
    if (!job.id || job.status === 'succeeded' || job.status === 'failed') {
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, job.status, job.id])

  // Early return if job is invalid
  if (!job || !job.id) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid job data received. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const config = statusConfig[job.status] || statusConfig.queued
  const Icon = config.icon
  const formattedTime = Math.floor(elapsedTime / 1000)

  return (
    <div className="space-y-6" data-testid="generation-progress">
      {/* Enhanced Lottie Animation Loading */}
      <div className="text-center">
        <LottieLoader
          theme={config.theme}
          progress={config.progress}
          message={config.playfulMessage}
          size="lg"
          showProgress={true}
          className="mb-4"
        />

        {/* Status Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`p-2 rounded-full ${config.color} text-white`}>
            <Icon className={`h-4 w-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-lg" data-testid="job-status">
              {config.label}
            </h3>
            <Badge variant="outline" className="text-xs">
              {formattedTime}s
            </Badge>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{config.description}</p>
      </div>

      {/* Job Details */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-600">Job ID:</span>
            <br />
            <span className="font-mono text-xs">{job.id?.slice(0, 8) || 'Unknown'}...</span>
          </div>
          <div>
            <span className="text-gray-600">Parameters:</span>
            <br />
            <span className="capitalize">
              {job.params_json?.complexity || 'Unknown'} • {job.params_json?.line_thickness || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {job.status === 'failed' && job.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {job.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {job.status === 'succeeded' && (
        <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            🎉 Hooray! Your amazing coloring page is ready to color! It took our AI artist just {formattedTime} seconds to create this masterpiece for you.
          </AlertDescription>
        </Alert>
      )}

      {/* Family-Friendly Time Estimates */}
      {(job.status === 'queued' || job.status === 'running') && (
        <div className="text-sm text-gray-500 text-center bg-gradient-to-r from-brand-soft-blue/5 to-brand-soft-pink/5 p-3 rounded-lg">
          <p className="font-medium">⏰ Creating something special usually takes 6-12 seconds</p>
          {formattedTime > 15 && (
            <p className="text-brand-warm-orange mt-2 font-medium">
              🎨 Our artist is adding extra details - almost there!
            </p>
          )}
          {formattedTime > 30 && (
            <p className="text-brand-warm-blue mt-1">
              ✨ This is going to be extra amazing - worth the wait!
            </p>
          )}
        </div>
      )}
    </div>
  )
}