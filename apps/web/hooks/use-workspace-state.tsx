'use client'

import { useState, useCallback } from 'react'

export type WorkspaceMode = 'upload' | 'prompt' | 'select'
export type WorkspaceStep = 'input' | 'generating' | 'editing' | 'result'

export interface WorkspaceData {
  uploadedImage?: {
    assetId: string
    url: string
  }
  textPrompt?: string
  currentJob?: any
}

export interface WorkspaceState {
  mode: WorkspaceMode
  step: WorkspaceStep
  data: WorkspaceData
  isLoading: boolean
  canSwitchMode: boolean
  setMode: (mode: WorkspaceMode) => void
  setCanSwitchMode: (canSwitch: boolean) => void
  setUploadedImage: (assetId: string, url: string) => void
  setTextPrompt: (prompt: string) => void
  startGeneration: (job: any) => void
  completeGeneration: (job: any) => void
  startEditing: (job: any) => void
  completeEditing: (job: any) => void
  reset: () => void
}

export function useWorkspaceState(): WorkspaceState {
  const [mode, setModeState] = useState<WorkspaceMode>('select')
  const [step, setStep] = useState<WorkspaceStep>('input')
  const [data, setData] = useState<WorkspaceData>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [canSwitchMode, setCanSwitchMode] = useState<boolean>(true)

  const setMode = useCallback((newMode: WorkspaceMode) => {
    if (canSwitchMode) {
      setModeState(newMode)
      setData({}) // Reset data when switching modes
      setStep('input')
    }
  }, [canSwitchMode])

  const setUploadedImage = useCallback((assetId: string, url: string) => {
    if (!assetId || !url) {
      // Clear the uploaded image if empty values are passed
      setData(prev => {
        const { uploadedImage, ...rest } = prev
        return rest
      })
    } else {
      setData(prev => ({
        ...prev,
        uploadedImage: { assetId, url }
      }))
    }
  }, [])

  const setTextPrompt = useCallback((prompt: string) => {
    setData(prev => ({
      ...prev,
      textPrompt: prompt
    }))
  }, [])

  const startGeneration = useCallback((job: any) => {
    setData(prev => ({
      ...prev,
      currentJob: job
    }))
    setStep('generating')
    setIsLoading(true)
    setCanSwitchMode(false)
  }, [])

  const completeGeneration = useCallback((job: any) => {
    setData(prev => ({
      ...prev,
      currentJob: job
    }))
    setStep('result')
    setIsLoading(false)
    setCanSwitchMode(true)
  }, [])

  const startEditing = useCallback((job: any) => {
    setData(prev => ({
      ...prev,
      currentJob: job
    }))
    setStep('editing')
    setIsLoading(true)
    setCanSwitchMode(false)
  }, [])

  const completeEditing = useCallback((job: any) => {
    setData(prev => ({
      ...prev,
      currentJob: job
    }))
    setStep('result')
    setIsLoading(false)
    setCanSwitchMode(true)
  }, [])

  const reset = useCallback(() => {
    setData({})
    setStep('input')
    setIsLoading(false)
    setCanSwitchMode(true)
    setModeState('select')
  }, [])

  return {
    mode,
    step,
    data,
    isLoading,
    canSwitchMode,
    setMode,
    setCanSwitchMode,
    setUploadedImage,
    setTextPrompt,
    startGeneration,
    completeGeneration,
    startEditing,
    completeEditing,
    reset,
  }
}