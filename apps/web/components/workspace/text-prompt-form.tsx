'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { ParameterControls } from '@/components/workspace/parameter-controls'
import type { Job, TextGenerationRequest } from '@coloringpage/types'

const formSchema = z.object({
  textPrompt: z.string()
    .min(5, 'Please describe your idea with at least 5 characters')
    .max(500, 'Please keep your description under 500 characters')
    .refine(
      (text) => !text.toLowerCase().includes('inappropriate'),
      'Please keep your ideas family-friendly'
    ),
  complexity: z.enum(['simple', 'standard', 'detailed'] as const),
  lineThickness: z.enum(['thin', 'medium', 'thick'] as const)
})

type FormData = z.infer<typeof formSchema>

interface TextPromptFormProps {
  onGenerationStart: (job: Job, prompt: string) => void
  disabled?: boolean
}


const examplePrompts = [
  'A friendly dragon in a magical forest',
  'A princess castle with towers and flags',
  'A cute puppy playing with a ball',
  'A spaceship flying through the stars',
  'A beautiful butterfly on flowers',
  'A pirate ship sailing on the ocean'
]

export function TextPromptForm({ onGenerationStart, disabled = false }: TextPromptFormProps) {
  const [generating, setGenerating] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      textPrompt: '',
      complexity: 'standard',
      lineThickness: 'medium'
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setGenerating(true)

      const request: TextGenerationRequest = {
        textPrompt: data.textPrompt,
        complexity: data.complexity,
        lineThickness: data.lineThickness
      }

      const response = await fetch('/api/jobs/text', {
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
        description: 'Creating your coloring page from your idea...'
      })

      onGenerationStart(job, data.textPrompt)

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
  const textPrompt = form.watch('textPrompt')

  // Single-focus principle: Only show parameters after user enters text
  const hasEnteredText = textPrompt.trim().length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Text Prompt Input - Clean, focused design */}
      <div className="space-y-3">
        <Textarea
          {...form.register('textPrompt')}
          placeholder="Describe your coloring page idea... (e.g., A friendly dinosaur in a garden with flowers)"
          className="min-h-[120px] resize-none placeholder:text-gray-400 placeholder:italic text-base"
          disabled={disabled || generating}
          data-testid="text-prompt-input"
          aria-label="Describe your coloring page idea"
          aria-describedby="text-prompt-help"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span id="text-prompt-help">{textPrompt.length}/500 characters</span>
          {form.formState.errors.textPrompt && (
            <span className="text-red-500">{form.formState.errors.textPrompt.message}</span>
          )}
        </div>

        {/* Compact Example Prompts */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">💡 Need inspiration?</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example prompts">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => form.setValue('textPrompt', example)}
                className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-brand-warm-orange hover:text-white transition-colors focus:ring-2 focus:ring-brand-warm-orange focus:outline-none"
                disabled={disabled || generating}
                aria-label={`Use example prompt: ${example}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Only show parameters and generate button after text is entered */}
      {hasEnteredText && (
        <>
          <div className="pt-4">
            {/* Unified Parameter Controls */}
            <ParameterControls
              complexity={selectedComplexity}
              lineThickness={selectedThickness}
              onComplexityChange={(value) => form.setValue('complexity', value)}
              onLineThicknessChange={(value) => form.setValue('lineThickness', value)}
              disabled={disabled || generating}
              compact={true}
            />
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-brand-warm-orange hover:bg-brand-warm-orange/90 text-white font-semibold mt-4"
            disabled={disabled || generating || !textPrompt.trim()}
            data-testid="generate-button"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Your Coloring Page...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Coloring Page (1 Credit)
              </>
            )}
          </Button>
        </>
      )}
    </form>
  )
}