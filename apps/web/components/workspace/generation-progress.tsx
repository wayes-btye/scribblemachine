'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import type { Job } from '@coloringpage/types'

interface GenerationProgressProps {
  job: Job
  onComplete: (job: Job) => void
}

const statusConfig = {
  queued: {
    label: 'Queued',
    description: 'Your request is in the queue...',
    icon: Clock,
    color: 'bg-yellow-500',
    progress: 10
  },
  running: {
    label: 'Processing',
    description: 'Creating your coloring page...',
    icon: Loader2,
    color: 'bg-blue-500',
    progress: 60
  },
  succeeded: {
    label: 'Complete',
    description: 'Your coloring page is ready!',
    icon: CheckCircle,
    color: 'bg-green-500',
    progress: 100
  },
  failed: {
    label: 'Failed',
    description: 'Something went wrong. Please try again.',
    icon: XCircle,
    color: 'bg-red-500',
    progress: 0
  }
}

export function GenerationProgress({ job: initialJob, onComplete }: GenerationProgressProps) {
  const [job, setJob] = useState(initialJob)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Log when component receives a job
  console.log('🔄 GENERATION PROGRESS COMPONENT INITIALIZED:')
  console.log('  Job ID:', initialJob?.id)
  console.log('  Job status:', initialJob?.status)
  console.log('  Is edit job:', !!initialJob?.params_json?.edit_parent_id)
  console.log('  Edit prompt:', initialJob?.params_json?.edit_prompt)

  // Early return if job is invalid
  if (!job || !job.id) {
    console.log('❌ GENERATION PROGRESS: Invalid job data received')
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid job data received. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  // Poll for job status updates
  useEffect(() => {
    console.log('📊 POLLING USEEFFECT TRIGGERED:')
    console.log('  Job ID:', job.id)
    console.log('  Job status:', job.status)
    console.log('  Is edit job:', !!job.params_json?.edit_parent_id)

    if (!job.id || job.status === 'succeeded' || job.status === 'failed') {
      console.log('  🛑 SKIPPING POLLING:', job.status === 'succeeded' ? 'Job completed' : job.status === 'failed' ? 'Job failed' : 'No job ID')
      if (job.status === 'succeeded' || job.status === 'failed') {
        console.log('  📞 Calling onComplete callback')
        onComplete(job)
      }
      return
    }

    console.log('  ⏳ STARTING POLLING for job:', job.id)

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}`)
        if (response.ok) {
          const updatedJob: Job = await response.json()
          console.log('📥 JOB UPDATE RECEIVED:')
          console.log('  Job ID:', updatedJob.id)
          console.log('  Status:', updatedJob.status)
          console.log('  Is edit job:', !!updatedJob.params_json?.edit_parent_id)
          console.log('  Edit prompt:', updatedJob.params_json?.edit_prompt)
          console.log('  Download URLs:', updatedJob.download_urls)
          console.log('  Has edge_map URL:', !!updatedJob.download_urls?.edge_map)

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
  }, [job.id, job.status, onComplete])

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

  const config = statusConfig[job.status] || statusConfig.queued
  const Icon = config.icon
  const formattedTime = Math.floor(elapsedTime / 1000)

  return (
    <div className="space-y-4" data-testid="generation-progress">
      {/* Status Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${config.color} text-white`}>
          <Icon className={`h-4 w-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium" data-testid="job-status">
              {config.label}
            </h3>
            <Badge variant="outline" className="text-xs">
              {formattedTime}s
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={config.progress}
          className="w-full h-2"
          data-testid="progress-bar"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span>{config.progress}%</span>
        </div>
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
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your coloring page has been generated successfully! Processing took {formattedTime} seconds.
          </AlertDescription>
        </Alert>
      )}

      {/* Time Estimates */}
      {(job.status === 'queued' || job.status === 'running') && (
        <div className="text-xs text-gray-500 text-center">
          <p>Typical processing time: 6-12 seconds</p>
          {formattedTime > 15 && (
            <p className="text-yellow-600 mt-1">
              Taking longer than usual - please wait...
            </p>
          )}
        </div>
      )}
    </div>
  )
}