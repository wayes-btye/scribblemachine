'use client'

import { GalleryItemResponse } from '@/lib/types/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Calendar, Layers } from 'lucide-react'
import { useState } from 'react'

interface GalleryDetailModalProps {
  item: GalleryItemResponse | null
  isOpen: boolean
  onClose: () => void
}

export function GalleryDetailModal({ item, isOpen, onClose }: GalleryDetailModalProps) {
  const [downloading, setDownloading] = useState(false)

  if (!item) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownloadImage = async () => {
    try {
      setDownloading(true)
      const response = await fetch(item.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'coloring-page'}-${item.job_id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!item.pdf_url) {
      console.error('No PDF URL available')
      return
    }

    try {
      setDownloading(true)
      const response = await fetch(item.pdf_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.title || 'coloring-page'}-${item.job_id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF download failed:', error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="relative">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              {item.title || 'Untitled Coloring Page'}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(item.created_at)}
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-6">
            <img
              src={item.image_url}
              alt={item.title || 'Coloring page'}
              className="w-full h-auto"
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Specifications */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-gray-900">
                <Layers className="w-5 h-5 mr-2" />
                Specifications
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Complexity:</span>
                  <Badge variant="outline" className="capitalize">
                    {item.complexity}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Line Thickness:</span>
                  <Badge variant="outline" className="capitalize">
                    {item.line_thickness}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">PDF Available:</span>
                  <Badge variant={item.has_pdf ? "default" : "secondary"}>
                    {item.has_pdf ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-gray-900">
                <Download className="w-5 h-5 mr-2" />
                Downloads
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? 'Downloading...' : 'Download PNG'}
                </Button>
                {item.has_pdf && (
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? 'Downloading...' : 'Download PDF'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Job ID for reference */}
          <div className="text-xs text-gray-500 border-t pt-4">
            Job ID: {item.job_id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
