/**
 * ISOLATED DEVELOPMENT PAGE: Coloring Page Preview
 *
 * Purpose: Rapid UI iteration on post-generation coloring page interface
 * - No image generation required
 * - No authentication required
 * - No database queries
 * - Mock data with 2-version timeline (original + edit)
 *
 * AI DESIGN ITERATION INSTRUCTIONS:
 *
 * This page uses the ACTUAL production component (ResultPreview), so any
 * changes you make to that component while testing here will automatically
 * appear in production.
 *
 * WORKFLOW:
 * 1. Make design changes to: apps/web/components/workspace/result-preview.tsx
 * 2. Test immediately on this page: http://localhost:3000/dev/coloring-page-preview
 * 3. Verify in full app: http://localhost:3000/workspace
 * 4. Commit changes (they're already in production code!)
 *
 * WHAT YOU CAN EDIT:
 * - ResultPreview component styling, layout, interactions
 * - Download button designs
 * - Timeline visualization
 * - Edit interface UI
 * - Printing tips section
 * - Any visual/UX elements
 *
 * WHAT TO PRESERVE:
 * - Component functionality (onClick handlers, state management)
 * - Props structure (job, onReset, onEditJobCreated)
 * - Conditional rendering logic
 * - Data flow patterns
 *
 * TESTING CHECKLIST:
 * □ UI looks correct on this isolated page
 * □ Timeline toggle works (Show Timeline / Hide Timeline)
 * □ Can navigate between Original and Edit 1
 * □ Images display properly (chicken = original, peppa = edited)
 * □ Edit interface renders
 * □ Download/Export buttons render (won't work with mock data)
 * □ Responsive on mobile (resize browser)
 * □ Test in full workspace flow before committing
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

/**
 * MOCK DATA EXPLANATION:
 *
 * This mock job represents an EDITED coloring page with version history:
 * - edit_parent_id: Triggers timeline to appear
 * - edit_prompt: Shows in the timeline and details section
 * - download_urls: Points to static images in /public/assets/
 *
 * The mock API endpoint at /api/jobs/mock-job-edited-001/versions returns:
 * - Version 1 (Original): chicken-eating-a-frog.png
 * - Version 2 (Edit 1): peppa-and-chase-holding-hands.png
 */
export default function ColoringPagePreviewDevPage() {
  const handleReset = () => {
    console.log('[DEV] Reset clicked - would navigate to workspace')
  }

  const handleEditJobCreated = (editJob: Job) => {
    console.log('[DEV] Edit job created:', editJob)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background blobs matching production */}
      <BackgroundBlobs intensity="subtle" />

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Coloring Page</h2>
          <ResultPreview
            job={MOCK_EDITED_JOB}
            onReset={handleReset}
            onEditJobCreated={handleEditJobCreated}
          />
        </Card>

        <div className="mt-4 p-3 bg-gray-100/80 backdrop-blur-sm rounded text-xs text-gray-600">
          Dev Mode: Using mock data with timeline history (chicken = original, peppa = edited)
        </div>
      </div>
    </div>
  )
}
