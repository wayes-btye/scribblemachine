'use client'

import { useWorkspaceState } from '@/hooks/use-workspace-state'
import { ModeToggle } from '@/components/workspace/mode-toggle'
import { WorkspaceLeftPane } from '@/components/workspace/workspace-left-pane'
import { WorkspaceRightPane } from '@/components/workspace/workspace-right-pane'
import { useAuth } from '@/lib/auth/auth-provider'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Sparkles, Lock } from 'lucide-react'
import { useState } from 'react'

export default function WorkspacePage() {
  const { user, loading } = useAuth()
  const workspaceState = useWorkspaceState()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

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

  // Show authentication gate if user is not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Authentication Gate */}
            <Card className="max-w-2xl mx-auto mb-8">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-brand-warm-blue/10 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-brand-warm-blue" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">
                  Sign In to Create Your Coloring Page
                </CardTitle>
                <CardDescription className="text-lg">
                  Access the workspace to upload photos or generate custom coloring pages
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-8">
                  Sign in securely with your email to start creating amazing coloring pages. No password required!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="bg-brand-warm-blue hover:bg-brand-warm-blue/90 text-white text-lg px-8 py-4 rounded-2xl shadow-lg"
                      >
                        <Upload className="mr-2 h-5 w-5" />
                        Sign In to Upload Photo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border-0 p-0">
                      <MagicLinkForm
                        onSuccess={() => {
                          setAuthDialogOpen(false)
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-brand-warm-orange text-brand-warm-orange hover:bg-brand-warm-orange/10 text-lg px-8 py-4 rounded-2xl"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Sign In to Imagine Ideas
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>

                <p className="text-sm text-gray-500">
                  Free tier available: 3 coloring pages with watermark
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-soft-blue/10 to-brand-soft-pink/10">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Mode Toggle - Sticky on mobile for better UX */}
          <div className="sticky top-0 bg-gradient-to-br from-brand-cream/95 via-brand-soft-blue/5 to-brand-soft-pink/5 backdrop-blur-sm z-10 -mx-3 sm:mx-0 px-3 sm:px-0 py-4 sm:py-0 sm:relative sm:bg-transparent sm:backdrop-blur-none text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Create Your{' '}
              <span className="text-transparent bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange bg-clip-text">
                Coloring Page
              </span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
              {workspaceState.mode === 'upload'
                ? 'Upload an image and watch the magic happen!'
                : workspaceState.mode === 'prompt'
                ? 'Describe your idea and watch the magic happen!'
                : 'Choose how you\'d like to create your coloring page'
              }
            </p>

            {/* Mode Toggle - Full width on mobile */}
            <div className="px-2 sm:px-0">
              <ModeToggle
                mode={workspaceState.mode}
                onModeChange={workspaceState.setMode}
                canSwitchMode={workspaceState.canSwitchMode}
              />
            </div>
          </div>

          {/* Main Workspace - Progressive Disclosure Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Pane - Dynamic form based on mode */}
            <div className="order-1">
              <WorkspaceLeftPane workspaceState={workspaceState} />
            </div>

            {/* Right Pane - Context canvas that adapts to current step */}
            <div className="order-2 lg:order-2">
              <WorkspaceRightPane workspaceState={workspaceState} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}