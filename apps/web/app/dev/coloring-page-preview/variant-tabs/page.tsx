/**
 * VARIANT: Tab-Based Navigation
 *
 * Changes from production:
 * - REMOVED: "Show/Hide Timeline" toggle
 * - ADDED: Tabs for each version (Original, Edit 1, Edit 2, etc.)
 * - KEPT: Image display, edit details, edit interface, download buttons, tips
 *
 * Flow preserved:
 * 1. Tabs show all versions at top
 * 2. Click tab to switch version
 * 3. Edit interface below (always visible, only works on latest)
 * 4. Download/share buttons
 * 5. Create another button
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ResultPreview } from '@/components/workspace/result-preview'
import { BackgroundBlobs } from '@/components/ui/background-blobs'
import { Sparkles } from 'lucide-react'
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

export default function TabsVariantPage() {
  const [activeVersionId, setActiveVersionId] = useState(MOCK_VERSIONS[1].id) // Start at latest
  const [currentDisplayJob, setCurrentDisplayJob] = useState<JobWithDownloads>(MOCK_EDITED_JOB)

  const handleReset = () => {
    console.log('[DEV] Reset clicked')
  }

  const handleEditJobCreated = (editJob: Job) => {
    console.log('[DEV] Edit job created:', editJob)
  }

  const handleTabClick = (version: JobWithDownloads) => {
    setActiveVersionId(version.id)
    setCurrentDisplayJob(version)
  }

  const currentVersion = MOCK_VERSIONS.find(v => v.id === activeVersionId) || MOCK_VERSIONS[0]
  const isLatestVersion = activeVersionId === MOCK_VERSIONS[MOCK_VERSIONS.length - 1].id
  const hasMultipleVersions = MOCK_VERSIONS.length > 1

  return (
    <div className="min-h-screen relative">
      <BackgroundBlobs intensity="subtle" />

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Coloring Page</h2>

          {/* THIS IS THE KEY CHANGE: Tabs instead of timeline toggle */}
          {hasMultipleVersions && (
            <div className="mb-6 border-b">
              <div className="flex gap-1">
                {MOCK_VERSIONS.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => handleTabClick(version)}
                    className={`
                      px-4 py-2.5 -mb-px font-medium text-sm transition-all relative
                      ${activeVersionId === version.id
                        ? 'border-b-2 border-primary text-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-1.5">
                      {version.versionLabel}
                      {index === MOCK_VERSIONS.length - 1 && activeVersionId === version.id && (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
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
              ℹ️ You're viewing an older version. Switch to "{MOCK_VERSIONS[MOCK_VERSIONS.length - 1].versionLabel}" tab to make edits.
            </div>
          )}
        </Card>

        <div className="mt-4 p-3 bg-gray-100/80 backdrop-blur-sm rounded text-xs text-gray-600 text-center">
          🎨 Variant: Tabs (Click tabs to switch versions, no timeline toggle)
        </div>
      </div>
    </div>
  )
}
