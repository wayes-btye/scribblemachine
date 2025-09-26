'use client'

import { Button } from '@/components/ui/button'
import { Upload, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkspaceMode } from '@/hooks/use-workspace-state'

interface ModeToggleProps {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
  canSwitchMode: boolean
}

export function ModeToggle({ mode, onModeChange, canSwitchMode }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-white border border-gray-200 p-1 shadow-sm">
      <Button
        variant={mode === 'upload' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('upload')}
        disabled={!canSwitchMode && mode !== 'upload'}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
          mode === 'upload'
            ? "bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Upload className="h-4 w-4" />
        Upload Photo
      </Button>

      <Button
        variant={mode === 'prompt' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('prompt')}
        disabled={!canSwitchMode && mode !== 'prompt'}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all",
          mode === 'prompt'
            ? "bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange text-white shadow-sm"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Sparkles className="h-4 w-4" />
        Imagine Idea
      </Button>

      {/* Disabled state indicator */}
      {!canSwitchMode && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            Finish current task to switch modes
          </div>
        </div>
      )}
    </div>
  )
}