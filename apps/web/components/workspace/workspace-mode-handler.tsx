'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface WorkspaceModeHandlerProps {
  setMode: (mode: 'upload' | 'prompt') => void
}

export function WorkspaceModeHandler({ setMode }: WorkspaceModeHandlerProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode && (mode === 'upload' || mode === 'prompt')) {
      setMode(mode)
    }
  }, [searchParams, setMode])

  return null // This component doesn't render anything
}