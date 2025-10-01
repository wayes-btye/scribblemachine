/**
 * VARIANT: Minimal Compact
 * Clean design with Edit Interface prominently on right side
 * No scrolling - edit box is immediately obvious and accessible
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, RotateCcw, Share2, Printer, Clock, Layers, LineChart, AlertCircle } from 'lucide-react'
import { EditInterface } from '@/components/workspace/edit-interface'
import { VersionTimeline } from '@/components/workspace/version-timeline'
import { BackgroundBlobs } from '@/components/ui/background-blobs'
import type { Job } from '@coloringpage/types'

interface JobWithDownloads extends Job {
  download_urls?: {
    edge_map?: string
    pdf?: string
    [key: string]: string | undefined
  }
}

const MOCK_EDITED_JOB: JobWithDownloads = {
  id: 'mock-job-edited-001',
  user_id: 'dev-user',
  status: 'succeeded',
  params_json: {
    complexity: 'simple',
    line_thickness: 'medium',
    edit_parent_id: 'mock-job-original-001',
    edit_prompt: 'Make it more detailed with additional characters'
  },
  created_at: new Date(Date.now() - 60000).toISOString(),
  started_at: new Date(Date.now() - 50000).toISOString(),
  ended_at: new Date(Date.now() - 44000).toISOString(),
  download_urls: {
    edge_map: '/assets/peppa-and-chase-holding-hands.png',
    pdf: '/assets/peppa-and-chase-holding-hands.png'
  }
}

export default function MinimalCompactVariantPage() {
  const [job] = useState<JobWithDownloads>(MOCK_EDITED_JOB)
  const [currentDisplayJob, setCurrentDisplayJob] = useState<JobWithDownloads>(job)
  const [downloading, setDownloading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  const isEditedJob = currentDisplayJob.params_json?.edit_parent_id || currentDisplayJob.params_json?.edit_prompt
  const hasMultipleVersions = isEditedJob || job.params_json?.edit_parent_id

  const processingTime = currentDisplayJob.started_at && currentDisplayJob.ended_at
    ? `${Math.round((new Date(currentDisplayJob.ended_at).getTime() - new Date(currentDisplayJob.started_at).getTime()) / 1000)}s`
    : 'N/A'

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => setDownloading(false), 1000)
  }

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => setExporting(false), 1000)
  }

  const handleReset = () => {
    console.log('[DEV] Reset clicked')
  }

  const handleEditJobCreated = (editJob: Job) => {
    console.log('[DEV] Edit job created:', editJob)
  }

  const handleVersionSelect = useCallback((version: any) => {
    console.log('[DEBUG] Version selected:', version.id)
    const updatedJob = {
      ...version,
      download_urls: version.download_urls || {}
    }
    setCurrentDisplayJob(updatedJob)
    setImageError(false)
  }, [])

  const handleHideTimeline = useCallback(() => {
    console.log('[DEBUG] Hiding timeline')
    setShowTimeline(false)
    setCurrentDisplayJob(job)
    setImageError(false)
  }, [job])

  const getImagePreviewUrl = () => {
    return currentDisplayJob.download_urls?.edge_map || null
  }

  return (
    <div className="min-h-screen relative bg-white">
      <BackgroundBlobs intensity="subtle" />

      <div className="container mx-auto px-4 max-w-7xl py-6 relative z-10">
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
                        Image preview unavailable
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-colors">
                      <img
                        src={getImagePreviewUrl()!}
                        alt="Coloring page"
                        className="w-full h-full object-contain p-4"
                        onError={() => setImageError(true)}
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
                      <span className="font-medium">{processingTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Edit Interface + Actions (PROMINENT) */}
              <div className="flex flex-col gap-6">
                {/* Edit Interface - Highlighted */}
                <div className="bg-white rounded-lg border-2 border-orange-300 p-6 shadow-sm">
                  <div className="mb-4 text-center">
                    <h3 className="text-sm font-medium text-orange-600 mb-1">✨ Edit This Page</h3>
                    <p className="text-xs text-gray-500">Make changes to your coloring page</p>
                  </div>
                  <EditInterface job={job} onEditJobCreated={handleEditJobCreated} />
                </div>

                <Separator />

                {/* Download Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 h-11"
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
                  <Button size="sm" variant="ghost" className="text-gray-500 hover:text-purple-600 hover:bg-purple-50">
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
    </div>
  )
}
