'use client'

import { useState, useCallback } from 'react'
import type { Job } from '@coloringpage/types'

export type WorkspaceMode = 'upload' | 'prompt' | null
export type WorkspaceStep = 'input' | 'generating' | 'result' | 'editing'

export interface WorkspaceData {
  uploadedImage?: { assetId: string; url: string }
  textPrompt?: string
  parameters?: any // This would be GenerationParameters if we had that type
  currentJob?: Job
}

export interface WorkspaceState {
  mode: WorkspaceMode
  step: WorkspaceStep
  data: WorkspaceData
  isLoading: boolean
}

export function useWorkspaceState() {
  const [state, setState] = useState<WorkspaceState>({
    mode: null,
    step: 'input',
    data: {},
    isLoading: false
  })

  // Mode switching
  const setMode = useCallback((mode: WorkspaceMode) => {
    setState(prev => ({
      ...prev,
      mode,
      step: 'input'
    }))
  }, [])

  // Step management
  const setStep = useCallback((step: WorkspaceStep) => {
    setState(prev => ({ ...prev, step }))
  }, [])

  // Data management
  const setUploadedImage = useCallback((assetId: string, url: string) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        uploadedImage: { assetId, url }
      }
    }))
  }, [])

  const setTextPrompt = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        textPrompt: prompt
      }
    }))
  }, [])

  const setCurrentJob = useCallback((job: Job | null) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        currentJob: job || undefined
      }
    }))
  }, [])

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  // Generation flow helpers
  const startGeneration = useCallback((job: Job) => {
    setState(prev => ({
      ...prev,
      step: 'generating',
      data: {
        ...prev.data,
        currentJob: job
      },
      isLoading: true
    }))
  }, [])

  const completeGeneration = useCallback((job: Job) => {
    setState(prev => ({
      ...prev,
      step: 'result',
      data: {
        ...prev.data,
        currentJob: job
      },
      isLoading: false
    }))
  }, [])

  const startEditing = useCallback((editJob: Job) => {
    setState(prev => ({
      ...prev,
      step: 'editing',
      data: {
        ...prev.data,
        currentJob: editJob
      },
      isLoading: true
    }))
  }, [])

  const completeEditing = useCallback((editJob: Job) => {
    setState(prev => ({
      ...prev,
      step: 'result',
      data: {
        ...prev.data,
        currentJob: editJob
      },
      isLoading: false
    }))
  }, [])

  // Reset functionality
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'input',
      data: {},
      isLoading: false
    }))
  }, [])

  const resetAll = useCallback(() => {
    setState({
      mode: null,
      step: 'input',
      data: {},
      isLoading: false
    })
  }, [])

  // Mode switching without losing current work
  const switchMode = useCallback((newMode: WorkspaceMode) => {
    setState(prev => {
      // If we have active work, preserve it but switch the mode
      const canSwitchWithWork = prev.step === 'result' || prev.step === 'input'

      if (canSwitchWithWork) {
        return {
          ...prev,
          mode: newMode,
          step: 'input'
        }
      } else {
        // If actively generating/editing, ask user to confirm or wait
        return prev
      }
    })
  }, [])

  return {
    // State
    ...state,

    // Actions
    setMode,
    setStep,
    setUploadedImage,
    setTextPrompt,
    setCurrentJob,
    setIsLoading,

    // Flow helpers
    startGeneration,
    completeGeneration,
    startEditing,
    completeEditing,

    // Reset actions
    reset,
    resetAll,
    switchMode,

    // Computed properties
    hasUploadedImage: !!state.data.uploadedImage,
    hasTextPrompt: !!state.data.textPrompt,
    hasCurrentJob: !!state.data.currentJob,
    canSwitchMode: state.step === 'input' || state.step === 'result'
  }
}