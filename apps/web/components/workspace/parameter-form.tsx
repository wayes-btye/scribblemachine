'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap, Settings, Minus, RectangleHorizontal, Square } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { Complexity, LineThickness, Job, GenerationRequest } from '@coloringpage/types'

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

const lineThicknessOptions = [
  {
    value: 'thin' as LineThickness,
    label: 'Thin',
    description: 'Fine lines for precise coloring',
    strokeWidth: '1'
  },
  {
    value: 'medium' as LineThickness,
    label: 'Medium',
    description: 'Balanced thickness for most users',
    strokeWidth: '2'
  },
  {
    value: 'thick' as LineThickness,
    label: 'Thick',
    description: 'Bold lines, easier for small hands',
    strokeWidth: '4'
  }
]

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
      {/* Complexity Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-warm-orange" />
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
              <div key={option.value} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`complexity-${option.value}`}
                    data-testid={`complexity-${option.value}`}
                  />
                  <Label
                    htmlFor={`complexity-${option.value}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-brand-warm-orange' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {option.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </Label>
                </div>
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
            <Settings className="h-5 w-5 text-brand-warm-blue" />
            Line Thickness
          </h3>
          <p className="text-sm text-gray-600">Adjust for different coloring tools</p>
        </div>

        <RadioGroup
          value={selectedThickness}
          onValueChange={(value) => form.setValue('lineThickness', value as LineThickness)}
          className="space-y-3"
          data-testid="thickness-selection"
        >
          {lineThicknessOptions.map((option) => {
            const isSelected = selectedThickness === option.value

            return (
              <div key={option.value} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={`thickness-${option.value}`}
                    data-testid={`thickness-${option.value}`}
                  />
                  <Label
                    htmlFor={`thickness-${option.value}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div
                        className={`w-6 h-6 border rounded ${
                          isSelected ? 'border-brand-warm-blue' : 'border-gray-300'
                        }`}
                        style={{
                          borderWidth: `${option.strokeWidth}px`,
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{option.label}</span>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </Label>
                </div>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* Parameter Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Selected Options</h4>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-600">Complexity:</span>{' '}
            <span className="font-medium" data-testid="complexity-preview">
              {complexityOptions.find(o => o.value === selectedComplexity)?.label}
            </span>
          </p>
          <p>
            <span className="text-gray-600">Line Thickness:</span>{' '}
            <span className="font-medium" data-testid="thickness-preview">
              {lineThicknessOptions.find(o => o.value === selectedThickness)?.label}
            </span>
          </p>
        </div>
      </div>

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