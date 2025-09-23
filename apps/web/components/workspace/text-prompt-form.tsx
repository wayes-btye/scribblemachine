'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Settings, Minus, RectangleHorizontal, Square, Palette, PaintBucket, Pen } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Complexity, LineThickness, Job, TextGenerationRequest } from '@coloringpage/types'

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

const complexityOptions = [
  {
    value: 'simple' as Complexity,
    label: 'Simple',
    description: 'Clean lines, perfect for young children',
    icon: Minus,
    badge: 'Ages 3-6'
  },
  {
    value: 'standard' as Complexity,
    label: 'Standard',
    description: 'Balanced detail for most ages',
    icon: RectangleHorizontal,
    badge: 'Ages 6-12'
  },
  {
    value: 'detailed' as Complexity,
    label: 'Detailed',
    description: 'Intricate patterns for advanced colorers',
    icon: Square,
    badge: 'Ages 12+'
  }
]

const thicknessOptions = [
  {
    value: 'thin' as LineThickness,
    label: 'Thin Lines',
    description: 'Fine details, best for older children',
    icon: Pen,
    badge: '1-2px'
  },
  {
    value: 'medium' as LineThickness,
    label: 'Medium Lines',
    description: 'Perfect balance for most ages',
    icon: Palette,
    badge: '2-3px'
  },
  {
    value: 'thick' as LineThickness,
    label: 'Thick Lines',
    description: 'Easy coloring for small hands',
    icon: PaintBucket,
    badge: '3-4px'
  }
]

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Text Prompt Input */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-warm-orange" />
            Describe Your Idea
          </h3>
          <p className="text-sm text-gray-600">What would you like to color?</p>
        </div>

        <div className="space-y-3">
          <Textarea
            {...form.register('textPrompt')}
            placeholder="A friendly dinosaur in a garden with flowers..."
            className="min-h-[100px] resize-none"
            disabled={disabled || generating}
            data-testid="text-prompt-input"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>{textPrompt.length}/500 characters</span>
            {form.formState.errors.textPrompt && (
              <span className="text-red-500">{form.formState.errors.textPrompt.message}</span>
            )}
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">💡 Need inspiration? Try one of these:</p>
            <div className="grid grid-cols-2 gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => form.setValue('textPrompt', example)}
                  className="text-left text-xs p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                  disabled={disabled || generating}
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Complexity Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand-warm-blue" />
            Complexity Level
          </h3>
          <p className="text-sm text-gray-600">Choose the right level of detail</p>
        </div>

        <RadioGroup
          value={selectedComplexity}
          onValueChange={(value) => form.setValue('complexity', value as Complexity)}
          className="space-y-3"
          data-testid="complexity-selection"
        >
          {complexityOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedComplexity === option.value

            return (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`complexity-${option.value}`}
                  className="peer sr-only"
                  disabled={disabled || generating}
                />
                <Label
                  htmlFor={`complexity-${option.value}`}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                    isSelected
                      ? 'border-brand-warm-blue bg-brand-warm-blue/5'
                      : 'border-gray-200'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-warm-blue' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      <Separator />

      {/* Line Thickness Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-warm-green" />
            Line Thickness
          </h3>
          <p className="text-sm text-gray-600">Perfect for different coloring tools</p>
        </div>

        <RadioGroup
          value={selectedThickness}
          onValueChange={(value) => form.setValue('lineThickness', value as LineThickness)}
          className="space-y-3"
          data-testid="thickness-selection"
        >
          {thicknessOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedThickness === option.value

            return (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`thickness-${option.value}`}
                  className="peer sr-only"
                  disabled={disabled || generating}
                />
                <Label
                  htmlFor={`thickness-${option.value}`}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                    isSelected
                      ? 'border-brand-warm-green bg-brand-warm-green/5'
                      : 'border-gray-200'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-warm-green' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* Generate Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-gradient-to-r from-brand-warm-blue to-brand-warm-orange hover:from-brand-warm-blue/90 hover:to-brand-warm-orange/90 text-white"
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
    </form>
  )
}