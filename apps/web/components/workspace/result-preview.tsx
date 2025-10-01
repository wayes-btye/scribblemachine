'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileImage, FileText, RotateCcw, Share2, Printer, AlertCircle, Clock, Layers, LineChart } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Job } from '@coloringpage/types'
import { EditInterface } from './edit-interface'
import { VersionTimeline } from './version-timeline'

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
  const [showTimeline, setShowTimeline] = useState(false)
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

  // Add function to restore original state when hiding timeline
  const handleHideTimeline = useCallback(() => {
    console.log('[DEBUG] Hiding timeline, restoring original job state')
    setShowTimeline(false)
    setCurrentDisplayJob(originalJob)
    setImageError(false)
  }, [originalJob])

  return (
    <div className="space-y-6" data-testid="result-preview">
      {/* Clean Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-light text-gray-900">
            {isEditedJob ? "Edited" : "Your"} Coloring Page
          </h1>
          {isEditedJob && (
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
              ✨ Edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasMultipleVersions && (
            <button
              onClick={showTimeline ? handleHideTimeline : () => setShowTimeline(true)}
              className="text-xs text-gray-600 hover:text-purple-600 transition-colors border border-gray-300 px-3 py-1 rounded-md hover:border-purple-400"
            >
              {showTimeline ? '← Back' : 'Timeline →'}
            </button>
          )}
          <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            ✓ Complete
          </span>
        </div>
      </div>

      {/* Timeline (Full Width When Visible) */}
      {hasMultipleVersions && showTimeline && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <VersionTimeline
            jobId={job.id}
            onVersionSelect={handleVersionSelect}
            currentJobId={currentDisplayJob.id}
          />
        </div>
      )}

      {!showTimeline && (
        <>
          {/* Two-Column Layout: Image Left, Edit+Actions Right */}
          <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
            {/* Left: Image */}
            <div className="flex items-start justify-center">
              <div className="w-full">
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
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-colors">
                    <img
                      src={getImagePreviewUrl()!}
                      alt="Coloring page"
                      className="w-full h-full object-contain p-4"
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

                {/* Edit Request Below Image */}
                {isEditedJob && currentDisplayJob.params_json?.edit_prompt && (
                  <div className="mt-4 border-l-2 border-purple-600 pl-3 bg-purple-50/30 py-2 rounded-r">
                    <div className="text-xs uppercase tracking-wider text-purple-600 mb-1">Edit Request</div>
                    <p className="text-sm text-gray-900">"{currentDisplayJob.params_json.edit_prompt}"</p>
                  </div>
                )}

                {/* Details */}
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Complexity:</span>
                    <span className="font-medium">{currentDisplayJob.params_json.complexity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LineChart className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Line:</span>
                    <span className="font-medium">{currentDisplayJob.params_json.line_thickness}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">
                      {currentDisplayJob.started_at && currentDisplayJob.ended_at
                        ? `${Math.round((new Date(currentDisplayJob.ended_at).getTime() - new Date(currentDisplayJob.started_at).getTime()) / 1000)}s`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Edit Interface + Actions (PROMINENT) */}
            <div className="flex flex-col gap-6">
              {/* Edit Interface - Highlighted */}
              {onEditJobCreated && (
                <div className="bg-white rounded-lg border-2 border-orange-300 p-6 shadow-sm">
                  <div className="mb-4 text-center">
                    <h3 className="text-sm font-medium text-orange-600 mb-1">✨ Edit This Page</h3>
                    <p className="text-xs text-gray-500">Make changes to your coloring page</p>
                  </div>
                  <EditInterface job={job} onEditJobCreated={onEditJobCreated} />
                </div>
              )}

              <Separator />

              {/* Download Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
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
                      Download PNG
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 h-11"
                  data-testid="export-pdf"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-700 mr-2" />
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

              {/* Secondary Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-purple-600 hover:bg-purple-50">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-500 hover:text-purple-600 hover:bg-purple-50">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                  onClick={onReset}
                  data-testid="create-another"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Tip */}
              <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded p-3">
                <strong className="text-amber-800">💡 Tip:</strong> Print at 300 DPI for best results. A4/Letter recommended.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}