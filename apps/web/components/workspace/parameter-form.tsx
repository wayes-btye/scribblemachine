'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { ParameterControls } from '@/components/workspace/parameter-controls'
import type { Job, GenerationRequest } from '@coloringpage/types'

const formSchema = z.object({
  complexity: z.enum(['simple', 'standard', 'detailed'] as const),
  lineThickness: z.enum(['thin', 'medium', 'thick'] as const)
})

type FormData = z.infer<typeof formSchema>

interface ParameterFormProps {
  assetId: string
  onGenerationStart: (job: Job) => void
  disabled?: boolean
}


export function ParameterForm({ assetId, onGenerationStart, disabled }: ParameterFormProps) {
  const [generating, setGenerating] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      complexity: 'standard',
      lineThickness: 'medium'
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setGenerating(true)

      const request: GenerationRequest = {
        assetId: assetId,
        complexity: data.complexity,
        lineThickness: data.lineThickness
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to start generation')
      }

      const job: Job = await response.json()

      toast({
        title: 'Generation started!',
        description: 'Creating your coloring page...'
      })

      onGenerationStart(job)

    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  const selectedComplexity = form.watch('complexity')
  const selectedThickness = form.watch('lineThickness')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Unified Parameter Controls */}
      <ParameterControls
        complexity={selectedComplexity}
        lineThickness={selectedThickness}
        onComplexityChange={(value) => form.setValue('complexity', value)}
        onLineThicknessChange={(value) => form.setValue('lineThickness', value)}
        disabled={disabled || generating}
        compact={false}
      />

      {/* Generate Button */}
      <Button
        type="submit"
        size="lg"
        disabled={disabled || generating}
        className="w-full bg-brand-warm-orange hover:bg-brand-warm-orange/90 text-white"
        data-testid="generate-button"
      >
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating Your Coloring Page...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Generate Coloring Page
          </>
        )}
      </Button>

      {/* Cost Information */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          This will use <strong>1 credit</strong> from your balance
        </p>
      </div>
    </form>
  )
}