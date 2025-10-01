/**
 * VARIANT: Compact Two-Column
 * Image on left, Edit Interface + Actions on right (immediately visible)
 * No scrolling needed - edit box is prominent and obvious
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileImage, FileText, RotateCcw, Share2, Printer, AlertCircle } from 'lucide-react'
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

export default function CompactVariantPage() {
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
    <div className="min-h-screen relative">
      <BackgroundBlobs intensity="subtle" />

      <div className="container mx-auto px-4 max-w-7xl py-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {isEditedJob ? "Edited" : "Your"} Coloring Page
            </h2>
            {isEditedJob && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                ✨
              </Badge>
            )}
            {hasMultipleVersions && (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-gray-50 text-xs"
                onClick={showTimeline ? handleHideTimeline : () => setShowTimeline(true)}
              >
                {showTimeline ? 'Hide' : 'Show'} Timeline
              </Badge>
            )}
          </div>
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
            ✓ Complete
          </Badge>
        </div>

        {/* Timeline (Full Width When Visible) */}
        {hasMultipleVersions && showTimeline && (
          <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4">
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
            <div className="grid lg:grid-cols-[1fr,1fr] gap-4">
              {/* Left: Image */}
              <div className="flex items-start justify-center">
                <div className="w-full">
                  {imageError || !getImagePreviewUrl() ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Image preview unavailable
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md overflow-hidden border border-gray-200">
                      <img
                        src={getImagePreviewUrl()!}
                        alt="Coloring page"
                        className="w-full h-full object-contain p-2"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  )}

                  {/* Compact Details Under Image */}
                  {isEditedJob && currentDisplayJob.params_json?.edit_prompt && (
                    <div className="mt-3 bg-gradient-to-br from-purple-50 to-pink-50 p-2 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-700 italic">"{currentDisplayJob.params_json.edit_prompt}"</p>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2 text-xs text-gray-600">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{currentDisplayJob.params_json.complexity}</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{currentDisplayJob.params_json.line_thickness}</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{processingTime}</span>
                  </div>
                </div>
              </div>

              {/* Right: Edit Interface + Actions (PROMINENT) */}
              <div className="flex flex-col gap-4">
                {/* Edit Interface First - Most Important */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-orange-200">
                  <EditInterface job={job} onEditJobCreated={handleEditJobCreated} />
                </div>

                <Separator />

                {/* Download Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    size="lg"
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

                  <Button
                    onClick={handleExport}
                    disabled={exporting}
                    variant="outline"
                    className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50"
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
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <Share2 className="mr-1 h-3 w-3" />
                    Share
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <Printer className="mr-1 h-3 w-3" />
                    Print
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs">
                    <RotateCcw className="mr-1 h-3 w-3" />
                    New
                  </Button>
                </div>

                {/* Quick Tip */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <p className="text-xs text-amber-800">
                    <strong>💡 Tip:</strong> Print at 300 DPI on A4/Letter
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
