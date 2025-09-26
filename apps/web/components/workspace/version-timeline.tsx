'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Upload, Sparkles, Wand2, AlertCircle } from 'lucide-react'

interface JobVersion {
  id: string
  status: string
  params_json: any
  cost_cents: number | null
  model: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
  download_urls?: {
    edge_map?: string
    pdf?: string
  }
  version_type: 'original' | 'edit'
  edit_prompt?: string
  version_order: number
}

interface VersionsResponse {
  total_versions: number
  original_job_id: string
  requested_job_id: string
  versions: JobVersion[]
  metadata: {
    has_edits: boolean
    edit_count: number
    max_edits: number
  }
}

interface VersionTimelineProps {
  jobId: string
  onVersionSelect?: (version: JobVersion) => void
  currentJobId?: string
}

export function VersionTimeline({ jobId, onVersionSelect, currentJobId }: VersionTimelineProps) {
  const [versions, setVersions] = useState<JobVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  // Load versions when component mounts
  useEffect(() => {
    const loadVersions = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/jobs/${jobId}/versions`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load versions')
        }

        const data: VersionsResponse = await response.json()

        if (data.versions && data.versions.length > 0) {
          setVersions(data.versions)

          // Set initial version based on currentJobId if provided
          if (currentJobId) {
            const currentIndex = data.versions.findIndex(v => v.id === currentJobId)
            if (currentIndex >= 0) {
              setCurrentVersionIndex(currentIndex)
            }
          }
        } else {
          throw new Error('No versions found')
        }

      } catch (error) {
        console.error('Failed to load versions:', error)
        setError(error instanceof Error ? error.message : 'Failed to load versions')
      } finally {
        setLoading(false)
      }
    }

    loadVersions()
  }, [jobId, currentJobId])

  // Update parent component when version changes
  useEffect(() => {
    if (versions.length > 0 && onVersionSelect) {
      onVersionSelect(versions[currentVersionIndex])
    }
  }, [currentVersionIndex, versions, onVersionSelect])

  const handleVersionSelect = (index: number) => {
    if (index >= 0 && index < versions.length) {
      setCurrentVersionIndex(index)
    }
  }

  const handleImageError = (versionId: string) => {
    setImageError(prev => ({ ...prev, [versionId]: true }))
  }

  const getVersionIcon = (version: JobVersion, index: number) => {
    if (index === 0) {
      return <Upload className="h-4 w-4" />
    } else if (version.version_type === 'edit') {
      return <Wand2 className="h-4 w-4" />
    } else {
      return <Sparkles className="h-4 w-4" />
    }
  }

  const getVersionLabel = (version: JobVersion, index: number) => {
    if (index === 0) {
      return 'Original'
    } else if (version.version_type === 'edit') {
      return `Edit ${version.version_order}`
    } else {
      return 'Generated'
    }
  }

  const currentVersion = versions[currentVersionIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-warm-orange mr-2" />
        <span className="text-gray-600">Loading timeline...</span>
      </div>
    )
  }

  if (error || !versions.length) {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'No version history available.'}
        </AlertDescription>
      </Alert>
    )
  }

  // Don't show timeline if only one version
  if (versions.length === 1) {
    return null
  }

  return (
    <div className="space-y-6" data-testid="version-timeline">
      {/* Timeline Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-warm-orange" />
        <h4 className="font-medium">Version Timeline</h4>
        <Badge variant="secondary" className="text-xs">
          {versions.length} version{versions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-200 z-0" />

        {/* Timeline Steps */}
        <div className="flex justify-between items-start relative z-10">
          {versions.map((version, index) => (
            <div key={version.id} className="flex flex-col items-center">
              {/* Timeline Node */}
              <button
                onClick={() => handleVersionSelect(index)}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-200 ${
                  index === currentVersionIndex
                    ? 'bg-brand-warm-orange border-brand-warm-orange text-white shadow-lg transform scale-110'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-brand-warm-orange/50 hover:text-brand-warm-orange'
                }`}
                title={getVersionLabel(version, index)}
              >
                {getVersionIcon(version, index)}
              </button>

              {/* Version Label */}
              <div className="mt-2 text-center">
                <div className={`text-sm font-medium ${
                  index === currentVersionIndex ? 'text-brand-warm-orange' : 'text-gray-600'
                }`}>
                  {getVersionLabel(version, index)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(version.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVersionSelect(currentVersionIndex - 1)}
          disabled={currentVersionIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-center">
          <div className="font-medium text-sm">
            {getVersionLabel(currentVersion, currentVersionIndex)}
          </div>
          <div className="text-xs text-gray-500">
            {currentVersionIndex + 1} of {versions.length}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVersionSelect(currentVersionIndex + 1)}
          disabled={currentVersionIndex === versions.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Version Display */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Version Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-warm-orange/10 rounded-full flex items-center justify-center">
                {getVersionIcon(currentVersion, currentVersionIndex)}
              </div>
              <div>
                <h5 className="font-medium">{getVersionLabel(currentVersion, currentVersionIndex)}</h5>
                <p className="text-sm text-gray-600">
                  Created {new Date(currentVersion.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {currentVersion.version_type === 'edit' && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Wand2 className="h-3 w-3 mr-1" />
                Edited
              </Badge>
            )}
          </div>

          {/* Edit Prompt */}
          {currentVersion.version_type === 'edit' && currentVersion.edit_prompt && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-700 font-medium text-sm">Edit Request:</span>
              <p className="text-blue-800 text-sm mt-1">"{currentVersion.edit_prompt}"</p>
            </div>
          )}
        </div>

        {/* Version Image */}
        <div className="p-4">
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
            {imageError[currentVersion.id] || !currentVersion.download_urls?.edge_map ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Image preview unavailable</p>
                  <p className="text-xs">You can still download the file</p>
                </div>
              </div>
            ) : (
              <img
                src={currentVersion.download_urls.edge_map}
                alt={`${getVersionLabel(currentVersion, currentVersionIndex)} coloring page`}
                className="w-full h-full object-contain"
                onError={() => handleImageError(currentVersion.id)}
                data-testid={`timeline-image-${currentVersionIndex}`}
              />
            )}
          </div>
        </div>

        {/* Version Metadata */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Processing Time:</span>
              <br />
              <span className="font-medium">
                {currentVersion.started_at && currentVersion.ended_at
                  ? `${Math.round((new Date(currentVersion.ended_at).getTime() - new Date(currentVersion.started_at).getTime()) / 1000)}s`
                  : 'N/A'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <br />
              <Badge
                variant={currentVersion.status === 'completed' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {currentVersion.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Progress Indicator */}
      <div className="text-center text-sm text-gray-600">
        <p>Navigate through your coloring page evolution</p>
        <p className="text-xs text-gray-400 mt-1">
          Each step shows how your image was transformed
        </p>
      </div>
    </div>
  )
}