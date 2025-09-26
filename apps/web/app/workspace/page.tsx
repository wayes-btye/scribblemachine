'use client'

import { useWorkspaceState } from '@/hooks/use-workspace-state'
import { ModeToggle } from '@/components/workspace/mode-toggle'
import { WorkspaceLeftPane } from '@/components/workspace/workspace-left-pane'
import { WorkspaceRightPane } from '@/components/workspace/workspace-right-pane'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WorkspacePage() {
  const { user, loading } = useAuth()
  const workspaceState = useWorkspaceState()
  const router = useRouter()

  // Redirect to home if not authenticated (but only after loading is complete)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brand-warm-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If loading is complete but no user, let the useEffect handle the redirect
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Mode Toggle */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Create Your{' '}
              <span className="text-transparent bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange bg-clip-text">
                Coloring Page
              </span>
            </h1>
            <p className="text-gray-600 mb-6">
              {workspaceState.mode === 'upload'
                ? 'Upload an image and watch the magic happen!'
                : workspaceState.mode === 'prompt'
                ? 'Describe your idea and watch the magic happen!'
                : 'Choose how you\'d like to create your coloring page'
              }
            </p>

            {/* Mode Toggle */}
            <ModeToggle
              mode={workspaceState.mode}
              onModeChange={workspaceState.setMode}
              canSwitchMode={workspaceState.canSwitchMode}
            />
          </div>

          {/* Main Workspace - Progressive Disclosure Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Pane - Dynamic form based on mode */}
            <WorkspaceLeftPane workspaceState={workspaceState} />

            {/* Right Pane - Context canvas that adapts to current step */}
            <WorkspaceRightPane workspaceState={workspaceState} />
          </div>
        </div>
      </div>
    </div>
  )
}