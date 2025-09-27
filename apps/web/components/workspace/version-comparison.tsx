'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

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

interface VersionComparisonProps {
  jobId: string
  onVersionSelect?: (version: JobVersion) => void
  currentJobId?: string // The currently displayed job ID
}

export function VersionComparison({ jobId, onVersionSelect, currentJobId }: VersionComparisonProps) {
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

  const handlePrevious = () => {
    if (currentVersionIndex > 0) {
      setCurrentVersionIndex(currentVersionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentVersionIndex < versions.length - 1) {
      setCurrentVersionIndex(currentVersionIndex + 1)
    }
  }

  const handleVersionSelect = (index: number) => {
    if (index >= 0 && index < versions.length) {
      setCurrentVersionIndex(index)
    }
  }

  const handleImageError = (versionId: string) => {
    setImageError(prev => ({ ...prev, [versionId]: true }))
  }

  const currentVersion = versions[currentVersionIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-warm-orange mr-2" />
        <span className="text-gray-600">Loading versions...</span>
      </div>
    )
  }

  if (error || !versions.length) {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'No versions available for comparison.'}
        </AlertDescription>
      </Alert>
    )
  }

  // Don't show comparison interface if only one version
  if (versions.length === 1) {
    return null
  }

  return (
    <div className="space-y-4" data-testid="version-comparison">
      <Separator />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-brand-warm-orange" />
          <h4 className="font-medium">Version History</h4>
        </div>
        <Badge variant="secondary" className="text-xs">
          {versions.length} version{versions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Version Navigator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentVersionIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {currentVersion.version_type === 'original' ? 'Original' : `Edit ${currentVersion.version_order}`}
            </span>
            {currentVersion.version_type === 'edit' && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Edited
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentVersionIndex === versions.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Version Dots */}
        <div className="flex justify-center gap-1 mb-4">
          {versions.map((version, index) => (
            <button
              key={version.id}
              onClick={() => handleVersionSelect(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentVersionIndex
                  ? 'bg-brand-warm-orange'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={version.version_type === 'original' ? 'Original' : `Edit ${version.version_order}`}
            />
          ))}
        </div>

        {/* Current Version Image */}
        <div className="aspect-square bg-white rounded-lg overflow-hidden border">
          {imageError[currentVersion.id] || !currentVersion.download_urls?.edge_map ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Image preview unavailable</p>
                <p className="text-xs">You can still download the file</p>
              </div>
            </div>
          ) : (
            <img
              src={currentVersion.download_urls.edge_map}
              alt={`Version ${currentVersion.version_order} coloring page`}
              className="w-full h-full object-contain"
              onError={() => handleImageError(currentVersion.id)}
              data-testid={`version-image-${currentVersion.version_order}`}
            />
          )}
        </div>

        {/* Version Details */}
        <div className="mt-4 space-y-2">
          {/* Edit Prompt (if this is an edited version) */}
          {currentVersion.version_type === 'edit' && currentVersion.edit_prompt && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-700 font-medium text-sm">Edit Request:</span>
              <p className="text-blue-800 text-sm mt-1">"{currentVersion.edit_prompt}"</p>
            </div>
          )}

          {/* Version Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Created:</span>
              <br />
              {new Date(currentVersion.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Processing:</span>
              <br />
              {currentVersion.started_at && currentVersion.ended_at
                ? `${Math.round((new Date(currentVersion.ended_at).getTime() - new Date(currentVersion.started_at).getTime()) / 1000)}s`
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2">
        {versions.map((version, index) => (
          <Button
            key={version.id}
            variant={index === currentVersionIndex ? "default" : "outline"}
            size="sm"
            onClick={() => handleVersionSelect(index)}
            className={index === currentVersionIndex ? "bg-brand-warm-orange hover:bg-brand-warm-orange/90" : ""}
          >
            {version.version_type === 'original' ? 'Original' : `Edit ${version.version_order}`}
          </Button>
        ))}
      </div>

      {/* Helper Text */}
      <div className="text-center text-sm text-gray-600">
        Use the arrows or buttons above to compare different versions of your coloring page
      </div>
    </div>
  )
}