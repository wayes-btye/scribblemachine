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
import { useEffect, Suspense } from 'react'
import { BackgroundBlobs } from '@/components/ui/background-blobs'

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
        <WorkspaceModeHandler setMode={workspaceState.setMode} />
      </Suspense>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* Unified Header with Mode Toggle */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
              <span className="modern-sans">Create Your</span>{' '}
              <span className="handwritten bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Coloring Page
              </span>
            </h1>

            {/* Mode Toggle - Integrated into header */}
            <div className="flex justify-center mb-4">
              <ModeToggle
                mode={workspaceState.mode}
                onModeChange={workspaceState.setMode}
                canSwitchMode={workspaceState.canSwitchMode}
              />
            </div>

            {/* Subtitle - contextual based on mode */}
            {workspaceState.mode && (
              <p className="text-gray-600 text-xs sm:text-sm">
                {workspaceState.mode === 'upload'
                  ? 'Upload an image and watch the magic happen!'
                  : 'Describe your idea and watch the magic happen!'
                }
              </p>
            )}
          </div>

          {/* Timeline - More subtle, only when mode selected */}
          {workspaceState.mode && (
            <div className="mb-6">
              <WorkspaceTimeline
                mode={workspaceState.mode}
                step={workspaceState.step}
                hasInput={workspaceState.hasUploadedImage || workspaceState.hasTextPrompt}
              />
            </div>
          )}

          {/* Single-Column Centered Workspace */}
          <div className="space-y-6">
            {/* Main Content Area - Single Focus */}
            <div>
              <WorkspaceLeftPane workspaceState={workspaceState} />
            </div>

            {/* Preview/Result Area - Below main content */}
            <div>
              <WorkspaceRightPane workspaceState={workspaceState} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}