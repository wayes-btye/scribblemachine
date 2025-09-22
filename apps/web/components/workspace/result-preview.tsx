'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileImage, FileText, RotateCcw, Share2, Printer, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Job } from '@coloringpage/types'

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
}

export function ResultPreview({ job, onReset }: ResultPreviewProps) {
  const [downloading, setDownloading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Get the download URL from job data
  const getDownloadUrl = () => {
    // Use the actual download URL from the job if available
    return job.download_urls?.edge_map || `/api/jobs/${job.id}/download`
  }

  const getImagePreviewUrl = () => {
    // Use the edge_map URL for preview
    return job.download_urls?.edge_map || null
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
      link.download = `coloring-page-${job.id.slice(0, 8)}.png`
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
          job_id: job.id,
          paper_size: 'A4',
          title: `Coloring Page - ${new Date().toLocaleDateString()}`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to export PDF')
      }

      const { pdfUrl } = await response.json()

      // Download the PDF
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `coloring-page-${job.id.slice(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

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

  return (
    <div className="space-y-6" data-testid="result-preview">
      {/* Generated Image Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Generated Coloring Page</h3>
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
              </AlertDescription>
            </Alert>
          ) : (
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={getImagePreviewUrl()!}
                alt="Generated coloring page"
                className="w-full h-full object-contain"
                onError={handleImageError}
                data-testid="generated-image"
              />
            </div>
          )}
        </div>
      </div>

      {/* Job Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Generation Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Complexity:</span>
            <br />
            <span className="font-medium capitalize">{job.params_json.complexity}</span>
          </div>
          <div>
            <span className="text-gray-600">Line Thickness:</span>
            <br />
            <span className="font-medium capitalize">{job.params_json.line_thickness}</span>
          </div>
          <div>
            <span className="text-gray-600">Processing Time:</span>
            <br />
            <span className="font-medium">
              {job.started_at && job.ended_at
                ? `${Math.round((new Date(job.ended_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s`
                : 'N/A'
              }
            </span>
          </div>
          <div>
            <span className="text-gray-600">Job ID:</span>
            <br />
            <span className="font-mono text-xs">{job.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

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