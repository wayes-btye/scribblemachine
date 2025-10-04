'use client'

// Force rebuild to resolve Vercel file resolution issues
import { useWorkspaceState } from '@/hooks/use-workspace-state'
import { ModeToggle } from '@/components/workspace/mode-toggle'
import { WorkspaceLeftPane } from '@/components/workspace/workspace-left-pane'
import { WorkspaceRightPane } from '@/components/workspace/workspace-right-pane'
import { WorkspaceModeHandler } from '@/components/workspace/workspace-mode-handler'
import { WorkspaceTimeline } from '@/components/workspace/workspace-timeline'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense, useCallback } from 'react'
import { BackgroundBlobs } from '@/components/ui/background-blobs'
import { DebugEnv } from '@/components/debug-env'
import type { WorkspaceMode } from '@/hooks/use-workspace-state'

export default function WorkspacePage() {
  const { user, loading } = useAuth()
  const workspaceState = useWorkspaceState()
  const router = useRouter()

  // Update URL only - WorkspaceModeHandler will update state when URL changes
  // This prevents race condition where state updates before URL, causing jitter
  const handleModeChange = useCallback((mode: WorkspaceMode) => {
    if (mode) {
      router.push(`/workspace?mode=${mode}`, { scroll: false })
    } else {
      router.push('/workspace', { scroll: false })
    }
  }, [router])

  // Redirect to home if not authenticated (but only after loading is complete)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="text-center bg-white/85 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <div className="animate-spin h-12 w-12 border-3 border-primary border-t-transparent rounded-full mx-auto mb-6" />
          <p className="text-muted-foreground text-lg font-medium">Loading your creative workspace...</p>
        </div>
      </div>
    )
  }

  // If loading is complete but no user, let the useEffect handle the redirect
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen relative">
      {/* Background blobs for visual appeal */}
      <BackgroundBlobs intensity="subtle" />

      {/* Handle URL mode parameter */}
      <Suspense fallback={null}>
        <WorkspaceModeHandler setMode={workspaceState.setMode} currentMode={workspaceState.mode} />
      </Suspense>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Container Box - Similar to reference image */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8 lg:p-12">
            {/* Unified Header with Mode Toggle */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                <span className="modern-sans">Create Your</span>{' '}
                <span className="handwritten bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Coloring Page
                </span>
              </h1>

              {/* Mode Toggle - Integrated into header */}
              <div className="flex justify-center mb-6">
                <ModeToggle
                  mode={workspaceState.mode}
                  onModeChange={handleModeChange}
                  canSwitchMode={workspaceState.canSwitchMode}
                />
              </div>

              {/* Subtitle - contextual based on mode */}
              <p className="text-gray-600 text-sm sm:text-base mb-6">
                {workspaceState.mode
                  ? workspaceState.mode === 'upload'
                    ? 'Upload an image and watch the magic happen!'
                    : 'Describe your idea and watch the magic happen!'
                  : 'Select a mode above to get started'
                }
              </p>

              {/* Timeline - More subtle, only when mode selected */}
              {workspaceState.mode && (
                <div className="mb-8">
                  <WorkspaceTimeline
                    mode={workspaceState.mode}
                    step={workspaceState.step}
                    hasInput={workspaceState.hasUploadedImage || workspaceState.hasTextPrompt}
                  />
                </div>
              )}
            </div>

            {/* Main Content Area - Single Focus */}
            <div className="space-y-6">
              <WorkspaceLeftPane workspaceState={workspaceState} />
            </div>
          </div>

          {/* Preview/Result Area - Below main container with enhanced visibility */}
          <div className="mt-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-1">
              <WorkspaceRightPane workspaceState={workspaceState} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Environment Info */}
      <DebugEnv />
    </div>
  )
}