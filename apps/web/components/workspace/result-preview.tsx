'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileImage, FileText, RotateCcw, Share2, Printer, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Job } from '@coloringpage/types'
import { EditInterface } from './edit-interface'
import { VersionComparison } from './version-comparison'

// Extended job type that includes download URLs from API
interface JobWithDownloads extends Job {
  download_urls?: {
    edge_map?: string
    pdf?: string
    [key: string]: string | undefined
  }
}

interface ResultPreviewProps {
  job: JobWithDownloads
  onReset: () => void
  onEditJobCreated?: (editJob: Job) => void
}

export function ResultPreview({ job, onReset, onEditJobCreated }: ResultPreviewProps) {
  const [downloading, setDownloading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [currentDisplayJob, setCurrentDisplayJob] = useState<JobWithDownloads>(job)
  const [originalJob] = useState<JobWithDownloads>(job) // Keep reference to original job for restoration

  // Check if this is an edited job
  const isEditedJob = currentDisplayJob.params_json?.edit_parent_id || currentDisplayJob.params_json?.edit_prompt

  // Check if there are multiple versions available for comparison
  const hasMultipleVersions = isEditedJob || job.params_json?.edit_parent_id

  // Get the download URL from current display job data with fallback strategy
  const getDownloadUrl = () => {
    // Priority order: current display job URL -> original job URL -> API fallback
    return (
      currentDisplayJob.download_urls?.edge_map ||
      originalJob.download_urls?.edge_map ||
      `/api/jobs/${currentDisplayJob.id}/download`
    )
  }

  const getImagePreviewUrl = () => {
    // Priority order with multiple fallbacks
    return (
      currentDisplayJob.download_urls?.edge_map ||
      originalJob.download_urls?.edge_map ||
      null
    )
  }

  const handleDownloadImage = async () => {
    try {
      setDownloading(true)

      const downloadUrl = getDownloadUrl()
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        throw new Error('Failed to download image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `coloring-page-${currentDisplayJob.id.slice(0, 8)}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Download started',
        description: 'Your coloring page is being downloaded.'
      })

    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download failed',
        description: 'Please try again or contact support.',
        variant: 'destructive'
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(true)

      const response = await fetch('/api/pdf/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_id: currentDisplayJob.id,
          paper_size: 'A4',
          title: `Coloring Page - ${new Date().toLocaleDateString()}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to export PDF')
      }

      const { pdfUrl } = await response.json()

      // Open PDF in new tab/window to preserve current page
      window.open(pdfUrl, '_blank')

      toast({
        title: 'PDF exported',
        description: 'Your printable PDF is ready!'
      })

    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'PDF export failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleVersionSelect = useCallback((version: any) => {
    console.log('[DEBUG] Version selected:', {
      versionId: version.id,
      versionType: version.version_type,
      hasDownloadUrls: !!version.download_urls,
      hasEdgeMap: !!version.download_urls?.edge_map,
      edgeMapUrl: version.download_urls?.edge_map ? `${version.download_urls.edge_map.substring(0, 50)}...` : null
    })

    // Validate version object structure
    if (!version || !version.id) {
      console.error('[ERROR] Invalid version object provided to handleVersionSelect:', version)
      toast({
        title: 'Version selection failed',
        description: 'Invalid version data received.',
        variant: 'destructive'
      })
      return
    }

    // Update the current display job when a version is selected
    const updatedJob = {
      ...version,
      download_urls: version.download_urls || {}
    }

    console.log('[DEBUG] Setting currentDisplayJob to:', {
      id: updatedJob.id,
      hasDownloadUrls: !!updatedJob.download_urls,
      hasEdgeMap: !!updatedJob.download_urls?.edge_map
    })

    setCurrentDisplayJob(updatedJob)
    setImageError(false) // Reset image error when switching versions
  }, [])

  // Add function to restore original state when hiding versions
  const handleHideVersions = useCallback(() => {
    console.log('[DEBUG] Hiding versions, restoring original job state')
    setShowComparison(false)
    setCurrentDisplayJob(originalJob)
    setImageError(false)
  }, [originalJob])

  return (
    <div className="space-y-6" data-testid="result-preview">
      {/* Generated Image Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {isEditedJob ? "Edited Coloring Page" : "Generated Coloring Page"}
            </h3>
            {isEditedJob && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                ✨ Edited
              </Badge>
            )}
            {hasMultipleVersions && (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-gray-50"
                onClick={showComparison ? handleHideVersions : () => setShowComparison(true)}
              >
                {showComparison ? 'Hide' : 'Show'} Versions
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            ✓ Complete
          </Badge>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          {imageError || !getImagePreviewUrl() ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!getImagePreviewUrl()
                  ? "Image preview is being generated. You can download the file below."
                  : "Image preview temporarily unavailable. You can still download the file."
                }
                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs mt-2 text-gray-500">
                    Debug: Job ID: {currentDisplayJob.id.slice(0, 8)}...,
                    Has URL: {!!getImagePreviewUrl()},
                    Image Error: {imageError}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={getImagePreviewUrl()!}
                alt="Generated coloring page"
                className="w-full h-full object-contain"
                onError={() => {
                  console.log(`[DEBUG] Image load error for job ${currentDisplayJob.id}:`, {
                    url: getImagePreviewUrl(),
                    fallbackAvailable: !!originalJob.download_urls?.edge_map
                  })
                  handleImageError()
                }}
                onLoad={() => {
                  console.log(`[DEBUG] Image loaded successfully for job ${currentDisplayJob.id}`)
                }}
                data-testid="generated-image"
              />
            </div>
          )}
        </div>
      </div>

      {/* Job Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">{isEditedJob ? "Edit Details" : "Generation Details"}</h4>

        {/* Edit Prompt (if this is an edited job) */}
        {isEditedJob && currentDisplayJob.params_json?.edit_prompt && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-700 font-medium text-sm">Edit Request:</span>
            <p className="text-blue-800 text-sm mt-1">"{currentDisplayJob.params_json.edit_prompt}"</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Complexity:</span>
            <br />
            <span className="font-medium capitalize">{currentDisplayJob.params_json.complexity}</span>
          </div>
          <div>
            <span className="text-gray-600">Line Thickness:</span>
            <br />
            <span className="font-medium capitalize">{currentDisplayJob.params_json.line_thickness}</span>
          </div>
          <div>
            <span className="text-gray-600">Processing Time:</span>
            <br />
            <span className="font-medium">
              {currentDisplayJob.started_at && currentDisplayJob.ended_at
                ? `${Math.round((new Date(currentDisplayJob.ended_at).getTime() - new Date(currentDisplayJob.started_at).getTime()) / 1000)}s`
                : 'N/A'
              }
            </span>
          </div>
          <div>
            <span className="text-gray-600">Job ID:</span>
            <br />
            <span className="font-mono text-xs">{currentDisplayJob.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Version Comparison */}
      {hasMultipleVersions && showComparison && (
        <VersionComparison
          jobId={job.id}
          onVersionSelect={handleVersionSelect}
          currentJobId={currentDisplayJob.id}
        />
      )}

      {/* Edit Interface */}
      {onEditJobCreated && (
        <>
          <Separator />
          <EditInterface job={job} onEditJobCreated={onEditJobCreated} />
        </>
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-4">
        <h4 className="font-medium">Download & Share</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Download PNG */}
          <Button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="bg-brand-soft-blue hover:bg-brand-soft-blue/90 text-white"
            data-testid="download-image"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <FileImage className="mr-2 h-4 w-4" />
                Download Image
              </>
            )}
          </Button>

          {/* Export PDF */}
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            variant="outline"
            className="border-brand-warm-orange text-brand-warm-orange hover:bg-brand-warm-orange/10"
            data-testid="export-pdf"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-warm-orange mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" className="text-gray-600">
            <Share2 className="mr-2 h-3 w-3" />
            Share
          </Button>
          <Button size="sm" variant="ghost" className="text-gray-600">
            <Printer className="mr-2 h-3 w-3" />
            Print
          </Button>
        </div>
      </div>

      <Separator />

      {/* Start Over */}
      <div className="text-center">
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
          data-testid="create-another"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Create Another Coloring Page
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Printing Tips</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Print on white or light-colored paper for best results</li>
          <li>• Use high-quality print settings (300 DPI or higher)</li>
          <li>• A4 or Letter size paper works perfectly</li>
          <li>• Consider heavier paper (cardstock) for younger children</li>
        </ul>
      </div>
    </div>
  )
}