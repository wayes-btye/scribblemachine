'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Sparkles, Settings, Minus, RectangleHorizontal, Square, Palette, PaintBucket, Pen } from 'lucide-react'
import type { Complexity, LineThickness } from '@coloringpage/types'

interface ParameterControlsProps {
  complexity: Complexity
  lineThickness: LineThickness
  onComplexityChange: (value: Complexity) => void
  onLineThicknessChange: (value: LineThickness) => void
  disabled?: boolean
  compact?: boolean // For reduced spacing when needed
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
    badge: '1-2px',
    strokeWidth: '1'
  },
  {
    value: 'medium' as LineThickness,
    label: 'Medium Lines',
    description: 'Perfect balance for most ages',
    icon: Palette,
    badge: '2-3px',
    strokeWidth: '2'
  },
  {
    value: 'thick' as LineThickness,
    label: 'Thick Lines',
    description: 'Easy coloring for small hands',
    icon: PaintBucket,
    badge: '3-4px',
    strokeWidth: '4'
  }
]

export const ParameterControls = React.memo(function ParameterControls({
  complexity,
  lineThickness,
  onComplexityChange,
  onLineThicknessChange,
  disabled = false,
  compact = false
}: ParameterControlsProps) {
  const spacing = compact ? 'space-y-3' : 'space-y-5'
  const iconColor = {
    complexity: 'text-brand-warm-orange',
    thickness: 'text-brand-warm-green'
  }

  return (
    <ErrorBoundary fallback={
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-sm text-gray-600">Unable to load parameter controls. Please refresh the page.</p>
      </div>
    }>
      <div className={spacing}>
      {/* Complexity Selection */}
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className={`h-5 w-5 ${iconColor.complexity}`} />
            Complexity Level
          </h3>
          <p className="text-sm text-gray-600">Choose the right level of detail</p>
        </div>

        <RadioGroup
          value={complexity}
          onValueChange={onComplexityChange}
          className={compact ? "space-y-2" : "space-y-3"}
          data-testid="complexity-selection"
          aria-label="Complexity level selection"
        >
          {complexityOptions.map((option) => {
            const Icon = option.icon
            const isSelected = complexity === option.value

            return (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`complexity-${option.value}`}
                  className="peer sr-only"
                  disabled={disabled}
                  aria-describedby={`complexity-${option.value}-description`}
                />
                <Label
                  htmlFor={`complexity-${option.value}`}
                  className={`flex items-center space-x-3 ${compact ? 'p-3' : 'p-4'} rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 focus-within:ring-2 focus-within:ring-brand-warm-orange ${
                    isSelected
                      ? 'border-brand-warm-orange bg-brand-warm-orange/5'
                      : 'border-gray-200'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? iconColor.complexity : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1" id={`complexity-${option.value}-description`}>{option.description}</p>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      <Separator />

      {/* Line Thickness Selection */}
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Settings className={`h-5 w-5 ${iconColor.thickness}`} />
            Line Thickness
          </h3>
          <p className="text-sm text-gray-600">Perfect for different coloring tools</p>
        </div>

        <RadioGroup
          value={lineThickness}
          onValueChange={onLineThicknessChange}
          className={compact ? "space-y-2" : "space-y-3"}
          data-testid="thickness-selection"
          aria-label="Line thickness selection"
        >
          {thicknessOptions.map((option) => {
            const Icon = option.icon
            const isSelected = lineThickness === option.value

            return (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`thickness-${option.value}`}
                  className="peer sr-only"
                  disabled={disabled}
                  aria-describedby={`thickness-${option.value}-description`}
                />
                <Label
                  htmlFor={`thickness-${option.value}`}
                  className={`flex items-center space-x-3 ${compact ? 'p-3' : 'p-4'} rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 focus-within:ring-2 focus-within:ring-brand-warm-green ${
                    isSelected
                      ? 'border-brand-warm-green bg-brand-warm-green/5'
                      : 'border-gray-200'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? iconColor.thickness : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1" id={`thickness-${option.value}-description`}>{option.description}</p>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </div>

      {/* Parameter Preview */}
      <div className={`bg-gray-50 ${compact ? 'p-3' : 'p-4'} rounded-lg`} aria-label="Selected options summary">
        <h4 className="font-medium mb-2">Selected Options</h4>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-600">Complexity:</span>{' '}
            <span className="font-medium" data-testid="complexity-preview">
              {complexityOptions.find(o => o.value === complexity)?.label}
            </span>
          </p>
          <p>
            <span className="text-gray-600">Line Thickness:</span>{' '}
            <span className="font-medium" data-testid="thickness-preview">
              {thicknessOptions.find(o => o.value === lineThickness)?.label}
            </span>
          </p>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  )
})