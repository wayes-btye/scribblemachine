'use client'

import { GalleryItemResponse } from '@/lib/types/api'
import { Card } from '@/components/ui/card'
import { Calendar, Download, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface GalleryItemProps {
  item: GalleryItemResponse
  onClick: () => void
  priority?: boolean // For first 3 items to load faster
}

export function GalleryItem({ item, onClick, priority = false }: GalleryItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-200 bg-white"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]">
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400/50" />
            </div>
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-16 h-16 mb-2" />
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : (
          <img
            src={item.image_url}
            alt={item.title || 'Coloring page'}
            loading={priority ? 'eager' : 'lazy'} // Priority images load immediately, others lazy load
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-medium text-lg">View Details</span>
        </div>

        {/* PDF Badge */}
        {item.has_pdf && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-900 shadow-md">
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900">
          {item.title || 'Untitled Coloring Page'}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(item.created_at)}
          </div>

          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs capitalize">
              {item.complexity}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}
