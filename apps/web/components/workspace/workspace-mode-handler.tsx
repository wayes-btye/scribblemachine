'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import type { WorkspaceMode } from '@/hooks/use-workspace-state'

interface WorkspaceModeHandlerProps {
  setMode: (mode: 'upload' | 'prompt') => void
  currentMode: WorkspaceMode
}

export function WorkspaceModeHandler({ setMode, currentMode }: WorkspaceModeHandlerProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode && (mode === 'upload' || mode === 'prompt')) {
      // Only set mode if it's different from current mode to prevent repeated resets
      if (mode !== currentMode) {
        setMode(mode)
      }
    }
  }, [searchParams, setMode, currentMode])

  return null // This component doesn't render anything
}