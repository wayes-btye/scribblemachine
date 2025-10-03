'use client'

import { useEffect, useState } from 'react'
import { GalleryResponse } from '@/lib/types/api'
import { GalleryGrid } from '@/components/gallery/gallery-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { BackgroundBlobs } from '@/components/ui/background-blobs'

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [galleryData, setGalleryData] = useState<GalleryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [complexityFilter, setComplexityFilter] = useState<string>('all')
  const limit = 9 // Reduced from 12 for better performance (3×3 grid)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Fetch gallery data
  useEffect(() => {
    if (!user) return

    const fetchGallery = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
          sort_by: 'created_at',
          sort_order: 'desc',
        })

        if (searchQuery) params.append('search', searchQuery)
        if (complexityFilter && complexityFilter !== 'all') params.append('complexity', complexityFilter)

        const response = await fetch(
          `/api/gallery?${params.toString()}`,
          {
            credentials: 'include',
            signal: controller.signal,
          }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please sign in to view your gallery')
          }
          throw new Error('Failed to load gallery. Please try again.')
        }

        const data: GalleryResponse = await response.json()
        setGalleryData(data)
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError('Request timed out. Please check your connection and try again.')
          } else {
            setError(err.message)
          }
        } else {
          setError('An unexpected error occurred. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [user, currentPage, searchQuery, complexityFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, complexityFilter])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen relative">
      {/* Background blobs for visual appeal */}
      <BackgroundBlobs intensity="subtle" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 modern-sans tracking-tight">
            My Coloring Pages
          </h1>
          <p className="text-gray-600 text-lg">
            {galleryData
              ? `${galleryData.pagination.total_count} coloring page${galleryData.pagination.total_count === 1 ? '' : 's'
              }`
              : 'Loading your creations...'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search coloring pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Complexity Filter */}
          <Select value={complexityFilter} onValueChange={setComplexityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complexity</SelectItem>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Error Loading Gallery</p>
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => setCurrentPage(1)}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && !error && galleryData && (
          <>
            <GalleryGrid items={galleryData.items} />

            {/* Pagination */}
            {galleryData.pagination.total_count > limit && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-gray-600">
                  Page {galleryData.pagination.page} of{' '}
                  {Math.ceil(galleryData.pagination.total_count / limit)}
                </span>

                <Button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!galleryData.pagination.has_more}
                  variant="outline"
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
