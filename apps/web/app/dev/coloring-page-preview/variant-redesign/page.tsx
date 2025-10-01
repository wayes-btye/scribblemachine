/**
 * VARIANT: Redesigned Result Preview
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { BackgroundBlobs } from '@/components/ui/background-blobs'
import {
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileText,
  RotateCcw,
  Pencil,
  ChevronDown,
  ChevronUp,
  Printer,
  Share2
} from 'lucide-react'
import type { Job } from '@coloringpage/types'

interface JobWithDownloads extends Job {
  download_urls?: {
    edge_map?: string
    pdf?: string
    [key: string]: string | undefined
  }
}

const MOCK_VERSIONS = [
  {
    id: 'mock-job-original-001',
    user_id: 'dev-user',
    status: 'succeeded' as const,
    params_json: { complexity: 'simple', line_thickness: 'medium' },
    created_at: new Date(Date.now() - 120000).toISOString(),
    started_at: new Date(Date.now() - 110000).toISOString(),
    ended_at: new Date(Date.now() - 104000).toISOString(),
    download_urls: { edge_map: '/assets/chicken-eating-a-frog.png' },
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
    download_urls: { edge_map: '/assets/peppa-and-chase-holding-hands.png' },
    versionLabel: 'Edit 1'
  }
]

export default function RedesignVariantPage() {
  const [showEditedVersion, setShowEditedVersion] = useState(false)
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0)
  const [editInterfaceExpanded, setEditInterfaceExpanded] = useState(false)
  const [editPrompt, setEditPrompt] = useState('')

  const hasEdits = showEditedVersion
  const currentVersion = showEditedVersion ? MOCK_VERSIONS[currentVersionIndex] : MOCK_VERSIONS[0]
  const isLatestVersion = currentVersionIndex === MOCK_VERSIONS.length - 1

  return (
    <div className="min-h-screen relative">
      <BackgroundBlobs intensity="subtle" />
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {showEditedVersion ? '📝 Edited' : '🎨 Original'}
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowEditedVersion(!showEditedVersion)} className="bg-white">
              {showEditedVersion ? 'Reset' : 'Simulate Edit'}
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Your Coloring Page</h2>
              <Badge variant="outline" className="text-green-600 border-green-200">✓ Complete</Badge>
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border">
              <img src={currentVersion.download_urls?.edge_map} alt="Coloring page" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="p-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button className="w-full bg-brand-soft-blue hover:bg-brand-soft-blue/90 text-white">
                <FileImage className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button variant="outline" className="w-full border-brand-warm-orange text-brand-warm-orange hover:bg-brand-warm-orange/10">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
          <div className="border-t p-4 sm:p-6">
            <Button variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Create Another Coloring Page
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
