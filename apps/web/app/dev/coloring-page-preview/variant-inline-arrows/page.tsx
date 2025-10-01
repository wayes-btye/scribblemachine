/**
 * VARIANT: Inline Arrow Navigation
 *
 * Changes from production:
 * - REMOVED: "Show/Hide Timeline" toggle
 * - ADDED: Always-visible prev/next arrows above image
 * - KEPT: Image display, edit details, edit interface, download buttons, tips
 *
 * Flow preserved:
 * 1. Shows current image
 * 2. Navigate versions with arrows (no timeline toggle needed)
 * 3. Edit interface below (always visible, only works on latest)
 * 4. Download/share buttons
 * 5. Create another button
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ResultPreview } from '@/components/workspace/result-preview'
import { BackgroundBlobs } from '@/components/ui/background-blobs'
import type { Job } from '@coloringpage/types'

interface JobWithDownloads extends Job {
  download_urls?: {
    edge_map?: string
    pdf?: string
    [key: string]: string | undefined
  }
}

// Mock version data
const MOCK_VERSIONS = [
  {
    id: 'mock-job-original-001',
    user_id: 'dev-user',
    status: 'succeeded' as const,
    params_json: {
      complexity: 'simple',
      line_thickness: 'medium',
    },
    created_at: new Date(Date.now() - 120000).toISOString(),
    started_at: new Date(Date.now() - 110000).toISOString(),
    ended_at: new Date(Date.now() - 104000).toISOString(),
    download_urls: {
      edge_map: '/assets/chicken-eating-a-frog.png',
    },
    versionLabel: 'Original'
  },
  {
    id: 'mock-job-edited-001',
    user_id: 'dev-user',
    status: 'succeeded' as const,
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
    },
    versionLabel: 'Edit 1'
  }
]

const MOCK_EDITED_JOB: JobWithDownloads = MOCK_VERSIONS[1]

export default function InlineArrowsVariantPage() {
  const [currentVersionIndex, setCurrentVersionIndex] = useState(1) // Start at latest
  const [currentDisplayJob, setCurrentDisplayJob] = useState<JobWithDownloads>(MOCK_EDITED_JOB)

  const handleReset = () => {
    console.log('[DEV] Reset clicked')
  }

  const handleEditJobCreated = (editJob: Job) => {
    console.log('[DEV] Edit job created:', editJob)
  }

  const goToPrevious = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1
      setCurrentVersionIndex(newIndex)
      setCurrentDisplayJob(MOCK_VERSIONS[newIndex])
    }
  }

  const goToNext = () => {
    if (currentVersionIndex < MOCK_VERSIONS.length - 1) {
      const newIndex = currentVersionIndex + 1
      setCurrentVersionIndex(newIndex)
      setCurrentDisplayJob(MOCK_VERSIONS[newIndex])
    }
  }

  const isLatestVersion = currentVersionIndex === MOCK_VERSIONS.length - 1
  const hasMultipleVersions = MOCK_VERSIONS.length > 1

  return (
    <div className="min-h-screen relative">
      <BackgroundBlobs intensity="subtle" />

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Coloring Page</h2>

          {/* THIS IS THE KEY CHANGE: Inline navigation instead of timeline toggle */}
          {hasMultipleVersions && (
            <div className="mb-4 flex items-center justify-between bg-muted/30 rounded-lg p-3 border">
              <button
                onClick={goToPrevious}
                disabled={currentVersionIndex === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
              >
                ← Previous
              </button>

              <div className="text-sm text-center">
                <div className="font-medium">{MOCK_VERSIONS[currentVersionIndex].versionLabel}</div>
                <div className="text-xs text-muted-foreground">
                  {currentVersionIndex + 1} of {MOCK_VERSIONS.length}
                </div>
              </div>

              <button
                onClick={goToNext}
                disabled={currentVersionIndex === MOCK_VERSIONS.length - 1}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted"
              >
                Next →
              </button>
            </div>
          )}

          {/* Use actual ResultPreview component, passing current version as job */}
          <div className="result-preview-wrapper">
            <ResultPreview
              job={currentDisplayJob}
              onReset={handleReset}
              onEditJobCreated={isLatestVersion ? handleEditJobCreated : undefined}
            />
          </div>

          {/* Show message when viewing old version */}
          {!isLatestVersion && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ℹ️ You're viewing an older version. Navigate to the latest version to make edits.
            </div>
          )}
        </Card>

        <div className="mt-4 p-3 bg-gray-100/80 backdrop-blur-sm rounded text-xs text-gray-600 text-center">
          🎨 Variant: Inline Arrows (No timeline toggle, just simple prev/next)
        </div>
      </div>
    </div>
  )
}
