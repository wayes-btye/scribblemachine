'use client'

import { GalleryItemResponse } from '@/lib/types/api'
import { GalleryItem } from './gallery-item'
import { useState } from 'react'
import { GalleryDetailModal } from './gallery-detail-modal'

interface GalleryGridProps {
  items: GalleryItemResponse[]
}

export function GalleryGrid({ items }: GalleryGridProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryItemResponse | null>(null)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 mb-6 opacity-20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <h3 className="text-2xl font-semibold mb-2 text-gray-900">No Coloring Pages Yet</h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Your generated coloring pages will appear here. Start creating your first masterpiece!
        </p>
        <a
          href="/workspace"
          className="btn-primary px-6 py-3 inline-flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Your First Page
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <GalleryItem
            key={item.job_id}
            item={item}
            onClick={() => setSelectedItem(item)}
          />
        ))}
      </div>

      <GalleryDetailModal
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
      />
    </>
  )
}
